import { useState } from 'react';
import type { KnowledgeBaseInfo } from '@brillio/shared';
import { Dropdown, type DropdownOption } from './Dropdown.js';
import type { BrillioError } from '../sdk/index.js';
import './Landing.scss';

interface LandingProps {
  knowledgeBases: KnowledgeBaseInfo[];
  loading: boolean;
  error?: BrillioError;
  transportKind: 'ws' | 'sse';
  onStart: (kbId: string) => void;
}

/** Minimal entry screen: pick a knowledge base, then start a session. */
export function Landing({ knowledgeBases, loading, error, transportKind, onStart }: LandingProps) {
  const [selected, setSelected] = useState<string | undefined>();

  const options: DropdownOption<string>[] = knowledgeBases.map((kb) => ({
    value: kb.id,
    label: kb.folder,
    sublabel: `${kb.name} · ${kb.documentCount} docs`,
    disabled: !kb.ingested,
    tooltip: kb.ingested ? kb.description : 'Not indexed yet',
  }));

  return (
    <div className="landing">
      <div className="landing__card">
        <div className="landing__brand">
          <span className="landing__logo">◆</span>
          <h1>Brillio</h1>
        </div>
        <p className="landing__tagline">
          Streaming answers grounded in your knowledge base, across multiple model providers.
        </p>

        {error && <div className="landing__error">Couldn’t load knowledge bases: {error.message}</div>}

        {loading ? (
          <div className="landing__loading">Loading knowledge bases…</div>
        ) : knowledgeBases.length === 0 && !error ? (
          <div className="landing__empty">No knowledge bases available.</div>
        ) : (
          <div className="landing__form">
            <Dropdown
              label="Knowledge base"
              placeholder="Choose a library…"
              value={selected}
              options={options}
              onChange={setSelected}
            />
            <button
              className="landing__start"
              disabled={!selected}
              onClick={() => selected && onStart(selected)}
            >
              Start session
            </button>
          </div>
        )}

        <div className="landing__transport">
          Transport: <strong>{transportKind === 'ws' ? 'WebSocket' : 'SSE'}</strong>
        </div>
      </div>
    </div>
  );
}
