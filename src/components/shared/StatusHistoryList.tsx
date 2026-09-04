import type { StatusHistory } from '../../types/moveRequest';
import { dateLabel, label } from '../common';

export function StatusHistoryList({ history }: { history: StatusHistory[] }) {
  return history.length ? <ol className="activity-list timeline">{history.map((item) => <li key={item.id}>
    <strong>{item.fromStatus === 'NEEDS_CHANGES' && item.toStatus === 'SUBMITTED' ? 'Resubmitted'
      : item.fromStatus === null && item.toStatus === 'DRAFT' ? 'Request created' : label(item.toStatus)}</strong>
    <p className="muted small">{label(item.changedByType)} · {dateLabel(item.createdAt, true)}</p>
    {item.reason && <p className="preserve-lines">{item.reason}</p>}
  </li>)}</ol> : <p className="muted small">No status changes recorded yet.</p>;
}
