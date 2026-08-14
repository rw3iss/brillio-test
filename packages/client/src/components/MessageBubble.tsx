import type { AssistantMessage } from '../sdk/index.js';
import './MessageBubble.scss';

interface MessageBubbleProps {
  message: AssistantMessage;
  /** True while this assistant bubble is still receiving tokens. */
  streaming?: boolean;
}

export function MessageBubble({ message, streaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  return (
    <div className={`bubble bubble--${isUser ? 'user' : 'assistant'}`}>
      <div className="bubble__meta">
        <span className="bubble__role">{isUser ? 'You' : message.providerId ?? 'Assistant'}</span>
        {message.cost != null && (
          <span className="bubble__cost">${message.cost.toFixed(5)}</span>
        )}
      </div>

      <div className="bubble__body">
        {message.content}
        {streaming && <span className="bubble__caret" />}
      </div>

      {message.sources && message.sources.length > 0 && (
        <div className="bubble__sources">
          <span className="bubble__sources-title">Sources</span>
          <ul>
            {message.sources.map((s, i) => (
              <li key={`${s.documentId}-${i}`} title={s.snippet}>
                <span className="bubble__source-doc">{s.documentName}</span>
                <span className="bubble__source-score">{(s.score * 100).toFixed(0)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
