"use strict";
/** Minimal in-memory BM25 index (no external embedding service required). */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bm25Index = void 0;
exports.tokenize = tokenize;
const STOP = new Set([
    'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'is', 'are', 'for', 'on', 'with',
    'as', 'by', 'at', 'be', 'this', 'that', 'it', 'from', 'we', 'our', 'you', 'your',
]);
function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s.]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 1 && !STOP.has(w));
}
const K1 = 1.5;
const B = 0.75;
class Bm25Index {
    chunks = [];
    df = new Map();
    avgdl = 0;
    add(chunk) {
        const tokens = tokenize(chunk.text);
        const tf = new Map();
        for (const t of tokens)
            tf.set(t, (tf.get(t) ?? 0) + 1);
        for (const term of tf.keys())
            this.df.set(term, (this.df.get(term) ?? 0) + 1);
        this.chunks.push({ ...chunk, tokens, tf, length: tokens.length });
        this.recomputeAvg();
    }
    get size() {
        return this.chunks.length;
    }
    recomputeAvg() {
        const total = this.chunks.reduce((s, c) => s + c.length, 0);
        this.avgdl = this.chunks.length ? total / this.chunks.length : 0;
    }
    idf(term) {
        const n = this.chunks.length;
        const df = this.df.get(term) ?? 0;
        return Math.log(1 + (n - df + 0.5) / (df + 0.5));
    }
    search(query, topK, minScore = 0) {
        const qTerms = tokenize(query);
        const scored = this.chunks.map((c) => {
            let score = 0;
            for (const term of qTerms) {
                const f = c.tf.get(term);
                if (!f)
                    continue;
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
exports.Bm25Index = Bm25Index;
//# sourceMappingURL=bm25.js.map