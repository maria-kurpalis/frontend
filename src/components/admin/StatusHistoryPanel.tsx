import type { StatusHistory } from '../../types/moveRequest';
import { StatusHistoryList } from '../shared/StatusHistoryList';

export function StatusHistoryPanel({ history }: { history: StatusHistory[] }) {
  return <section className="panel" aria-labelledby="status-history-heading"><h2 id="status-history-heading">Status history</h2><StatusHistoryList history={history} /></section>;
}
