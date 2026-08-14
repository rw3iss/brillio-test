import type { ChatRequest, ProviderId, ServerEvent, ServerEventType } from '@brillio/shared';

export type ServerEventHandler = (event: ServerEvent) => void;

/**
 * Per-request stream handlers. `sendChat` returns a handle so a single request
 * can be cancelled independently of others multiplexed over the same socket.
 */
export interface StreamHandle {
  requestId: string;
  cancel(): void;
}

/**
 * Transport-agnostic streaming contract. WebSocket and SSE implementations
 * normalize their wire formats to the same ServerEvent stream so the
 * controller/UI never branch on transport.
 */
export interface TransportManager {
  readonly kind: 'ws' | 'sse';

  /** Establish the connection (no-op / lazy for SSE). */
  connect(): Promise<void>;

  /** Start a chat stream. Events are delivered to `onEvent` and global listeners. */
  sendChat(request: ChatRequest, requestId: string, onEvent: ServerEventHandler): StreamHandle;

  /** Ask the server to switch the provider for an active session. */
  switchProvider(sessionId: string, provider: ProviderId, requestId: string): void;

  /** Cancel an in-flight generation for a session. */
  cancel(sessionId: string, requestId: string): void;

  /** Subscribe to every event of a type across all requests. Returns unsubscribe. */
  on(type: ServerEventType, cb: ServerEventHandler): () => void;

  close(): void;
}
