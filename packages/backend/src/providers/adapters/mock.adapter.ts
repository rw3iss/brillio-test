import { estimateTokens } from '@brillio/shared';
import type { ChatProvider, ProviderEvent, ProviderStreamParams } from '../provider.types';

const CONTEXT_MARKER = 'KNOWLEDGE BASE CONTEXT:';
const NO_ANSWER =
  "I don't have that information in the current knowledge base. Try selecting a different knowledge base or rephrasing the question.";

/**
 * Offline provider so the full streaming pipeline runs without vendor keys.
 * Performs a naive sentence-overlap retrieval over the injected context and
 * streams the result token-by-token, honoring the "do not guess" rule.
 */
export class MockAdapter implements ChatProvider {
  readonly id = 'mock' as const;

  isAvailable(): boolean {
    return true;
  }

  unavailableReason(): undefined {
    return undefined;
  }

  async *stream(params: ProviderStreamParams): AsyncIterable<ProviderEvent> {
    const question =
      [...params.messages].reverse().find((m) => m.role === 'user')?.content ?? '';
    const answer = this.answer(params.systemPrompt, question);

    const inputTokens = estimateTokens(
      params.systemPrompt + params.messages.map((m) => m.content).join(' '),
    );

    for (const piece of answer.match(/\S+\s*/g) ?? [answer]) {
      if (params.signal?.aborted) break;
      await delay(12);
      yield { type: 'token', text: piece };
    }
    yield { type: 'usage', inputTokens, outputTokens: estimateTokens(answer) };
  }

  private answer(systemPrompt: string, question: string): string {
    const idx = systemPrompt.indexOf(CONTEXT_MARKER);
    const context = idx >= 0 ? systemPrompt.slice(idx + CONTEXT_MARKER.length) : '';
    if (!context.trim()) return NO_ANSWER;

    const qWords = tokenize(question);
    if (qWords.size === 0) return NO_ANSWER;

    const sentences = context
      .split(/(?<=[.!?])\s+|\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 25);

    const scored = sentences
      .map((s) => ({ s, score: overlap(qWords, tokenize(s)) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    if (scored.length === 0) return NO_ANSWER;
    return `Based on the knowledge base:\n\n${scored.map((x) => `• ${x.s}`).join('\n')}`;
  }
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s.]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const w of a) if (b.has(w)) n++;
  return n;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
