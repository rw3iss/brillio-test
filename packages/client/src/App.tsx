import { useEffect, useMemo, useState } from 'react';
import type { ProviderId } from '@brillio/shared';
import { useBrillio } from './hooks/useBrillio.js';
import { useToasts } from './hooks/useToasts.js';
import { useProviders } from './hooks/useProviders.js';
import { useKnowledgeBases } from './hooks/useKnowledgeBases.js';
import { useSession } from './hooks/useSession.js';
import { Landing } from './components/Landing.js';
import { ChatScreen } from './components/ChatScreen.js';
import { ToastHost } from './components/ToastHost.js';

const USER_ID = 'local-user';

/** Picks the first available provider, falling back to the first listed. */
function pickDefaultProvider(
  providers: { id: ProviderId; status: string }[],
): ProviderId | undefined {
  return (providers.find((p) => p.status === 'available') ?? providers[0])?.id;
}

export function App() {
  const { client, transport, transportKind } = useBrillio();
  const toasts = useToasts();
  const providersState = useProviders(client);
  const kbState = useKnowledgeBases(client);

  const [activeKbId, setActiveKbId] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<ProviderId | null>(null);

  // Default the provider once providers load.
  useEffect(() => {
    if (!activeProvider && providersState.providers.length) {
      const def = pickDefaultProvider(providersState.providers);
      if (def) setActiveProvider(def);
    }
  }, [providersState.providers, activeProvider]);

  const provider = activeProvider ?? 'mock';

  // A session hook is always mounted; it only starts streaming after `ask`.
  const session = useSession({
    transport,
    toasts,
    knowledgeBaseId: activeKbId ?? '',
    provider,
    providers: providersState.providers,
    userId: USER_ID,
  });

  // Reflect backend-driven fallbacks (provider_switched) in the dropdown:
  // the SessionController updates its state.provider when the server switches,
  // so mirror that into the selected-provider state the dropdown reads.
  const sessionProvider = session.state?.provider;
  useEffect(() => {
    if (sessionProvider && sessionProvider !== activeProvider) {
      setActiveProvider(sessionProvider);
    }
  }, [sessionProvider, activeProvider]);

  const onSelectProvider = (next: ProviderId) => {
    setActiveProvider(next);
    session.switchProvider(next);
  };

  const started = useMemo(() => activeKbId != null, [activeKbId]);

  if (!started) {
    return (
      <>
        <Landing
          knowledgeBases={kbState.knowledgeBases}
          loading={kbState.loading}
          error={kbState.error}
          transportKind={transportKind}
          onStart={(kbId) => setActiveKbId(kbId)}
        />
        <ToastHost toasts={toasts.toasts} dismiss={toasts.dismiss} />
      </>
    );
  }

  return (
    <>
      <ChatScreen
        client={client}
        toasts={toasts}
        knowledgeBases={kbState.knowledgeBases}
        providers={providersState.providers}
        activeKbId={activeKbId!}
        activeProvider={provider}
        state={session.state}
        onSelectKb={(kbId) => setActiveKbId(kbId)}
        onSelectProvider={onSelectProvider}
        onSend={session.ask}
        onCancel={session.cancel}
      />
      <ToastHost toasts={toasts.toasts} dismiss={toasts.dismiss} />
    </>
  );
}
