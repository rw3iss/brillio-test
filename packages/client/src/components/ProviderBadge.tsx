import type { ProviderStatus } from '@brillio/shared';
import './Badge.scss';

const STATUS_LABEL: Record<ProviderStatus, string> = {
  available: 'Available',
  degraded: 'Degraded',
  unavailable: 'Offline',
};

export function ProviderBadge({ status }: { status: ProviderStatus }) {
  return <span className={`badge badge--${status}`}>{STATUS_LABEL[status]}</span>;
}
