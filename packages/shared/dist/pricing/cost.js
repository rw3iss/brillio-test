"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeCost = computeCost;
exports.percentOfContext = percentOfContext;
exports.buildSessionUsage = buildSessionUsage;
exports.estimateTokens = estimateTokens;
exports.findPricing = findPricing;
/** Estimated USD cost for a token usage against a provider's pricing. */
function computeCost(usage, pricing) {
    const input = (usage.inputTokens / 1_000_000) * pricing.inputPer1M;
    const output = (usage.outputTokens / 1_000_000) * pricing.outputPer1M;
    return round6(input + output);
}
/** Percentage of a context window consumed, clamped to [0, 100]. */
function percentOfContext(totalTokens, contextWindow) {
    if (contextWindow <= 0)
        return 0;
    return Math.min(100, Math.max(0, (totalTokens / contextWindow) * 100));
}
/** Build a live session-usage summary from accumulated totals. */
function buildSessionUsage(params) {
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
function estimateTokens(text) {
    if (!text)
        return 0;
    return Math.max(1, Math.ceil(text.length / 4));
}
function findPricing(providers, id) {
    return providers.find((p) => p.id === id)?.pricing;
}
function round6(n) {
    return Math.round(n * 1_000_000) / 1_000_000;
}
//# sourceMappingURL=cost.js.map