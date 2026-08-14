import { useMemo } from 'react';
import { BrillioClient, createTransport, type TransportPreference } from '../sdk/index.js';

/**
 * Constructs the singleton REST client and streaming transport for the app.
 * Transport preference is read once; 'auto' picks WebSocket when available.
 */
export function useBrillio(options?: {
  baseUrl?: string;
  apiKey?: string;
  transport?: TransportPreference;
}) {
  const client = useMemo(
    () => new BrillioClient({ baseUrl: options?.baseUrl, apiKey: options?.apiKey }),
    [options?.baseUrl, options?.apiKey],
  );

  const transport = useMemo(
    () => createTransport(client.config, options?.transport ?? 'auto'),
    [client, options?.transport],
  );

  return { client, transport, transportKind: transport.kind };
}
