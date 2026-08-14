import type { ServerEvent } from '@brillio/shared';

/**
 * Transport-agnostic output channel. WebSocket frames and SSE writes both
 * implement this, so the command dispatcher and chat orchestrator never know
 * which transport carried the request.
 */
export interface EventSink {
  send(event: ServerEvent): void;
  close(): void;
  readonly isOpen: boolean;
}
