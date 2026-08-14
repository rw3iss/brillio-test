import {
  DEFAULT_CRITICAL_PERCENT,
  DEFAULT_WARN_PERCENT,
  buildSessionUsage,
  type ChatRequest,
  type Message,
  type ProviderId,
  type ServerEvent,
  type SessionUsageSummary,
  type SourceChunk,
} from '@brillio/shared';
import { BrillioError } from './errors.js';
import type { StreamHandle, TransportManager } from './transport/types.js';

export type StreamStatus = 'idle' | 'streaming' | 'error';
export type UsageLevel = 'normal' | 'warn' | 'critical';

/** Immutable snapshot the UI renders from. */
export interface SessionState {
  sessionId?: string;
  knowledgeBaseId: string;
  provider: ProviderId;
  userId: string;
  messages: Message[];
  /** Text accumulating for the in-flight assistant reply (not yet committed). */
  streamingText: string;
  /** Optional "thinking" trace shown while the model reasons. */
  thinkingText: string;
  status: StreamStatus;
  usage?: SessionUsageSummary;
  /** percentUsed-derived level driving the token bar color. */
  usageLevel: UsageLevel;
  activeRequestId?: string;
}

type Listener = (state: SessionState) => void;
type ErrorSink = (err: BrillioError) => void;

let counter = 0;
const genId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

function levelFor(percentUsed: number): UsageLevel {
  if (percentUsed >= DEFAULT_CRITICAL_PERCENT) return 'critical';
  if (percentUsed >= DEFAULT_WARN_PERCENT) return 'warn';
  return 'normal';
}

/**
 * Owns a single session's state machine. It is the only place ServerEvents are
 * folded into messages/usage; the transport just delivers events and the UI
 * just subscribes. Events are matched to this session by requestId (the active
 * request) or by the sessionId echoed on ack/done.
 */
export class SessionController {
  private state: SessionState;
  private readonly listeners = new Set<Listener>();
  private handle: StreamHandle | null = null;
  private contextWindow: number;

  constructor(
    private readonly transport: TransportManager,
    private readonly onError: ErrorSink,
    init: {
      knowledgeBaseId: string;
      provider: ProviderId;
      userId: string;
      contextWindow: number;
      sessionId?: string;
      messages?: Message[];
    },
  ) {
    this.contextWindow = init.contextWindow;
    this.state = {
      sessionId: init.sessionId,
      knowledgeBaseId: init.knowledgeBaseId,
      provider: init.provider,
      userId: init.userId,
      messages: init.messages ?? [],
      streamingText: '',
      thinkingText: '',
      status: 'idle',
      usageLevel: 'normal',
    };
  }

  getState(): SessionState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private set(patch: Partial<SessionState>): void {
    this.state = { ...this.state, ...patch };
    for (const l of this.listeners) l(this.state);
  }

  setContextWindow(contextWindow: number): void {
    this.contextWindow = contextWindow;
  }

  /** Send a user message and begin streaming the assistant reply. */
  ask(content: string): void {
    if (this.state.status === 'streaming') return;
    const trimmed = content.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      id: genId('m'),
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    const requestId = genId('req');

    this.set({
      messages: [...this.state.messages, userMessage],
      streamingText: '',
      thinkingText: '',
      status: 'streaming',
      activeRequestId: requestId,
    });

    const request: ChatRequest = {
      provider: this.state.provider,
      knowledgeBaseId: this.state.knowledgeBaseId,
      sessionId: this.state.sessionId,
      userId: this.state.userId,
      messages: this.state.messages.map((m) => ({ role: m.role, content: m.content })),
    };

    this.handle = this.transport.sendChat(request, requestId, (event) => this.apply(event));
  }

  /** Ask the backend to switch provider for the live session (WS back-channel). */
  switchProvider(provider: ProviderId, contextWindow: number): void {
    const previous = this.state.provider;
    this.set({ provider });
    this.setContextWindow(contextWindow);
    if (this.state.sessionId && previous !== provider) {
      this.transport.switchProvider(this.state.sessionId, provider, genId('req'));
    }
  }

  cancel(): void {
    if (this.state.status !== 'streaming') return;
    this.handle?.cancel();
    this.commitAssistant();
    this.set({ status: 'idle', activeRequestId: undefined });
  }

  private ownsEvent(event: ServerEvent): boolean {
    if (event.requestId && event.requestId === this.state.activeRequestId) return true;
    if ('sessionId' in event && event.sessionId && event.sessionId === this.state.sessionId) {
      return true;
    }
    return false;
  }

  /** Fold a ServerEvent into state. Public so a router can call it directly. */
  apply(event: ServerEvent): void {
    if (!this.ownsEvent(event)) return;

    switch (event.type) {
      case 'ack':
        this.set({ sessionId: event.sessionId });
        break;

      case 'thinking':
        this.set({ thinkingText: this.state.thinkingText + event.text });
        break;

      case 'token':
        this.set({ streamingText: this.state.streamingText + event.text });
        break;

      case 'sources':
        this.attachSources(event.sources);
        break;

      case 'usage':
        this.applyUsage(event.usage);
        break;

      case 'warning':
        this.set({ usageLevel: event.level === 'critical' ? 'critical' : 'warn' });
        break;

      case 'provider_switched':
        this.set({ provider: event.to });
        break;

      case 'done':
        this.commitAssistant(event.meta.cost, {
          inputTokens: event.meta.inputTokens,
          outputTokens: event.meta.outputTokens,
        });
        this.applyUsage(event.sessionUsage);
        this.set({ status: 'idle', activeRequestId: undefined, thinkingText: '' });
        break;

      case 'error':
        this.set({ status: 'error', activeRequestId: undefined });
        this.onError(
          new BrillioError({
            code: event.code,
            message: event.message,
            recoverable: event.recoverable,
            suggestion: event.suggestion,
            requestId: event.requestId,
          }),
        );
        break;
    }
  }

  private applyUsage(usage: SessionUsageSummary): void {
    const merged = usage.contextWindow
      ? usage
      : buildSessionUsage({ ...usage, contextWindow: this.contextWindow });
    this.set({ usage: merged, usageLevel: levelFor(merged.percentUsed) });
  }

  private attachSources(sources: SourceChunk[]): void {
    // Sources arrive before `done`; stash on a placeholder assistant message so
    // they render beneath the answer once committed. We keep them on state via
    // the streaming message: commit reads them back through pendingSources.
    this.pendingSources = sources;
  }

  private pendingSources: SourceChunk[] = [];

  private commitAssistant(cost?: number, usage?: { inputTokens: number; outputTokens: number }): void {
    const text = this.state.streamingText;
    if (!text) {
      this.pendingSources = [];
      return;
    }
    const assistant: Message & { sources?: SourceChunk[] } = {
      id: genId('m'),
      role: 'assistant',
      content: text,
      providerId: this.state.provider,
      createdAt: new Date().toISOString(),
      cost,
      usage,
      sources: this.pendingSources.length ? this.pendingSources : undefined,
    };
    this.pendingSources = [];
    this.set({ messages: [...this.state.messages, assistant], streamingText: '' });
  }

  dispose(): void {
    this.handle?.cancel();
    this.listeners.clear();
  }
}

/** Assistant messages may carry the sources that produced them. */
export type AssistantMessage = Message & { sources?: SourceChunk[] };
