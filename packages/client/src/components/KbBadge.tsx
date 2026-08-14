import type { KnowledgeBaseInfo } from '@brillio/shared';
import './Badge.scss';

/** Compact indicator of the active knowledge base (folder + doc count). */
export function KbBadge({ kb }: { kb: KnowledgeBaseInfo }) {
  return (
    <span className="kb-badge" title={kb.description}>
      <span className="kb-badge__folder">{kb.folder}</span>
      <span className="kb-badge__meta">
        {kb.documentCount} docs
        {!kb.ingested && <em className="kb-badge__warn"> · not indexed</em>}
      </span>
    </span>
  );
}
