import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import type { UsageAggregate, UsageRecord } from '@brillio/shared';
import { UsageRepository } from '../persistence/usage.repository';

/** Records per-request token/cost usage and exposes rolled-up aggregates. */
@Injectable()
export class UsageService {
  constructor(private readonly repo: UsageRepository) {}

  record(input: Omit<UsageRecord, 'id' | 'createdAt'>): UsageRecord {
    const record: UsageRecord = {
      ...input,
      id: uuid(),
      createdAt: new Date().toISOString(),
    };
    this.repo.insert(record);
    return record;
  }

  aggregate(scope: UsageAggregate['scope'], key: string): UsageAggregate {
    return this.repo.aggregate(scope, key);
  }

  sessionTotals(sessionId: string) {
    return this.repo.sessionTotals(sessionId);
  }
}
