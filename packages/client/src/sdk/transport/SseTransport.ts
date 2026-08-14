import {
  API_KEY_HEADER,
  ROUTES,
  type ChatRequest,
  type ProviderId,
  type ServerEvent,
  type ServerEventType,
} from '@brillio/shared';
import type { BrillioConfig } from '../config.js';
import { EventBus } from './EventBus.js';
import type { ServerEventHandler, StreamHandle, TransportManager } from './types.js';

/**
 * Fallback transport. Uses POST /chat with a `text/event-stream` response,
 * decoding each `data:` line as one ServerEvent so the UI stays identical to
 * the WebSocket path. Multiplexes many concurrent streams via one Abort
 * controller per request.
 */
export class SseTransport implements TransportManager {
  readonly kind = 'sse' as const;

  private readonly bus = new EventBus();
  private readonly controllers = new Map<string, AbortController>();

  constructor(private readonly config: BrillioConfig) {}

  connect(): Promise<void> {
    return Promise.resolve();
  }

  private dispatch(requestId: string, onEvent: ServerEventHandler, event: ServerEvent): void {
    onEvent(event);
    this.bus.emit(event);
    if (event.type === 'done' || event.type === 'error') {
      this.controllers.delete(requestId);
    }
  }

  sendChat(request: ChatRequest, requestId: string, onEvent: ServerEventHandler): StreamHandle {
    const controller = new AbortController();
    this.controllers.set(requestId, controller);
    void this.stream(request, requestId, onEvent, controller);
    return {
      requestId,
      cancel: () => this.cancel(request.sessionId ?? '', requestId),
    };
  }

  private async stream(
    request: ChatRequest,
    requestId: string,
    onEvent: ServerEventHandler,
    controller: AbortController,
  ): Promise<void> {
    try {
      const res = await fetch(`${this.config.baseUrl}${ROUTES.chat}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'text/event-stream',
          [API_KEY_HEADER]: this.config.apiKey,
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        this.dispatch(requestId, onEvent, {
          type: 'error',
          requestId,
          code: res.status === 401 || res.status === 403 ? 'auth' : 'internal',
          message: `Chat request failed (${res.status})`,
          recoverable: res.status >= 500,
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by a blank line.
        let sep: number;
        while ((sep = buffer.indexOf('\n\n')) !== -1) {
          const frame = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          this.consumeFrame(frame, requestId, onEvent);
        }
      }
      if (buffer.trim()) this.consumeFrame(buffer, requestId, onEvent);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      this.dispatch(requestId, onEvent, {
        type: 'error',
        requestId,
        code: 'internal',
        message: `Stream error: ${(err as Error).message}`,
        recoverable: true,
      });
    }
  }

  private consumeFrame(frame: string, requestId: string, onEvent: ServerEventHandler): void {
    for (const line of frame.split('\n')) {
      const trimmed = line.trimStart();
      if (!trimmed.startsWith('data:')) continue;
      const json = trimmed.slice(5).trim();
      if (!json || json === '[DONE]') continue;
      try {
        const event = JSON.parse(json) as ServerEvent;
        this.dispatch(requestId, onEvent, event);
      } catch {
        // skip malformed frame
      }
    }
  }

  switchProvider(_sessionId: string, _provider: ProviderId, requestId: string): void {
    // SSE has no back-channel; provider is chosen per-request via ChatRequest.
    // Emit an informational error so the caller can fall back to per-request selection.
    this.bus.emit({
      type: 'error',
      requestId,
      code: 'bad_request',
      message: 'Provider switch is applied on the next message over the HTTP transport.',
      recoverable: true,
      suggestion: 'switch_provider',
    });
  }

  cancel(_sessionId: string, requestId: string): void {
    this.controllers.get(requestId)?.abort();
    this.controllers.delete(requestId);
  }

  on(type: ServerEventType, cb: ServerEventHandler): () => void {
    return this.bus.on(type, cb);
  }

  close(): void {
    for (const c of this.controllers.values()) c.abort();
    this.controllers.clear();
    this.bus.clear();
  }
}
