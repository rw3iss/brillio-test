/** Header carrying the client API key for REST requests. */
export const API_KEY_HEADER = 'x-api-key';

/** Default warning thresholds (percent of context window). */
export const DEFAULT_WARN_PERCENT = 75;
export const DEFAULT_CRITICAL_PERCENT = 90;

/** Canonical REST routes, mirrored by the client SDK. */
export const ROUTES = {
  providers: '/providers',
  knowledgeBases: '/knowledge-bases',
  chat: '/chat',
  session: (id: string) => `/sessions/${id}`,
  sessionExport: (id: string) => `/sessions/${id}/export`,
  sessionsByUser: '/sessions',
  usage: '/usage',
  health: '/health',
} as const;

/** WebSocket namespace/path used by the gateway and the SDK. */
export const WS_PATH = '/ws';
