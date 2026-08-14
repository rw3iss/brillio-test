import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import type { ProviderId } from '@brillio/shared';
import { configPath } from './paths';
import type { AppConfig, ProviderConfig } from './config.types';

/** Loads and exposes the static app configuration read at runtime. */
@Injectable()
export class AppConfigService {
  private readonly logger = new Logger(AppConfigService.name);
  private readonly config: AppConfig;

  constructor() {
    const path = configPath();
    this.config = JSON.parse(readFileSync(path, 'utf-8')) as AppConfig;
    this.logger.log(`Loaded config from ${path} (${this.config.providers.length} providers)`);
  }

  get raw(): AppConfig {
    return this.config;
  }

  get port(): number {
    return Number(process.env.PORT ?? this.config.server.port);
  }

  get corsOrigins(): string[] {
    return this.config.server.corsOrigins;
  }

  get apiKeys(): string[] {
    return this.config.auth.apiKeys;
  }

  get defaultProvider(): ProviderId {
    return this.config.defaults.provider;
  }

  get rag() {
    return this.config.rag;
  }

  get warnings() {
    return this.config.warnings;
  }

  get providers(): ProviderConfig[] {
    return this.config.providers;
  }

  getProvider(id: ProviderId): ProviderConfig | undefined {
    return this.config.providers.find((p) => p.id === id);
  }

  /** Resolve a system prompt: explicit override, or a named ref, or the default. */
  resolveSystemPrompt(override?: string, ref?: string): string {
    if (override && override.trim()) return override;
    const key = ref ?? this.config.defaults.systemPromptRef;
    return this.config.systemPrompts[key] ?? this.config.systemPrompts.default ?? '';
  }

  /** API key value for a provider from its configured env var, if present. */
  providerApiKey(id: ProviderId): string | undefined {
    const cfg = this.getProvider(id);
    if (!cfg || !cfg.apiKeyEnv) return undefined;
    const val = process.env[cfg.apiKeyEnv];
    return val && val.trim() ? val : undefined;
  }
}
