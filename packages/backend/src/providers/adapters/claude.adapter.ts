import { Logger } from '@nestjs/common';
import type { ChatProvider, ProviderEvent, ProviderStreamParams } from '../provider.types';
import { ProviderError } from '../provider.types';

/** Anthropic Claude adapter over the Messages streaming API. */
export class ClaudeAdapter implements ChatProvider {
  readonly id = 'claude' as const;
  private readonly logger = new Logger(ClaudeAdapter.name);

  constructor(
    private readonly model: string,
    private readonly apiKey?: string,
  ) {}

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  unavailableReason(): string | undefined {
    return this.apiKey ? undefined : 'ANTHROPIC_API_KEY not configured';
  }

  async *stream(params: ProviderStreamParams): AsyncIterable<ProviderEvent> {
    if (!this.apiKey) throw new ProviderError('Claude not configured', 'auth', this.id);
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: this.apiKey });

    try {
      const stream = client.messages.stream({
        model: this.model,
        max_tokens: 2048,
        system: params.systemPrompt,
        messages: params.messages.map((m) => ({ role: m.role, content: m.content })),
      });

      let inputTokens = 0;
      let outputTokens = 0;

      for await (const event of stream) {
        if (params.signal?.aborted) break;
        if (event.type === 'message_start') {
          inputTokens = event.message.usage?.input_tokens ?? 0;
        } else if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield { type: 'token', text: event.delta.text };
        } else if (event.type === 'message_delta') {
          outputTokens = event.usage?.output_tokens ?? outputTokens;
        }
      }
      yield { type: 'usage', inputTokens, outputTokens };
    } catch (err) {
      throw this.mapError(err);
    }
  }

  private mapError(err: unknown): ProviderError {
    const status = (err as { status?: number })?.status;
    const message = (err as Error)?.message ?? 'Claude request failed';
    this.logger.warn(`Claude error: ${message}`);
    if (status === 429) return new ProviderError(message, 'rate_limit', this.id, true);
    if (status === 401 || status === 403) return new ProviderError(message, 'auth', this.id);
    return new ProviderError(message, 'unavailable', this.id, true);
  }
}
