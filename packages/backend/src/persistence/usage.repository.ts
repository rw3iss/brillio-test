import { Injectable } from '@nestjs/common';
import type { UsageAggregate, UsageRecord } from '@brillio/shared';
import { DbService } from './db.service';

type Scope = UsageAggregate['scope'];

/** Persistence boundary for usage records + aggregates. */
@Injectable()
export class UsageRepository {
  constructor(private readonly dbService: DbService) {}

  insert(record: UsageRecord): void {
    this.dbService.db
      .prepare(
        `INSERT INTO usage_records
          (id,sessionId,userId,provider,model,knowledgeBaseId,question,inputTokens,outputTokens,cost,latencyMs,createdAt)
         VALUES
          (@id,@sessionId,@userId,@provider,@model,@knowledgeBaseId,@question,@inputTokens,@outputTokens,@cost,@latencyMs,@createdAt)`,
      )
      .run(record);
  }

  private static readonly COLUMN: Record<Exclude<Scope, 'system'>, string> = {
    user: 'userId',
    session: 'sessionId',
    provider: 'provider',
  };

  aggregate(scope: Scope, key: string): UsageAggregate {
    const base =
      'SELECT COUNT(*) AS requests, COALESCE(SUM(inputTokens),0) AS inputTokens, ' +
      'COALESCE(SUM(outputTokens),0) AS outputTokens, COALESCE(SUM(cost),0) AS totalCost FROM usage_records';
    let row: {
      requests: number;
      inputTokens: number;
      outputTokens: number;
      totalCost: number;
    };
    if (scope === 'system') {
      row = this.dbService.db.prepare(base).get() as typeof row;
    } else {
      const col = UsageRepository.COLUMN[scope];
      row = this.dbService.db.prepare(`${base} WHERE ${col} = ?`).get(key) as typeof row;
    }
    return {
      scope,
      key: scope === 'system' ? 'system' : key,
      requests: row.requests,
      inputTokens: row.inputTokens,
      outputTokens: row.outputTokens,
      totalCost: Math.round(row.totalCost * 1_000_000) / 1_000_000,
    };
  }

  /** Session-scoped token totals used for live context accounting. */
  sessionTotals(sessionId: string): { inputTokens: number; outputTokens: number; cost: number } {
    const row = this.dbService.db
      .prepare(
        'SELECT COALESCE(SUM(inputTokens),0) AS inputTokens, COALESCE(SUM(outputTokens),0) AS outputTokens, COALESCE(SUM(cost),0) AS cost FROM usage_records WHERE sessionId = ?',
      )
      .get(sessionId) as { inputTokens: number; outputTokens: number; cost: number };
    return row;
  }
}
