import type { ProviderId } from './provider.js';

/** One persisted, fully-answered request. Basis for all aggregation. */
export interface UsageRecord {
  id: string;
  sessionId: string;
  userId: string;
  provider: ProviderId;
  model: string;
  knowledgeBaseId: string;
  question: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latencyMs: number;
  createdAt: string;
}

/** Rolled-up totals for a user, session, provider, or the whole system. */
export interface UsageAggregate {
  scope: 'user' | 'session' | 'provider' | 'system';
  key: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
}
