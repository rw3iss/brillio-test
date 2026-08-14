import type { ServerEvent, ServerEventType } from '@brillio/shared';
import type { ServerEventHandler } from './types.js';

/**
 * Small typed pub/sub shared by both transports. Fans a decoded ServerEvent out
 * to (a) the per-request handler and (b) any global `on(type)` subscribers.
 */
export class EventBus {
  private listeners = new Map<ServerEventType, Set<ServerEventHandler>>();

  on(type: ServerEventType, cb: ServerEventHandler): () => void {
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }
    set.add(cb);
    return () => set!.delete(cb);
  }

  emit(event: ServerEvent): void {
    const set = this.listeners.get(event.type);
    if (!set) return;
    for (const cb of set) cb(event);
  }

  clear(): void {
    this.listeners.clear();
  }
}
