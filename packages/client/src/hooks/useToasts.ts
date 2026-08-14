import { useCallback, useState } from 'react';
import type { BrillioError } from '../sdk/index.js';

export type ToastKind = 'error' | 'info' | 'success';

export interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
  /** Optional actions rendered as buttons (e.g. rate-limit wait/switch). */
  actions?: { label: string; onClick: () => void }[];
}

let toastSeq = 0;

/**
 * Central notification channel. The SDK relays every BrillioError here; UI
 * components also push info/success toasts. Rate-limit errors are expanded into
 * actionable wait/switch prompts by the caller via `pushError`'s options.
 */
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string, actions?: Toast['actions']) => {
      const id = `t-${toastSeq++}`;
      setToasts((prev) => [...prev, { id, kind, message, actions }]);
      if (!actions) {
        window.setTimeout(() => dismiss(id), kind === 'error' ? 8000 : 4000);
      }
      return id;
    },
    [dismiss],
  );

  const pushError = useCallback(
    (err: BrillioError, extraActions?: Toast['actions']) => {
      const actions = [...(extraActions ?? [])];
      const message = err.suggestion ? `${err.message} (${err.suggestion})` : err.message;
      return push('error', message, actions.length ? actions : undefined);
    },
    [push],
  );

  return { toasts, push, pushError, dismiss };
}

export type ToastApi = ReturnType<typeof useToasts>;
