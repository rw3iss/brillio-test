import type { ChatRequest, ResponseMeta, SourceChunk } from '../types/chat.js';
import type { ProviderId } from '../types/provider.js';
import type { SessionUsageSummary } from '../types/session.js';

/**
 * Transport-agnostic messaging contract. The same envelopes flow over
 * WebSocket frames and over SSE/HTTP bodies; neither layer interprets the
 * payload — they only carry it to/from the command dispatcher.
 */

export type CommandType = 'chat' | 'switch_provider' | 'cancel' | 'ping';

/** Client -> server envelope. */
export interface ClientCommand<T = unknown> {
  /** Correlation id; every ServerEvent for this command echoes it as requestId. */
  id: string;
  type: CommandType;
  /** Validated by the backend api-key guard. */
  apiKey: string;
  payload: T;
}

export type ChatCommand = ClientCommand<ChatRequest> & { type: 'chat' };
export type SwitchProviderCommand = ClientCommand<{
  sessionId: string;
  provider: ProviderId;
}> & { type: 'switch_provider' };
export type CancelCommand = ClientCommand<{ sessionId: string }> & { type: 'cancel' };
export type PingCommand = ClientCommand<Record<string, never>> & { type: 'ping' };

/** Warning severities surfaced from live context-usage checks. */
export type WarningLevel = 'warn' | 'critical';

/** Machine-readable error categories for graceful client handling. */
export type ErrorCode =
  | 'auth'
  | 'rate_limit'
  | 'provider_unavailable'
  | 'no_knowledge_base'
  | 'bad_request'
  | 'internal';

/** Server -> client streamed events (discriminated union on `type`). */
export type ServerEvent =
  | { type: 'ack'; requestId: string; sessionId: string }
  | { type: 'token'; requestId: string; text: string }
  | { type: 'thinking'; requestId: string; text: string }
  | { type: 'sources'; requestId: string; sources: SourceChunk[] }
  | { type: 'usage'; requestId: string; usage: SessionUsageSummary }
  | {
      type: 'warning';
      requestId: string;
      level: WarningLevel;
      percentUsed: number;
      message: string;
    }
  | {
      type: 'provider_switched';
      requestId: string;
      from: ProviderId;
      to: ProviderId;
      reason: string;
    }
  | {
      type: 'done';
      requestId: string;
      sessionId: string;
      meta: ResponseMeta;
      sessionUsage: SessionUsageSummary;
    }
  | {
      type: 'error';
      requestId: string;
      code: ErrorCode;
      message: string;
      recoverable: boolean;
      /** Optional suggested action, e.g. "switch_provider" or "wait". */
      suggestion?: string;
    };

export type ServerEventType = ServerEvent['type'];
