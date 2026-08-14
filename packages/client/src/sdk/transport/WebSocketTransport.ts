import {
  WS_PATH,
  type ChatRequest,
  type ClientCommand,
  type ProviderId,
  type ServerEvent,
  type ServerEventType,
} from '@brillio/shared';
import type { BrillioConfig } from '../config.js';
import { BrillioError } from '../errors.js';
import { EventBus } from './EventBus.js';
import type { ServerEventHandler, StreamHandle, TransportManager } from './types.js';

/**
 * Primary transport. A single multiplexed socket carries every command; server
 * events are routed back to the originating request by `requestId`.
 */
export class WebSocketTransport implements TransportManager {
  readonly kind = 'ws' as const;

  private socket: WebSocket | null = null;
  private readonly bus = new EventBus();
  private readonly perRequest = new Map<string, ServerEventHandler>();
  private readonly outbox: string[] = [];
  private connecting: Promise<void> | null = null;

  constructor(private readonly config: BrillioConfig) {}

  private wsUrl(): string {
    // Same-origin default (Vite proxies /ws). If a baseUrl is set, derive
    // ws(s):// from it; the API key rides as a query param since browser
    // WebSocket cannot set custom headers.
    const base = this.config.baseUrl || window.location.origin;
    const u = new URL(base);
    u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
    u.pathname = WS_PATH;
    u.search = `?apiKey=${encodeURIComponent(this.config.apiKey)}`;
    return u.toString();
  }

  connect(): Promise<void> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) return Promise.resolve();
    if (this.connecting) return this.connecting;

    this.connecting = new Promise<void>((resolve, reject) => {
      let socket: WebSocket;
      try {
        socket = new WebSocket(this.wsUrl());
      } catch (err) {
        reject(new BrillioError({ code: 'internal', message: (err as Error).message }));
        return;
      }
      this.socket = socket;

      socket.onopen = () => {
        while (this.outbox.length) socket.send(this.outbox.shift()!);
        resolve();
      };
      socket.onerror = () => {
        reject(
          new BrillioError({
            code: 'internal',
            message: 'WebSocket connection failed',
            recoverable: true,
          }),
        );
      };
      socket.onclose = () => {
        this.socket = null;
        this.connecting = null;
      };
      socket.onmessage = (ev) => this.onMessage(ev.data);
    });
    return this.connecting;
  }

  private onMessage(raw: unknown): void {
    if (typeof raw !== 'string') return;
    let event: ServerEvent;
    try {
      event = JSON.parse(raw) as ServerEvent;
    } catch {
      return;
    }
    const handler = this.perRequest.get(event.requestId);
    if (handler) handler(event);
    this.bus.emit(event);
    if (event.type === 'done' || event.type === 'error') {
      this.perRequest.delete(event.requestId);
    }
  }

  private send(command: ClientCommand): void {
    const frame = JSON.stringify(command);
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(frame);
    } else {
      this.outbox.push(frame);
      void this.connect();
    }
  }

  sendChat(request: ChatRequest, requestId: string, onEvent: ServerEventHandler): StreamHandle {
    this.perRequest.set(requestId, onEvent);
    const command: ClientCommand<ChatRequest> = {
      id: requestId,
      type: 'chat',
      apiKey: this.config.apiKey,
      payload: request,
    };
    void this.connect().then(() => this.send(command));
    return {
      requestId,
      cancel: () => {
        if (request.sessionId) this.cancel(request.sessionId, requestId);
        this.perRequest.delete(requestId);
      },
    };
  }

  switchProvider(sessionId: string, provider: ProviderId, requestId: string): void {
    this.send({
      id: requestId,
      type: 'switch_provider',
      apiKey: this.config.apiKey,
      payload: { sessionId, provider },
    });
  }

  cancel(sessionId: string, requestId: string): void {
    this.send({
      id: requestId,
      type: 'cancel',
      apiKey: this.config.apiKey,
      payload: { sessionId },
    });
  }

  on(type: ServerEventType, cb: ServerEventHandler): () => void {
    return this.bus.on(type, cb);
  }

  close(): void {
    this.socket?.close();
    this.socket = null;
    this.connecting = null;
    this.perRequest.clear();
    this.bus.clear();
  }
}
