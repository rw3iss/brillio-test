import type { SessionUsageSummary } from '@brillio/shared';
import type { UsageLevel } from '../sdk/index.js';
import './TokenUsageBar.scss';

interface TokenUsageBarProps {
  usage?: SessionUsageSummary;
  level: UsageLevel;
  /** Estimated input tokens for the message currently being composed/sent. */
  pendingInput?: number;
}

const fmt = (n: number) => n.toLocaleString();

/**
 * Live context-usage widget: input vs output totals, a percent-of-context bar
 * that turns orange at >=75% and red at >=90%, and running session cost.
 */
export function TokenUsageBar({ usage, level, pendingInput }: TokenUsageBarProps) {
  const percent = usage?.percentUsed ?? 0;

  return (
    <div className={`usage usage--${level}`}>
      <div className="usage__row">
        <span className="usage__title">Context usage</span>
        <span className="usage__percent">{percent.toFixed(1)}%</span>
      </div>

      <div className="usage__track">
        <div className="usage__fill" style={{ width: `${Math.min(100, percent)}%` }} />
      </div>

      <div className="usage__stats">
        <span>
          in <strong>{fmt(usage?.inputTokens ?? 0)}</strong>
        </span>
        <span>
          out <strong>{fmt(usage?.outputTokens ?? 0)}</strong>
        </span>
        <span>
          total <strong>{fmt(usage?.totalTokens ?? 0)}</strong>
          {usage?.contextWindow ? ` / ${fmt(usage.contextWindow)}` : ''}
        </span>
      </div>

      <div className="usage__footer">
        <span className="usage__cost">${(usage?.cost ?? 0).toFixed(5)}</span>
        {pendingInput != null && pendingInput > 0 && (
          <span className="usage__pending">+~{fmt(pendingInput)} pending</span>
        )}
      </div>
    </div>
  );
}
