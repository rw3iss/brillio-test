import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import type { ChatRequest, ClientCommand, ProviderId } from '@brillio/shared';
import { ApiKeyService } from '../auth/api-key.service';
import { SessionService } from '../session/session.service';
import { ChatService } from '../chat/chat.service';
import type { EventSink } from './event-sink';

/**
 * The single entry point for every transport. A ClientCommand + an EventSink go
 * in; normalized ServerEvents come back over the sink. Neither WebSocket nor SSE
 * logic lives here — only routing, auth, and cancellation.
 */
@Injectable()
export class CommandDispatcher {
  private readonly logger = new Logger(CommandDispatcher.name);
  /** Active in-flight requests keyed by requestId, for cancellation. */
  private readonly inflight = new Map<string, AbortController>();

  constructor(
    private readonly apiKeys: ApiKeyService,
    private readonly sessions: SessionService,
    private readonly chat: ChatService,
  ) {}

  async dispatch(command: ClientCommand, sink: EventSink): Promise<void> {
    const requestId = command.id || uuid();

    if (!this.apiKeys.isValid(command.apiKey)) {
      sink.send({
        type: 'error',
        requestId,
        code: 'auth',
        message: 'Invalid or missing API key',
        recoverable: false,
      });
      return;
    }

    switch (command.type) {
      case 'chat':
        return this.runChat(requestId, command.payload as ChatRequest, sink);
      case 'switch_provider':
        return this.switchProvider(requestId, command.payload as { sessionId: string; provider: ProviderId }, sink);
      case 'cancel':
        return this.cancel(requestId, command.payload as { sessionId: string });
      case 'ping':
        sink.send({ type: 'ack', requestId, sessionId: '' });
        return;
      default:
        sink.send({
          type: 'error',
          requestId,
          code: 'bad_request',
          message: `Unknown command type: ${(command as ClientCommand).type}`,
          recoverable: false,
        });
    }
  }

  private async runChat(requestId: string, payload: ChatRequest, sink: EventSink): Promise<void> {
    const controller = new AbortController();
    this.inflight.set(requestId, controller);
    try {
      await this.chat.handleChat(payload, requestId, sink, controller.signal);
    } finally {
      this.inflight.delete(requestId);
    }
  }

  private switchProvider(
    requestId: string,
    payload: { sessionId: string; provider: ProviderId },
    sink: EventSink,
  ): void {
    try {
      const session = this.sessions.setProvider(payload.sessionId, payload.provider);
      sink.send({ type: 'ack', requestId, sessionId: session.id });
    } catch (err) {
      sink.send({
        type: 'error',
        requestId,
        code: 'bad_request',
        message: (err as Error).message,
        recoverable: false,
      });
    }
  }

  private cancel(requestId: string, payload: { sessionId: string }): void {
    // Cancel by explicit requestId if provided, else all in-flight (best effort).
    const target = this.inflight.get(requestId);
    if (target) {
      target.abort();
      return;
    }
    this.logger.debug(`Cancel requested for session ${payload.sessionId}`);
    for (const controller of this.inflight.values()) controller.abort();
  }
}
