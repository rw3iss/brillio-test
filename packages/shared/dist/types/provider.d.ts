/** Provider (a.k.a. "model" in the UI) identifiers exposed to clients. */
export type ProviderId = 'claude' | 'openai' | 'gemini' | 'mock';
export type ProviderStatus = 'available' | 'unavailable' | 'degraded';
export interface ProviderPricing {
    /** USD cost per 1,000,000 input tokens. */
    inputPer1M: number;
    /** USD cost per 1,000,000 output tokens. */
    outputPer1M: number;
    currency: string;
}
/** Public provider descriptor returned by GET /providers. */
export interface ProviderInfo {
    id: ProviderId;
    name: string;
    model: string;
    status: ProviderStatus;
    /** Human-readable reason when status !== 'available'. */
    statusReason?: string;
    pricing: ProviderPricing;
    contextWindow: number;
}
//# sourceMappingURL=provider.d.ts.map