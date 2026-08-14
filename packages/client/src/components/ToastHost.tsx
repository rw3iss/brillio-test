import type { ToastApi } from '../hooks/useToasts.js';
import './ToastHost.scss';

/** Renders the notification stack fed by the central toast channel. */
export function ToastHost({ toasts, dismiss }: Pick<ToastApi, 'toasts' | 'dismiss'>) {
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.kind}`} role="alert">
          <div className="toast__body">
            <span className="toast__msg">{t.message}</span>
            <button className="toast__close" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              ×
            </button>
          </div>
          {t.actions && t.actions.length > 0 && (
            <div className="toast__actions">
              {t.actions.map((a, i) => (
                <button
                  key={i}
                  className="toast__action"
                  onClick={() => {
                    a.onClick();
                    dismiss(t.id);
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
