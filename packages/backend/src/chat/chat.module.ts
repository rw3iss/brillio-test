import { Module } from '@nestjs/common';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { SessionModule } from '../session/session.module';
import { UsageModule } from '../usage/usage.module';
import { ProvidersModule } from '../providers/providers.module';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { CommandDispatcher } from '../transport/command-dispatcher';

@Module({
  imports: [KnowledgeBaseModule, SessionModule, UsageModule, ProvidersModule],
  controllers: [ChatController],
  providers: [ChatService, CommandDispatcher],
  exports: [ChatService, CommandDispatcher],
})
export class ChatModule {}
