import { Link } from 'react-router-dom';
import type { MoveRequest } from '../../types/moveRequest';
import { dateLabel, editable, label, StatusBadge } from '../common';

export function RequestCard({ request, residentId }: { request: MoveRequest; residentId: string }) {
  return <article className="panel request-card"><div className="row spread"><h3>{label(request.type)} request</h3><StatusBadge status={request.status} /></div>
    <p className="muted">{request.community?.name ?? 'Community'} · Unit {request.unit?.unitNumber ?? '—'}</p>
    <dl className="request-meta"><div><dt>Requested date</dt><dd>{dateLabel(request.requestedDate)}</dd></div>
      <div><dt>Time slot</dt><dd>{request.requestedTimeSlot ?? 'Not set'}</dd></div><div><dt>Created</dt><dd>{dateLabel(request.createdAt)}</dd></div></dl>
    <Link className="button secondary" to={`/resident/${residentId}/move-requests/${request.id}`}>
      {editable(request.status) ? (request.status === 'DRAFT' ? 'Continue draft' : 'Make changes') : 'View request'} <span aria-hidden="true">→</span>
    </Link>
  </article>;
}
