import { Injectable, Logger } from '@nestjs/common';
import type { ProviderId, ProviderInfo } from '@brillio/shared';
import { AppConfigService } from '../config/config.service';
import type { ChatProvider } from './provider.types';
import { ClaudeAdapter } from './adapters/claude.adapter';
import { OpenAiAdapter } from './adapters/openai.adapter';
import { GeminiAdapter } from './adapters/gemini.adapter';
import { MockAdapter } from './adapters/mock.adapter';

/** Builds provider adapters from config and reports their public status. */
@Injectable()
export class ProviderRegistry {
  private readonly logger = new Logger(ProviderRegistry.name);
  private readonly adapters = new Map<ProviderId, ChatProvider>();

  constructor(private readonly config: AppConfigService) {
    for (const p of this.config.providers) {
      if (!p.enabled) continue;
      const key = this.config.providerApiKey(p.id);
      const adapter = this.build(p.id, p.model, key);
      if (adapter) this.adapters.set(p.id, adapter);
    }
    const available = [...this.adapters.values()].filter((a) => a.isAvailable()).map((a) => a.id);
    this.logger.log(`Providers available: ${available.join(', ') || '(mock only)'}`);
  }

  private build(id: ProviderId, model: string, key?: string): ChatProvider | undefined {
    switch (id) {
      case 'claude':
        return new ClaudeAdapter(model, key);
      case 'openai':
        return new OpenAiAdapter(model, key);
      case 'gemini':
        return new GeminiAdapter(model, key);
      case 'mock':
        return new MockAdapter();
      default:
        return undefined;
    }
  }

  get(id: ProviderId): ChatProvider | undefined {
    return this.adapters.get(id);
  }

  has(id: ProviderId): boolean {
    return this.adapters.has(id);
  }

  isAvailable(id: ProviderId): boolean {
    return !!this.adapters.get(id)?.isAvailable();
  }

  /** Public descriptors for GET /providers. */
  list(): ProviderInfo[] {
    return this.config.providers
      .filter((p) => p.enabled)
      .map((p) => {
        const adapter = this.adapters.get(p.id);
        const available = !!adapter?.isAvailable();
        return {
          id: p.id,
          name: p.name,
          model: p.model,
          status: available ? 'available' : 'unavailable',
          statusReason: available ? undefined : adapter?.unavailableReason(),
          pricing: p.pricing,
          contextWindow: p.contextWindow,
        } satisfies ProviderInfo;
      });
  }
}
