import type { ProviderPricing, ProviderInfo } from '../types/provider.js';
import type { TokenUsage } from '../types/chat.js';
import type { SessionUsageSummary } from '../types/session.js';
import type { ProviderId } from '../types/provider.js';

/** Estimated USD cost for a token usage against a provider's pricing. */
export function computeCost(usage: TokenUsage, pricing: ProviderPricing): number {
  const input = (usage.inputTokens / 1_000_000) * pricing.inputPer1M;
  const output = (usage.outputTokens / 1_000_000) * pricing.outputPer1M;
  return round6(input + output);
}

/** Percentage of a context window consumed, clamped to [0, 100]. */
export function percentOfContext(totalTokens: number, contextWindow: number): number {
  if (contextWindow <= 0) return 0;
  return Math.min(100, Math.max(0, (totalTokens / contextWindow) * 100));
}

/** Build a live session-usage summary from accumulated totals. */
export function buildSessionUsage(params: {
  sessionId: string;
  provider: ProviderId;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  contextWindow: number;
}): SessionUsageSummary {
  const totalTokens = params.inputTokens + params.outputTokens;
  return {
    sessionId: params.sessionId,
    provider: params.provider,
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    totalTokens,
    cost: round6(params.cost),
    contextWindow: params.contextWindow,
    percentUsed: percentOfContext(totalTokens, params.contextWindow),
  };
}

/** Rough token estimate (~4 chars/token) for pre-flight input accounting. */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export function findPricing(providers: ProviderInfo[], id: ProviderId): ProviderPricing | undefined {
  return providers.find((p) => p.id === id)?.pricing;
}

function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}
