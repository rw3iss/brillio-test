import type { ProviderId } from '@brillio/shared';

/** Normalized events every adapter emits, regardless of vendor SDK shape. */
export type ProviderEvent =
  | { type: 'token'; text: string }
  | { type: 'thinking'; text: string }
  | { type: 'usage'; inputTokens: number; outputTokens: number };

export interface ProviderStreamParams {
  model: string;
  systemPrompt: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  signal?: AbortSignal;
}

/** Raised by adapters so the router can decide fallback vs. surfacing. */
export class ProviderError extends Error {
  constructor(
    message: string,
    readonly code: 'rate_limit' | 'auth' | 'unavailable' | 'internal',
    readonly provider: ProviderId,
    readonly retryable = false,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

/**
 * The single interface implemented by every provider. Lifecycle:
 * check availability, then consume the async event stream.
 */
export interface ChatProvider {
  readonly id: ProviderId;
  isAvailable(): boolean;
  unavailableReason(): string | undefined;
  stream(params: ProviderStreamParams): AsyncIterable<ProviderEvent>;
}

export const CHAT_PROVIDERS = Symbol('CHAT_PROVIDERS');
