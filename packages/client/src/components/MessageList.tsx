import { useEffect, useRef } from 'react';
import type { AssistantMessage, SessionState } from '../sdk/index.js';
import { MessageBubble } from './MessageBubble.js';
import './MessageList.scss';

export function MessageList({ state }: { state: SessionState }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages.length, state.streamingText, state.thinkingText]);

  const empty = state.messages.length === 0 && state.status !== 'streaming';

  return (
    <div className="msglist">
      {empty && (
        <div className="msglist__empty">
          <h2>Ask anything about your knowledge base</h2>
          <p>Answers stream in live and cite the documents they came from.</p>
        </div>
      )}

      {state.messages.map((m) => (
        <MessageBubble key={m.id} message={m as AssistantMessage} />
      ))}

      {state.status === 'streaming' && state.thinkingText && !state.streamingText && (
        <div className="msglist__thinking">{state.thinkingText}</div>
      )}

      {state.status === 'streaming' && state.streamingText && (
        <MessageBubble
          streaming
          message={{
            id: 'streaming',
            role: 'assistant',
            content: state.streamingText,
            providerId: state.provider,
            createdAt: new Date().toISOString(),
          }}
        />
      )}

      {state.status === 'streaming' && !state.streamingText && !state.thinkingText && (
        <div className="msglist__typing">
          <span />
          <span />
          <span />
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
