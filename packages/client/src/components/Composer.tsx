import { useState, type KeyboardEvent } from 'react';
import './Composer.scss';

interface ComposerProps {
  streaming: boolean;
  disabled?: boolean;
  onSend: (text: string) => void;
  onCancel: () => void;
}

/** Message input. Enter sends, Shift+Enter newlines. */
export function Composer({ streaming, disabled, onSend, onCancel }: ComposerProps) {
  const [text, setText] = useState('');

  const send = () => {
    const value = text.trim();
    if (!value || streaming || disabled) return;
    onSend(value);
    setText('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="composer">
      <textarea
        className="composer__input"
        placeholder={disabled ? 'Select a knowledge base to begin…' : 'Message Brillio…'}
        value={text}
        disabled={disabled}
        rows={1}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
      />
      {streaming ? (
        <button type="button" className="composer__btn composer__btn--stop" onClick={onCancel}>
          Stop
        </button>
      ) : (
        <button
          type="button"
          className="composer__btn composer__btn--send"
          disabled={disabled || !text.trim()}
          onClick={send}
        >
          Send
        </button>
      )}
    </div>
  );
}
