import { useMemo } from 'react';
import type { KnowledgeBaseInfo, ProviderId, ProviderInfo } from '@brillio/shared';
import { Dropdown, type DropdownOption } from './Dropdown.js';
import { ProviderBadge } from './ProviderBadge.js';
import { MessageList } from './MessageList.js';
import { Composer } from './Composer.js';
import { TokenUsageBar } from './TokenUsageBar.js';
import type { BrillioClient, SessionState } from '../sdk/index.js';
import type { ToastApi } from '../hooks/useToasts.js';
import './ChatScreen.scss';

interface ChatScreenProps {
  client: BrillioClient;
  toasts: ToastApi;
  knowledgeBases: KnowledgeBaseInfo[];
  providers: ProviderInfo[];
  activeKbId: string;
  activeProvider: ProviderId;
  state: SessionState | null;
  onSelectKb: (kbId: string) => void;
  onSelectProvider: (provider: ProviderId) => void;
  onSend: (text: string) => void;
  onCancel: () => void;
}

export function ChatScreen(props: ChatScreenProps) {
  const {
    client,
    toasts,
    knowledgeBases,
    providers,
    activeKbId,
    activeProvider,
    state,
    onSelectKb,
    onSelectProvider,
    onSend,
    onCancel,
  } = props;

  const kbOptions: DropdownOption<string>[] = knowledgeBases.map((kb) => ({
    value: kb.id,
    label: kb.folder,
    sublabel: `${kb.id} · ${kb.documentCount} docs`,
    disabled: !kb.ingested,
    tooltip: kb.ingested ? kb.description : 'Not indexed yet',
  }));

  const providerOptions: DropdownOption<ProviderId>[] = providers.map((p) => ({
    value: p.id,
    label: p.name,
    sublabel: p.model,
    disabled: p.status !== 'available',
    tooltip: p.status !== 'available' ? p.statusReason ?? `Provider ${p.status}` : undefined,
    trailing: <ProviderBadge status={p.status} />,
  }));

  const sessionId = state?.sessionId;

  const exportSession = async (format: 'json' | 'csv') => {
    if (!sessionId) {
      toasts.push('info', 'Send a message first to create a session to export.');
      return;
    }
    try {
      const blob = await client.exportSession(sessionId, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brillio-session-${sessionId}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toasts.push('error', `Export failed: ${(err as Error).message}`);
    }
  };

  const streaming = state?.status === 'streaming';

  const emptyState = useMemo<SessionState>(
    () => ({
      knowledgeBaseId: activeKbId,
      provider: activeProvider,
      userId: '',
      messages: [],
      streamingText: '',
      thinkingText: '',
      status: 'idle',
      usageLevel: 'normal',
    }),
    [activeKbId, activeProvider],
  );

  const view = state ?? emptyState;

  return (
    <div className="chat">
      <header className="chat__header">
        <div className="chat__header-left">
          <Dropdown
            label="Knowledge base"
            value={activeKbId}
            options={kbOptions}
            align="left"
            onChange={onSelectKb}
          />
        </div>
        <div className="chat__title">
          <span className="chat__logo">◆</span> Brillio
        </div>
        <div className="chat__header-right">
          <Dropdown
            label="Model / provider"
            value={activeProvider}
            options={providerOptions}
            align="right"
            onChange={onSelectProvider}
          />
        </div>
      </header>

      <div className="chat__body">
        <main className="chat__main">
          <MessageList state={view} />
          <Composer
            streaming={!!streaming}
            disabled={!activeKbId}
            onSend={onSend}
            onCancel={onCancel}
          />
        </main>

        <aside className="chat__aside">
          <TokenUsageBar usage={view.usage} level={view.usageLevel} />

          <div className="chat__export">
            <span className="chat__export-title">Export session</span>
            <div className="chat__export-btns">
              <button className="chat__export-btn primary" onClick={() => exportSession('json')}>
                JSON
              </button>
              <button className="chat__export-btn" onClick={() => exportSession('csv')}>
                CSV
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
