import { Logger } from '@nestjs/common';
import type { ChatProvider, ProviderEvent, ProviderStreamParams } from '../provider.types';
import { ProviderError } from '../provider.types';

/** Google Gemini adapter over the generateContentStream API. */
export class GeminiAdapter implements ChatProvider {
  readonly id = 'gemini' as const;
  private readonly logger = new Logger(GeminiAdapter.name);

  constructor(
    private readonly model: string,
    private readonly apiKey?: string,
  ) {}

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  unavailableReason(): string | undefined {
    return this.apiKey ? undefined : 'GEMINI_API_KEY not configured';
  }

  async *stream(params: ProviderStreamParams): AsyncIterable<ProviderEvent> {
    if (!this.apiKey) throw new ProviderError('Gemini not configured', 'auth', this.id);
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: this.apiKey });

    try {
      const response = await ai.models.generateContentStream({
        model: this.model,
        contents: params.messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        config: { systemInstruction: params.systemPrompt },
      });

      let inputTokens = 0;
      let outputTokens = 0;

      for await (const chunk of response) {
        if (params.signal?.aborted) break;
        const text = chunk.text;
        if (text) yield { type: 'token', text };
        const usage = chunk.usageMetadata;
        if (usage) {
          inputTokens = usage.promptTokenCount ?? inputTokens;
          outputTokens = usage.candidatesTokenCount ?? outputTokens;
        }
      }
      yield { type: 'usage', inputTokens, outputTokens };
    } catch (err) {
      throw this.mapError(err);
    }
  }

  private mapError(err: unknown): ProviderError {
    const status = (err as { status?: number })?.status;
    const message = (err as Error)?.message ?? 'Gemini request failed';
    this.logger.warn(`Gemini error: ${message}`);
    if (status === 429) return new ProviderError(message, 'rate_limit', this.id, true);
    if (status === 401 || status === 403) return new ProviderError(message, 'auth', this.id);
    return new ProviderError(message, 'unavailable', this.id, true);
  }
}
