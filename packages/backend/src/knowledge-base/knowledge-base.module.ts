import { Module } from '@nestjs/common';
import { KbIndexService } from './kb-index.service';
import { KbIngestionService } from './kb-ingestion.service';
import { RagService } from './rag.service';
import { KnowledgeBaseController } from './knowledge-base.controller';

@Module({
  controllers: [KnowledgeBaseController],
  providers: [KbIndexService, KbIngestionService, RagService],
  exports: [KbIndexService, KbIngestionService, RagService],
})
export class KnowledgeBaseModule {}
