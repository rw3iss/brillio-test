/**
 * Runtime configuration for the SDK. `baseUrl` defaults to the empty string so
 * requests are same-origin and flow through the Vite dev proxy; set it to an
 * absolute origin to talk to a backend directly.
 */
export interface BrillioConfig {
  baseUrl: string;
  apiKey: string;
}

export const DEFAULT_DEV_API_KEY = 'brillio-dev-key-2026';

export function resolveConfig(partial?: Partial<BrillioConfig>): BrillioConfig {
  return {
    baseUrl: partial?.baseUrl ?? '',
    apiKey: partial?.apiKey ?? DEFAULT_DEV_API_KEY,
  };
}
