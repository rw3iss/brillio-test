import { Injectable } from '@nestjs/common';
import type { SourceChunk } from '@brillio/shared';
import { AppConfigService } from '../config/config.service';
import { KbIngestionService } from './kb-ingestion.service';

export interface RetrievedContext {
  sources: SourceChunk[];
  /** Formatted context block appended to the system prompt. */
  contextText: string;
}

/** Retrieves grounding context for a question against a knowledge-base group. */
@Injectable()
export class RagService {
  constructor(
    private readonly config: AppConfigService,
    private readonly ingestion: KbIngestionService,
  ) {}

  retrieve(groupId: string, question: string): RetrievedContext {
    const index = this.ingestion.getIndex(groupId);
    if (!index || index.size === 0) {
      return { sources: [], contextText: '' };
    }
    const { topK, minScore } = this.config.rag;
    const hits = index.search(question, topK, minScore);
    const sources: SourceChunk[] = hits.map((h) => ({
      documentId: h.documentId,
      documentName: h.documentName,
      snippet: h.text.slice(0, 240),
      score: h.score,
    }));

    const contextText = hits
      .map((h, i) => `[${i + 1}] (${h.documentName})\n${h.text}`)
      .join('\n\n---\n\n');

    return { sources, contextText };
  }
}
