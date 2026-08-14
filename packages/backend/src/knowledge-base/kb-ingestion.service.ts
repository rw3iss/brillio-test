import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { KbDocument } from '@brillio/shared';
import { AppConfigService } from '../config/config.service';
import { dataDir, repoRoot } from '../config/paths';
import { KbIndexService } from './kb-index.service';
import { parseDocument } from './parsers';
import { Bm25Index, type Chunk } from './bm25';

/**
 * On startup (and on demand) ensures every knowledge-base group has a parsed,
 * chunked, indexed representation. Parsed text is cached on disk keyed by file
 * mtime+size so unchanged documents are not re-parsed; new/changed documents
 * are (re)ingested automatically.
 */
@Injectable()
export class KbIngestionService implements OnModuleInit {
  private readonly logger = new Logger(KbIngestionService.name);
  private readonly indexes = new Map<string, Bm25Index>();
  private readonly ingestedGroups = new Set<string>();
  private readonly cacheDir = resolve(dataDir(), 'kb-cache');

  constructor(
    private readonly config: AppConfigService,
    private readonly kbIndex: KbIndexService,
  ) {}

  async onModuleInit(): Promise<void> {
    mkdirSync(this.cacheDir, { recursive: true });
    this.kbIndex.load();
    await this.ingestAll();
  }

  async ingestAll(): Promise<void> {
    for (const group of this.kbIndex.groups()) {
      await this.ingestGroup(group.id);
    }
  }

  isIngested(groupId: string): boolean {
    return this.ingestedGroups.has(groupId);
  }

  getIndex(groupId: string): Bm25Index | undefined {
    return this.indexes.get(groupId);
  }

  private async ingestGroup(groupId: string): Promise<void> {
    const docs = this.kbIndex.documentsForGroup(groupId);
    const index = new Bm25Index();
    const { chunkSize, chunkOverlap } = this.config.rag;

    for (const doc of docs) {
      try {
        const text = await this.loadDocumentText(doc);
        const chunks = this.chunk(text, doc, chunkSize, chunkOverlap);
        for (const c of chunks) index.add(c);
      } catch (err) {
        this.logger.warn(`Failed to ingest ${doc.path}: ${(err as Error).message}`);
      }
    }

    this.indexes.set(groupId, index);
    this.ingestedGroups.add(groupId);
    this.logger.log(`Ingested group "${groupId}": ${docs.length} docs → ${index.size} chunks`);
  }

  /** Parse a document, using a mtime+size keyed on-disk cache. */
  private async loadDocumentText(doc: KbDocument): Promise<string> {
    const abs = resolve(repoRoot(), doc.path);
    const stat = statSync(abs);
    const stamp = `${stat.size}-${Math.round(stat.mtimeMs)}`;
    const cacheFile = resolve(this.cacheDir, `${doc.id}.json`);

    if (existsSync(cacheFile)) {
      try {
        const cached = JSON.parse(readFileSync(cacheFile, 'utf-8')) as {
          stamp: string;
          text: string;
        };
        if (cached.stamp === stamp) return cached.text;
      } catch {
        /* fall through to re-parse */
      }
    }

    const text = await parseDocument(abs, doc.type);
    writeFileSync(cacheFile, JSON.stringify({ stamp, text }), 'utf-8');
    return text;
  }

  /** Paragraph-aware sliding window chunker. */
  private chunk(text: string, doc: KbDocument, size: number, overlap: number): Chunk[] {
    const clean = text.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
    if (!clean) return [];
    const paras = clean.split(/\n\n+/);
    const chunks: Chunk[] = [];
    let buffer = '';
    let n = 0;

    const flush = () => {
      const body = buffer.trim();
      if (body.length < 20) return;
      chunks.push({
        id: `${doc.id}#${n++}`,
        documentId: doc.id,
        documentName: doc.name,
        text: body,
      });
    };

    for (const para of paras) {
      if ((buffer + '\n\n' + para).length > size && buffer) {
        flush();
        buffer = overlap > 0 ? buffer.slice(-overlap) + '\n\n' + para : para;
      } else {
        buffer = buffer ? `${buffer}\n\n${para}` : para;
      }
    }
    flush();
    return chunks;
  }
}
