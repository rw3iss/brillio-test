import type { Message } from './chat.js';
import type { ProviderId } from './provider.js';
/** Live token/cost accounting for a session against a provider's context window. */
export interface SessionUsageSummary {
    sessionId: string;
    provider: ProviderId;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
    contextWindow: number;
    /** totalTokens / contextWindow * 100, clamped to [0,100]. */
    percentUsed: number;
}
export interface Session {
    id: string;
    userId: string;
    knowledgeBaseId: string;
    /** Provider currently selected for the session (may change over time). */
    provider: ProviderId;
    systemPrompt: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messages: Message[];
}
/** Lightweight session descriptor for list views. */
export interface SessionSummary {
    id: string;
    userId: string;
    knowledgeBaseId: string;
    provider: ProviderId;
    title: string;
    createdAt: string;
    updatedAt: string;
    messageCount: number;
}
export type ExportFormat = 'json' | 'csv';
//# sourceMappingURL=session.d.ts.map