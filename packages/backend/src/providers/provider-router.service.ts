import { Injectable } from '@nestjs/common';
import type { ProviderId } from '@brillio/shared';
import { AppConfigService } from '../config/config.service';
import { ProviderRegistry } from './provider-registry.service';
import type { ChatProvider } from './provider.types';

/** Chooses providers and computes fallback order when one is unavailable. */
@Injectable()
export class ProviderRouter {
  constructor(
    private readonly registry: ProviderRegistry,
    private readonly config: AppConfigService,
  ) {}

  /**
   * Ordered candidate list starting with the requested provider, then the
   * remaining available providers (config order), and finally mock as a
   * guaranteed offline fallback. Never empty.
   */
  fallbackOrder(desired: ProviderId): ChatProvider[] {
    const order: ProviderId[] = [
      desired,
      ...this.config.providers.map((p) => p.id).filter((id) => id !== desired),
    ];
    const seen = new Set<ProviderId>();
    const result: ChatProvider[] = [];
    for (const id of order) {
      if (seen.has(id)) continue;
      seen.add(id);
      const adapter = this.registry.get(id);
      if (adapter?.isAvailable()) result.push(adapter);
    }
    // Mock is always available; guarantee at least one candidate.
    if (result.length === 0) {
      const mock = this.registry.get('mock');
      if (mock) result.push(mock);
    }
    return result;
  }

  contextWindow(id: ProviderId): number {
    return this.config.getProvider(id)?.contextWindow ?? 128000;
  }

  pricing(id: ProviderId) {
    return this.config.getProvider(id)?.pricing ?? { inputPer1M: 0, outputPer1M: 0, currency: 'USD' };
  }
}
