/** Minimal in-memory BM25 index (no external embedding service required). */

export interface Chunk {
  id: string;
  documentId: string;
  documentName: string;
  text: string;
}

interface IndexedChunk extends Chunk {
  tokens: string[];
  tf: Map<string, number>;
  length: number;
}

const STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'is', 'are', 'for', 'on', 'with',
  'as', 'by', 'at', 'be', 'this', 'that', 'it', 'from', 'we', 'our', 'you', 'your',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s.]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w));
}

const K1 = 1.5;
const B = 0.75;

export class Bm25Index {
  private readonly chunks: IndexedChunk[] = [];
  private readonly df = new Map<string, number>();
  private avgdl = 0;

  add(chunk: Chunk): void {
    const tokens = tokenize(chunk.text);
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    for (const term of tf.keys()) this.df.set(term, (this.df.get(term) ?? 0) + 1);
    this.chunks.push({ ...chunk, tokens, tf, length: tokens.length });
    this.recomputeAvg();
  }

  get size(): number {
    return this.chunks.length;
  }

  private recomputeAvg(): void {
    const total = this.chunks.reduce((s, c) => s + c.length, 0);
    this.avgdl = this.chunks.length ? total / this.chunks.length : 0;
  }

  private idf(term: string): number {
    const n = this.chunks.length;
    const df = this.df.get(term) ?? 0;
    return Math.log(1 + (n - df + 0.5) / (df + 0.5));
  }

  search(query: string, topK: number, minScore = 0): Array<Chunk & { score: number }> {
    const qTerms = tokenize(query);
    const scored = this.chunks.map((c) => {
      let score = 0;
      for (const term of qTerms) {
        const f = c.tf.get(term);
        if (!f) continue;
        const idf = this.idf(term);
        const denom = f + K1 * (1 - B + (B * c.length) / (this.avgdl || 1));
        score += idf * ((f * (K1 + 1)) / denom);
      }
      return { chunk: c, score };
    });
    const max = Math.max(1, ...scored.map((s) => s.score));
    return scored
      .map((s) => ({ ...s, norm: s.score / max }))
      .filter((s) => s.norm >= minScore && s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((s) => ({
        id: s.chunk.id,
        documentId: s.chunk.documentId,
        documentName: s.chunk.documentName,
        text: s.chunk.text,
        score: Math.round(s.norm * 1000) / 1000,
      }));
  }
}
