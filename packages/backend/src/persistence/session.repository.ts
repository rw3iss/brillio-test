import { Injectable } from '@nestjs/common';
import type { Session, SessionSummary } from '@brillio/shared';
import { DbService } from './db.service';

interface SessionRow {
  id: string;
  userId: string;
  knowledgeBaseId: string;
  provider: string;
  systemPrompt: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: string;
}

/** Persistence boundary for sessions (swap this impl to change storage). */
@Injectable()
export class SessionRepository {
  constructor(private readonly dbService: DbService) {}

  upsert(session: Session): void {
    this.dbService.db
      .prepare(
        `INSERT INTO sessions (id,userId,knowledgeBaseId,provider,systemPrompt,title,createdAt,updatedAt,messages)
         VALUES (@id,@userId,@knowledgeBaseId,@provider,@systemPrompt,@title,@createdAt,@updatedAt,@messages)
         ON CONFLICT(id) DO UPDATE SET
           knowledgeBaseId=excluded.knowledgeBaseId,
           provider=excluded.provider,
           systemPrompt=excluded.systemPrompt,
           title=excluded.title,
           updatedAt=excluded.updatedAt,
           messages=excluded.messages`,
      )
      .run({
        ...session,
        messages: JSON.stringify(session.messages),
      });
  }

  findById(id: string): Session | undefined {
    const row = this.dbService.db
      .prepare('SELECT * FROM sessions WHERE id = ?')
      .get(id) as SessionRow | undefined;
    return row ? this.hydrate(row) : undefined;
  }

  listByUser(userId: string): SessionSummary[] {
    const rows = this.dbService.db
      .prepare('SELECT * FROM sessions WHERE userId = ? ORDER BY updatedAt DESC')
      .all(userId) as SessionRow[];
    return rows.map((r) => {
      const s = this.hydrate(r);
      return {
        id: s.id,
        userId: s.userId,
        knowledgeBaseId: s.knowledgeBaseId,
        provider: s.provider,
        title: s.title,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        messageCount: s.messages.length,
      };
    });
  }

  private hydrate(row: SessionRow): Session {
    return {
      id: row.id,
      userId: row.userId,
      knowledgeBaseId: row.knowledgeBaseId,
      provider: row.provider as Session['provider'],
      systemPrompt: row.systemPrompt,
      title: row.title,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      messages: JSON.parse(row.messages),
    };
  }
}
