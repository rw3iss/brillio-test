export type KbDocumentType = 'markdown' | 'pdf' | 'json';

/** A single source document, which may belong to several knowledge-base groups. */
export interface KbDocument {
  id: string;
  name: string;
  /** Repo-relative path used by the ingestion/RAG layer to load the file. */
  path: string;
  type: KbDocumentType;
  /** Group ids this document is a member of. */
  groups: string[];
  title?: string;
  description?: string;
}

/** A selectable knowledge-base group (a.k.a. "library"). */
export interface KbGroupMeta {
  id: string;
  name: string;
  description: string;
  /** Source folder name the group is primarily drawn from. */
  folder: string;
  tags?: string[];
}

/** Shape of knowledge-base/index.json. */
export interface KbIndex {
  groups: KbGroupMeta[];
  documents: KbDocument[];
}

/** Public group descriptor returned by GET /knowledge-bases. */
export interface KnowledgeBaseInfo extends KbGroupMeta {
  documentCount: number;
  /** True once the group has been parsed & indexed for retrieval. */
  ingested: boolean;
}
