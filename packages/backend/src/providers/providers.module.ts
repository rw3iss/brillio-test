import { Module } from '@nestjs/common';
import { ProviderRegistry } from './provider-registry.service';
import { ProviderRouter } from './provider-router.service';
import { ProvidersController } from './providers.controller';

@Module({
  controllers: [ProvidersController],
  providers: [ProviderRegistry, ProviderRouter],
  exports: [ProviderRegistry, ProviderRouter],
})
export class ProvidersModule {}
