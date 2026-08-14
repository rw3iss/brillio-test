import type { ProviderId, ProviderPricing } from '@brillio/shared';

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  model: string;
  apiKeyEnv: string;
  contextWindow: number;
  pricing: ProviderPricing;
  enabled: boolean;
}

export interface AppConfig {
  server: { port: number; corsOrigins: string[] };
  auth: { apiKeys: string[] };
  defaults: { provider: ProviderId; systemPromptRef: string };
  rag: { chunkSize: number; chunkOverlap: number; topK: number; minScore: number };
  warnings: { warnPercent: number; criticalPercent: number };
  providers: ProviderConfig[];
  systemPrompts: Record<string, string>;
}
