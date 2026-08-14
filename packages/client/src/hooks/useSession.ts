import { useEffect, useMemo, useRef, useState } from 'react';
import type { ProviderId, ProviderInfo } from '@brillio/shared';
import {
  SessionController,
  type SessionState,
  type TransportManager,
} from '../sdk/index.js';
import type { ToastApi } from './useToasts.js';

interface UseSessionArgs {
  transport: TransportManager;
  toasts: ToastApi;
  knowledgeBaseId: string;
  provider: ProviderId;
  providers: ProviderInfo[];
  userId: string;
}

const contextWindowFor = (providers: ProviderInfo[], id: ProviderId): number =>
  providers.find((p) => p.id === id)?.contextWindow ?? 0;

/**
 * Bridges a SessionController into React. Owns the controller for the lifetime
 * of a (knowledgeBaseId) session, mirrors its state, and subscribes to global
 * transport events (warning / provider_switched) to raise toasts.
 */
export function useSession(args: UseSessionArgs) {
  const { transport, toasts, providers } = args;
  const controllerRef = useRef<SessionController | null>(null);
  const [state, setState] = useState<SessionState | null>(null);

  // Recreate the controller when the knowledge base changes (new context).
  useEffect(() => {
    const controller = new SessionController(
      transport,
      (err) => {
        if (err.code === 'rate_limit') {
          toasts.pushError(err, [
            { label: 'Wait', onClick: () => toasts.push('info', 'Waiting before retry…') },
            {
              label: 'Switch model',
              onClick: () => toasts.push('info', 'Pick another model in the top-right dropdown.'),
            },
          ]);
        } else {
          toasts.pushError(err);
        }
      },
      {
        knowledgeBaseId: args.knowledgeBaseId,
        provider: args.provider,
        userId: args.userId,
        contextWindow: contextWindowFor(providers, args.provider),
      },
    );
    controllerRef.current = controller;
    const unsub = controller.subscribe(setState);
    return () => {
      unsub();
      controller.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [args.knowledgeBaseId]);

  // Global event → toast wiring (independent of active request).
  useEffect(() => {
    const offWarn = transport.on('warning', (e) => {
      if (e.type !== 'warning') return;
      toasts.push(
        e.level === 'critical' ? 'error' : 'info',
        `${e.message} (${Math.round(e.percentUsed)}% of context used)`,
      );
    });
    const offSwitch = transport.on('provider_switched', (e) => {
      if (e.type !== 'provider_switched') return;
      toasts.push('info', `Switched provider ${e.from} → ${e.to}: ${e.reason}`);
    });
    return () => {
      offWarn();
      offSwitch();
    };
  }, [transport, toasts]);

  const api = useMemo(
    () => ({
      ask: (content: string) => controllerRef.current?.ask(content),
      cancel: () => controllerRef.current?.cancel(),
      switchProvider: (provider: ProviderId) =>
        controllerRef.current?.switchProvider(provider, contextWindowFor(providers, provider)),
    }),
    [providers],
  );

  return { state, ...api };
}
