import type { ProviderPricing, ProviderInfo } from '../types/provider.js';
import type { TokenUsage } from '../types/chat.js';
import type { SessionUsageSummary } from '../types/session.js';
import type { ProviderId } from '../types/provider.js';
/** Estimated USD cost for a token usage against a provider's pricing. */
export declare function computeCost(usage: TokenUsage, pricing: ProviderPricing): number;
/** Percentage of a context window consumed, clamped to [0, 100]. */
export declare function percentOfContext(totalTokens: number, contextWindow: number): number;
/** Build a live session-usage summary from accumulated totals. */
export declare function buildSessionUsage(params: {
    sessionId: string;
    provider: ProviderId;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    contextWindow: number;
}): SessionUsageSummary;
/** Rough token estimate (~4 chars/token) for pre-flight input accounting. */
export declare function estimateTokens(text: string): number;
export declare function findPricing(providers: ProviderInfo[], id: ProviderId): ProviderPricing | undefined;
//# sourceMappingURL=cost.d.ts.map