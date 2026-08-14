import type { BrillioConfig } from '../config.js';
import { SseTransport } from './SseTransport.js';
import { WebSocketTransport } from './WebSocketTransport.js';
import type { TransportManager } from './types.js';

export type TransportPreference = 'auto' | 'ws' | 'sse';

/**
 * Transport selection strategy:
 *  - 'ws'   force WebSocket
 *  - 'sse'  force the POST /chat SSE fallback
 *  - 'auto' (default) use WebSocket when the runtime supports it, else SSE.
 *
 * WebSocket is preferred because it is the backend's primary bidirectional
 * transport (enables live switch_provider / cancel back-channel). SSE is the
 * fallback for environments without a usable WebSocket global.
 */
export function createTransport(
  config: BrillioConfig,
  preference: TransportPreference = 'auto',
): TransportManager {
  const wsSupported = typeof WebSocket !== 'undefined';
  if (preference === 'sse' || (preference === 'auto' && !wsSupported)) {
    return new SseTransport(config);
  }
  return new WebSocketTransport(config);
}
