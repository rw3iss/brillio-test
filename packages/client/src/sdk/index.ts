export { BrillioClient } from './BrillioClient.js';
export { SessionController } from './SessionController.js';
export type {
  SessionState,
  StreamStatus,
  UsageLevel,
  AssistantMessage,
} from './SessionController.js';
export { BrillioError, toBrillioError } from './errors.js';
export { resolveConfig, DEFAULT_DEV_API_KEY } from './config.js';
export type { BrillioConfig } from './config.js';
export { createTransport } from './transport/createTransport.js';
export type { TransportPreference } from './transport/createTransport.js';
export { WebSocketTransport } from './transport/WebSocketTransport.js';
export { SseTransport } from './transport/SseTransport.js';
export type { TransportManager, StreamHandle, ServerEventHandler } from './transport/types.js';
