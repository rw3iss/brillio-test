import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import type {
  ExportFormat,
  Message,
  ProviderId,
  Session,
  SessionSummary,
} from '@brillio/shared';
import { SessionRepository } from '../persistence/session.repository';

interface CreateParams {
  userId: string;
  knowledgeBaseId: string;
  provider: ProviderId;
  systemPrompt: string;
  title?: string;
}

/** Owns session lifecycle; storage is provider-agnostic and survives model switches. */
@Injectable()
export class SessionService {
  private readonly cache = new Map<string, Session>();

  constructor(private readonly repo: SessionRepository) {}

  create(params: CreateParams): Session {
    const now = new Date().toISOString();
    const session: Session = {
      id: uuid(),
      userId: params.userId,
      knowledgeBaseId: params.knowledgeBaseId,
      provider: params.provider,
      systemPrompt: params.systemPrompt,
      title: params.title ?? 'New session',
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    this.persist(session);
    return session;
  }

  get(id: string): Session | undefined {
    if (this.cache.has(id)) return this.cache.get(id);
    const found = this.repo.findById(id);
    if (found) this.cache.set(id, found);
    return found;
  }

  getOrThrow(id: string): Session {
    const s = this.get(id);
    if (!s) throw new NotFoundException(`Session ${id} not found`);
    return s;
  }

  listByUser(userId: string): SessionSummary[] {
    return this.repo.listByUser(userId);
  }

  addMessage(sessionId: string, message: Message): Session {
    const session = this.getOrThrow(sessionId);
    session.messages.push(message);
    if (session.messages.length === 1 && message.role === 'user') {
      session.title = message.content.slice(0, 60);
    }
    session.updatedAt = new Date().toISOString();
    this.persist(session);
    return session;
  }

  setProvider(sessionId: string, provider: ProviderId): Session {
    const session = this.getOrThrow(sessionId);
    session.provider = provider;
    session.updatedAt = new Date().toISOString();
    this.persist(session);
    return session;
  }

  /** History replayed to a provider (system prompt handled separately). */
  history(sessionId: string): { role: 'user' | 'assistant'; content: string }[] {
    return this.getOrThrow(sessionId)
      .messages.filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
  }

  export(id: string, format: ExportFormat): { filename: string; mime: string; body: string } {
    const session = this.getOrThrow(id);
    if (format === 'csv') {
      return {
        filename: `session-${id}.csv`,
        mime: 'text/csv',
        body: toCsv(session),
      };
    }
    return {
      filename: `session-${id}.json`,
      mime: 'application/json',
      body: JSON.stringify(session, null, 2),
    };
  }

  private persist(session: Session): void {
    this.cache.set(session.id, session);
    this.repo.upsert(session);
  }
}

function toCsv(session: Session): string {
  const header = ['index', 'role', 'provider', 'createdAt', 'inputTokens', 'outputTokens', 'cost', 'content'];
  const rows = session.messages.map((m, i) => [
    String(i),
    m.role,
    m.providerId ?? '',
    m.createdAt,
    String(m.usage?.inputTokens ?? ''),
    String(m.usage?.outputTokens ?? ''),
    String(m.cost ?? ''),
    csvEscape(m.content),
  ]);
  return [header, ...rows].map((r) => r.join(',')).join('\n');
}

function csvEscape(text: string): string {
  const needsQuote = /[",\n]/.test(text);
  const escaped = text.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}
