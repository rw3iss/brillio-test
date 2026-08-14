import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { AuthModule } from './auth/auth.module';
import { PersistenceModule } from './persistence/persistence.module';
import { ProvidersModule } from './providers/providers.module';
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';
import { SessionModule } from './session/session.module';
import { UsageModule } from './usage/usage.module';
import { ChatModule } from './chat/chat.module';
import { TransportModule } from './transport/transport.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    AppConfigModule,
    AuthModule,
    PersistenceModule,
    ProvidersModule,
    KnowledgeBaseModule,
    SessionModule,
    UsageModule,
    ChatModule,
    TransportModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
