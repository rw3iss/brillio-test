import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { UsageAggregate } from '@brillio/shared';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { UsageService } from './usage.service';

@Controller('usage')
@UseGuards(ApiKeyGuard)
export class UsageController {
  constructor(private readonly usage: UsageService) {}

  /** Aggregated usage for a user / session / provider / whole system. */
  @Get()
  aggregate(
    @Query('scope') scope: UsageAggregate['scope'] = 'system',
    @Query('key') key = '',
  ): UsageAggregate {
    const validScopes: UsageAggregate['scope'][] = ['user', 'session', 'provider', 'system'];
    const s = validScopes.includes(scope) ? scope : 'system';
    return this.usage.aggregate(s, key);
  }
}
