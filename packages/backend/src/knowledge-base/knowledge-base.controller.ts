import { Controller, Get, UseGuards } from '@nestjs/common';
import type { KnowledgeBaseInfo } from '@brillio/shared';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { KbIndexService } from './kb-index.service';
import { KbIngestionService } from './kb-ingestion.service';

@Controller('knowledge-bases')
@UseGuards(ApiKeyGuard)
export class KnowledgeBaseController {
  constructor(
    private readonly kbIndex: KbIndexService,
    private readonly ingestion: KbIngestionService,
  ) {}

  /** Selectable knowledge-base groups for the client dropdown. */
  @Get()
  list(): KnowledgeBaseInfo[] {
    return this.kbIndex.groups().map((g) => ({
      ...g,
      documentCount: this.kbIndex.documentsForGroup(g.id).length,
      ingested: this.ingestion.isIngested(g.id),
    }));
  }
}
