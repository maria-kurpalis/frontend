import { Link, useLocation } from 'react-router-dom';
import type { MoveRequest } from '../../types/moveRequest';
import { dateLabel, label, StatusBadge } from '../common';
import styles from './AdminDashboard.module.css';

export function AdminRequestList({ requests, adminId, emptyMessage = 'No requests match these filters.' }: { requests: MoveRequest[]; adminId: string; emptyMessage?: string }) {
  const location = useLocation();
  if (!requests.length) return <p className="empty-inline">{emptyMessage}</p>;
  return <ul className={styles.requestList}>{requests.map((request) => <li className={styles.requestRow} key={request.id}>
    <div className={styles.resident}><strong>{request.resident?.name ?? 'Resident'}</strong><span className="muted small">Unit {request.unit?.unitNumber ?? '—'}</span></div>
    <div><span className={styles.caption}>Type</span>{label(request.type)}</div>
    <div><span className={styles.caption}>Requested date / time</span>{dateLabel(request.requestedDate)}<p className="muted small">{request.requestedTimeSlot ?? 'Time not set'}</p></div>
    <div><span className={styles.caption}>Status</span><StatusBadge status={request.status} /></div>
    <div><span className={styles.caption}>Created</span>{dateLabel(request.createdAt)}</div>
    <Link className="button secondary" aria-label={`View ${request.resident?.name ?? 'resident'} ${label(request.type).toLowerCase()} request`}
      to={`/admin/${adminId}/move-requests/${request.id}`} state={{ dashboardSearch: location.search }}>View →</Link>
  </li>)}</ul>;
}
