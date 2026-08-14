import { Controller, Get, UseGuards } from '@nestjs/common';
import type { ProviderInfo } from '@brillio/shared';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { ProviderRegistry } from './provider-registry.service';

@Controller('providers')
@UseGuards(ApiKeyGuard)
export class ProvidersController {
  constructor(private readonly registry: ProviderRegistry) {}

  /** Populates the client model dropdown (unavailable providers are greyed). */
  @Get()
  list(): ProviderInfo[] {
    return this.registry.list();
  }
}
