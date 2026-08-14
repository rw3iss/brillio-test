import {
  API_KEY_HEADER,
  ROUTES,
  type ExportFormat,
  type KnowledgeBaseInfo,
  type ProviderInfo,
  type Session,
  type SessionSummary,
  type UsageAggregate,
} from '@brillio/shared';
import { resolveConfig, type BrillioConfig } from './config.js';
import { BrillioError } from './errors.js';

type UsageScope = 'user' | 'session' | 'provider' | 'system';

/**
 * REST facade over the Brillio backend. Owns nothing stateful beyond config;
 * streaming lives in the transports. Every request carries the API key header.
 */
export class BrillioClient {
  readonly config: BrillioConfig;

  constructor(partial?: Partial<BrillioConfig>) {
    this.config = resolveConfig(partial);
  }

  private url(path: string): string {
    return `${this.config.baseUrl}${path}`;
  }

  headers(extra?: Record<string, string>): Record<string, string> {
    return { [API_KEY_HEADER]: this.config.apiKey, ...extra };
  }

  private async getJson<T>(path: string): Promise<T> {
    let res: Response;
    try {
      res = await fetch(this.url(path), { headers: this.headers() });
    } catch (err) {
      throw new BrillioError({
        code: 'internal',
        message: `Network error requesting ${path}: ${(err as Error).message}`,
        recoverable: true,
      });
    }
    if (!res.ok) {
      throw new BrillioError({
        code: res.status === 401 || res.status === 403 ? 'auth' : 'internal',
        message: `Request to ${path} failed (${res.status})`,
        recoverable: res.status >= 500,
      });
    }
    return (await res.json()) as T;
  }

  health(): Promise<{ status: string }> {
    return this.getJson(ROUTES.health);
  }

  getProviders(): Promise<ProviderInfo[]> {
    return this.getJson<ProviderInfo[]>(ROUTES.providers);
  }

  getKnowledgeBases(): Promise<KnowledgeBaseInfo[]> {
    return this.getJson<KnowledgeBaseInfo[]>(ROUTES.knowledgeBases);
  }

  getSessions(userId?: string): Promise<SessionSummary[]> {
    const q = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return this.getJson<SessionSummary[]>(`${ROUTES.sessionsByUser}${q}`);
  }

  getSession(id: string): Promise<Session> {
    return this.getJson<Session>(ROUTES.session(id));
  }

  getUsage(scope: UsageScope, key: string): Promise<UsageAggregate> {
    const q = `?scope=${encodeURIComponent(scope)}&key=${encodeURIComponent(key)}`;
    return this.getJson<UsageAggregate>(`${ROUTES.usage}${q}`);
  }

  /** Absolute URL for the export endpoint (used for anchor-based downloads). */
  exportUrl(id: string, format: ExportFormat = 'json'): string {
    return this.url(`${ROUTES.sessionExport(id)}?format=${format}`);
  }

  /** Fetches an export as a Blob, applying the API key header. */
  async exportSession(id: string, format: ExportFormat = 'json'): Promise<Blob> {
    const res = await fetch(this.exportUrl(id, format), { headers: this.headers() });
    if (!res.ok) {
      throw new BrillioError({
        code: 'internal',
        message: `Export failed (${res.status})`,
        recoverable: true,
      });
    }
    return res.blob();
  }
}
