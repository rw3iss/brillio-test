import { Logger } from '@nestjs/common';
import type { ChatProvider, ProviderEvent, ProviderStreamParams } from '../provider.types';
import { ProviderError } from '../provider.types';

/** OpenAI GPT adapter over the Chat Completions streaming API. */
export class OpenAiAdapter implements ChatProvider {
  readonly id = 'openai' as const;
  private readonly logger = new Logger(OpenAiAdapter.name);

  constructor(
    private readonly model: string,
    private readonly apiKey?: string,
  ) {}

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  unavailableReason(): string | undefined {
    return this.apiKey ? undefined : 'OPENAI_API_KEY not configured';
  }

  async *stream(params: ProviderStreamParams): AsyncIterable<ProviderEvent> {
    if (!this.apiKey) throw new ProviderError('OpenAI not configured', 'auth', this.id);
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: this.apiKey });

    try {
      const stream = await client.chat.completions.create({
        model: this.model,
        stream: true,
        stream_options: { include_usage: true },
        messages: [
          { role: 'system', content: params.systemPrompt },
          ...params.messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      });

      let inputTokens = 0;
      let outputTokens = 0;

      for await (const chunk of stream) {
        if (params.signal?.aborted) break;
        const token = chunk.choices[0]?.delta?.content;
        if (token) yield { type: 'token', text: token };
        if (chunk.usage) {
          inputTokens = chunk.usage.prompt_tokens ?? inputTokens;
          outputTokens = chunk.usage.completion_tokens ?? outputTokens;
        }
      }
      yield { type: 'usage', inputTokens, outputTokens };
    } catch (err) {
      throw this.mapError(err);
    }
  }

  private mapError(err: unknown): ProviderError {
    const status = (err as { status?: number })?.status;
    const message = (err as Error)?.message ?? 'OpenAI request failed';
    this.logger.warn(`OpenAI error: ${message}`);
    if (status === 429) return new ProviderError(message, 'rate_limit', this.id, true);
    if (status === 401 || status === 403) return new ProviderError(message, 'auth', this.id);
    return new ProviderError(message, 'unavailable', this.id, true);
  }
}
