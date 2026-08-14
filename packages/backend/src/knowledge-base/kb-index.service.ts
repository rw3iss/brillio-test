import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import type { KbDocument, KbGroupMeta, KbIndex } from '@brillio/shared';
import { kbIndexPath } from '../config/paths';

/** Loads knowledge-base/index.json and answers questions about groups/docs. */
@Injectable()
export class KbIndexService {
  private readonly logger = new Logger(KbIndexService.name);
  private index: KbIndex = { groups: [], documents: [] };

  load(): void {
    const path = kbIndexPath();
    this.index = JSON.parse(readFileSync(path, 'utf-8')) as KbIndex;
    this.logger.log(
      `Loaded KB index: ${this.index.groups.length} groups, ${this.index.documents.length} documents`,
    );
  }

  groups(): KbGroupMeta[] {
    return this.index.groups;
  }

  hasGroup(id: string): boolean {
    return this.index.groups.some((g) => g.id === id);
  }

  documents(): KbDocument[] {
    return this.index.documents;
  }

  documentsForGroup(groupId: string): KbDocument[] {
    return this.index.documents.filter((d) => d.groups.includes(groupId));
  }
}
