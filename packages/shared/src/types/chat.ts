import type { ProviderId } from './provider.js';

export type Role = 'system' | 'user' | 'assistant';

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  /** Which provider produced this message (assistant messages only). */
  providerId?: ProviderId;
  createdAt: string; // ISO
  usage?: TokenUsage;
  /** Estimated USD cost of producing this message. */
  cost?: number;
}

/** A knowledge-base chunk that contributed to an answer. */
export interface SourceChunk {
  documentId: string;
  documentName: string;
  snippet: string;
  score: number;
}

/** Payload of the main POST /chat operation (also carried as a 'chat' command). */
export interface ChatRequest {
  /** Provider/model selector. */
  provider: ProviderId;
  /** Conversation input. Server merges with stored session history. */
  messages: Pick<Message, 'role' | 'content'>[];
  /** Overrides the configured default system prompt when provided. */
  systemPrompt?: string;
  /** Target knowledge-base group id. */
  knowledgeBaseId: string;
  /** Existing session to continue; omit to start a new one. */
  sessionId?: string;
  /** Caller identity for usage attribution. */
  userId?: string;
}

/** Terminal metadata for a single answered question. */
export interface ResponseMeta {
  inputTokens: number;
  outputTokens: number;
  cost: number;
  model: ProviderId;
  latencyMs: number;
  sourceChunks: SourceChunk[];
}
