import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import {
  computeCost,
  estimateTokens,
  percentOfContext,
  type ChatRequest,
  type ErrorCode,
  type Message,
  type ProviderId,
  type ResponseMeta,
  type SessionUsageSummary,
} from '@brillio/shared';
import { AppConfigService } from '../config/config.service';
import { RagService } from '../knowledge-base/rag.service';
import { KbIndexService } from '../knowledge-base/kb-index.service';
import { SessionService } from '../session/session.service';
import { UsageService } from '../usage/usage.service';
import { ProviderRouter } from '../providers/provider-router.service';
import { ProviderError, type ChatProvider } from '../providers/provider.types';
import type { EventSink } from '../transport/event-sink';

const CONTEXT_MARKER = 'KNOWLEDGE BASE CONTEXT:';

/**
 * Orchestrates one chat turn: RAG grounding → provider streaming (with
 * automatic fallback) → live token relay → usage/cost persistence. Fully
 * transport-agnostic; it only touches the provided EventSink.
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly config: AppConfigService,
    private readonly kbIndex: KbIndexService,
    private readonly rag: RagService,
    private readonly sessions: SessionService,
    private readonly usage: UsageService,
    private readonly router: ProviderRouter,
  ) {}

  async handleChat(
    payload: ChatRequest,
    requestId: string,
    sink: EventSink,
    signal: AbortSignal,
  ): Promise<void> {
    const started = Date.now();
    try {
      if (!payload.messages?.length) {
        return this.fail(sink, requestId, 'bad_request', 'No messages provided', false);
      }
      if (!this.kbIndex.hasGroup(payload.knowledgeBaseId)) {
        return this.fail(
          sink,
          requestId,
          'no_knowledge_base',
          `Unknown knowledge base: ${payload.knowledgeBaseId}`,
          false,
        );
      }

      const userId = payload.userId ?? 'anonymous';
      const desired = payload.provider;
      const systemPrompt = this.config.resolveSystemPrompt(payload.systemPrompt);

      // Resolve or create the session, then append the incoming turn(s).
      const session = payload.sessionId
        ? this.sessions.setProvider(payload.sessionId, desired)
        : this.sessions.create({
            userId,
            knowledgeBaseId: payload.knowledgeBaseId,
            provider: desired,
            systemPrompt,
          });

      for (const m of payload.messages) {
        this.sessions.addMessage(session.id, this.toMessage(m.role, m.content));
      }
      if (sink.isOpen) sink.send({ type: 'ack', requestId, sessionId: session.id });

      const question =
        [...payload.messages].reverse().find((m) => m.role === 'user')?.content ?? '';

      // RAG grounding.
      const { sources, contextText } = this.rag.retrieve(payload.knowledgeBaseId, question);
      if (sink.isOpen) sink.send({ type: 'sources', requestId, sources });

      const groundedSystem =
        `${systemPrompt}\n\n${CONTEXT_MARKER}\n` +
        (contextText || '(no relevant documents were found for this question)');

      const history = this.sessions.history(session.id);

      // Provider streaming with automatic fallback.
      const candidates = this.router.fallbackOrder(desired);
      let assistantText = '';
      let inputTokens = 0;
      let outputTokens = 0;
      let usedProvider: ProviderId | null = null;

      for (let i = 0; i < candidates.length; i++) {
        const provider = candidates[i];
        if (i > 0 || provider.id !== desired) {
          this.notifySwitch(sink, requestId, desired, provider.id, candidates, i);
        }
        try {
          const result = await this.streamProvider(
            provider,
            { model: this.config.getProvider(provider.id)?.model ?? provider.id, systemPrompt: groundedSystem, messages: history, signal },
            requestId,
            sink,
          );
          assistantText = result.text;
          inputTokens = result.inputTokens || estimateTokens(groundedSystem + question);
          outputTokens = result.outputTokens || estimateTokens(assistantText);
          usedProvider = provider.id;
          break;
        } catch (err) {
          const handled = this.handleProviderError(err, sink, requestId, i === candidates.length - 1);
          if (handled === 'stop') return;
          // otherwise continue to next candidate
        }
      }

      if (!usedProvider) {
        return this.fail(sink, requestId, 'provider_unavailable', 'All providers failed', true);
      }

      const latencyMs = Date.now() - started;
      const pricing = this.router.pricing(usedProvider);
      const cost = computeCost({ inputTokens, outputTokens }, pricing);

      // Persist assistant message + usage record.
      this.sessions.addMessage(session.id, {
        ...this.toMessage('assistant', assistantText),
        providerId: usedProvider,
        usage: { inputTokens, outputTokens },
        cost,
      });
      this.usage.record({
        sessionId: session.id,
        userId,
        provider: usedProvider,
        model: this.config.getProvider(usedProvider)?.model ?? usedProvider,
        knowledgeBaseId: payload.knowledgeBaseId,
        question,
        inputTokens,
        outputTokens,
        cost,
        latencyMs,
      });

      // Live usage + threshold warnings.
      const sessionUsage = this.buildUsage(session.id, usedProvider, inputTokens, outputTokens);
      if (sink.isOpen) sink.send({ type: 'usage', requestId, usage: sessionUsage });
      this.maybeWarn(sink, requestId, sessionUsage.percentUsed);

      const meta: ResponseMeta = {
        inputTokens,
        outputTokens,
        cost,
        model: usedProvider,
        latencyMs,
        sourceChunks: sources,
      };
      if (sink.isOpen) {
        sink.send({ type: 'done', requestId, sessionId: session.id, meta, sessionUsage });
      }
    } catch (err) {
      this.logger.error(`handleChat failed: ${(err as Error).message}`, (err as Error).stack);
      this.fail(sink, requestId, 'internal', (err as Error).message, true);
    }
  }

  private async streamProvider(
    provider: ChatProvider,
    params: { model: string; systemPrompt: string; messages: { role: 'user' | 'assistant'; content: string }[]; signal: AbortSignal },
    requestId: string,
    sink: EventSink,
  ): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
    let text = '';
    let inputTokens = 0;
    let outputTokens = 0;
    for await (const ev of provider.stream(params)) {
      if (params.signal.aborted) break;
      if (ev.type === 'token') {
        text += ev.text;
        if (sink.isOpen) sink.send({ type: 'token', requestId, text: ev.text });
      } else if (ev.type === 'thinking') {
        if (sink.isOpen) sink.send({ type: 'thinking', requestId, text: ev.text });
      } else if (ev.type === 'usage') {
        inputTokens = ev.inputTokens;
        outputTokens = ev.outputTokens;
      }
    }
    return { text, inputTokens, outputTokens };
  }

  private handleProviderError(
    err: unknown,
    sink: EventSink,
    requestId: string,
    isLast: boolean,
  ): 'continue' | 'stop' {
    if (err instanceof ProviderError) {
      if (err.code === 'rate_limit' && sink.isOpen) {
        sink.send({
          type: 'error',
          requestId,
          code: 'rate_limit',
          message: `${err.provider} is rate-limited. Falling back; you may also wait and retry.`,
          recoverable: true,
          suggestion: 'wait_or_switch',
        });
      }
      this.logger.warn(`Provider ${err.provider} failed (${err.code}); ${isLast ? 'no more fallbacks' : 'trying next'}`);
      return 'continue';
    }
    this.logger.warn(`Unexpected provider error: ${(err as Error).message}`);
    return 'continue';
  }

  private notifySwitch(
    sink: EventSink,
    requestId: string,
    desired: ProviderId,
    to: ProviderId,
    candidates: ChatProvider[],
    index: number,
  ): void {
    if (to === desired) return;
    const from = index === 0 ? desired : candidates[index - 1].id;
    if (sink.isOpen) {
      sink.send({
        type: 'provider_switched',
        requestId,
        from,
        to,
        reason: `${from} unavailable — switched to ${to}`,
      });
    }
  }

  private buildUsage(
    sessionId: string,
    provider: ProviderId,
    lastInput: number,
    lastOutput: number,
  ): SessionUsageSummary {
    const totals = this.usage.sessionTotals(sessionId);
    const contextWindow = this.router.contextWindow(provider);
    // percentUsed reflects the CURRENT context footprint (latest turn), not the
    // cumulative lifetime sum, since history is re-sent each turn.
    const currentContext = lastInput + lastOutput;
    return {
      sessionId,
      provider,
      inputTokens: totals.inputTokens,
      outputTokens: totals.outputTokens,
      totalTokens: totals.inputTokens + totals.outputTokens,
      cost: Math.round(totals.cost * 1_000_000) / 1_000_000,
      contextWindow,
      percentUsed: percentOfContext(currentContext, contextWindow),
    };
  }

  private maybeWarn(sink: EventSink, requestId: string, percent: number): void {
    if (!sink.isOpen) return;
    const { warnPercent, criticalPercent } = this.config.warnings;
    if (percent >= criticalPercent) {
      sink.send({
        type: 'warning',
        requestId,
        level: 'critical',
        percentUsed: percent,
        message: `Context usage critical (${percent.toFixed(0)}%). Consider a new session or a larger-context model.`,
      });
    } else if (percent >= warnPercent) {
      sink.send({
        type: 'warning',
        requestId,
        level: 'warn',
        percentUsed: percent,
        message: `Context usage high (${percent.toFixed(0)}%).`,
      });
    }
  }

  private fail(
    sink: EventSink,
    requestId: string,
    code: ErrorCode,
    message: string,
    recoverable: boolean,
  ): void {
    if (sink.isOpen) {
      sink.send({ type: 'error', requestId, code, message, recoverable });
    }
  }

  private toMessage(role: string, content: string): Message {
    return {
      id: uuid(),
      role: role as Message['role'],
      content,
      createdAt: new Date().toISOString(),
    };
  }
}
