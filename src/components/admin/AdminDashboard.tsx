import { useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { useResource } from '../../hooks/useResource';
import type { RequestStatus, RequestType } from '../../types/moveRequest';
import { dateLabel, ErrorNotice, label } from '../common';
import { AdminRequestList } from './AdminRequestList';
import styles from './AdminDashboard.module.css';

const statuses: RequestStatus[] = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'NEEDS_CHANGES', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'];
export function AdminDashboard({ adminId, communityId }: { adminId: string; communityId: string }) {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const type = params.get('type') ?? '';
  const dashboard = useResource(useCallback(() => adminApi.dashboard(communityId), [communityId]));
  const notifications = useResource(useCallback(() => adminApi.notifications(adminId), [adminId]));
  const requests = useResource(useCallback(() => adminApi.requests(communityId, {
    ...(status ? { status: status as RequestStatus } : {}), ...(type ? { type: type as RequestType } : {}),
  }), [communityId, status, type]));
  function filter(key: string, value: string) {
    setParams((current) => { const next = new URLSearchParams(current); if (value) next.set(key, value); else next.delete(key); return next; });
  }
  const data = dashboard.data;
  return <><div className="page-heading row spread"><div><p className="eyebrow">Community admin workspace</p>
    <h1>{data?.community.name ?? 'Community dashboard'}</h1><p className="muted">Review incoming moves and follow each request through completion.</p></div>
    <div className="row"><Link to={`/admin/${adminId}/community/${communityId}/workflow-config`}>Workflow configuration</Link><Link className="text-link" to="/admin">Change admin / community</Link></div></div>
    <ErrorNotice errors={dashboard.errors} retry={() => { void dashboard.refresh(); }} />
    {dashboard.loading && !data && <p role="status">Loading dashboard…</p>}
    {data && <><section className={styles.summaryGrid} aria-label="Community request summary">
      {([
        ['Total requests', data.totalRequests], ['Submitted', data.submittedRequests], ['Under review', data.underReviewRequests],
        ['Changes Requested', data.needsChangesRequests], ['Approved', data.approvedRequests], ['Completed', data.completedRequests],
      ] as const).map(([name, count]) => <div className="panel summary-card" key={name}><p>{name}</p><strong>{count}</strong></div>)}
    </section><p className="muted small">Move in: {data.moveInRequests} · Move out: {data.moveOutRequests}</p><section className={`panel ${styles.section}`} aria-labelledby="recent-admin-heading"><div className="row spread"><h2 id="recent-admin-heading">Recent requests</h2><span className="muted small">Latest 5 · all statuses</span></div>
      <AdminRequestList requests={data.recentRequests} adminId={adminId} emptyMessage="No requests have been created for this community yet." />
    </section></>}
    <section className={`panel ${styles.section}`} aria-labelledby="all-admin-heading"><div className="row spread"><h2 id="all-admin-heading">All requests</h2>
      <button className="text-button" disabled={requests.loading} onClick={() => { void requests.refresh(); void dashboard.refresh(); }}>Refresh requests</button></div>
      <div className={styles.filters}><div><label htmlFor="filter-status">Filter by status</label><select id="filter-status" value={status} onChange={(event) => filter('status', event.target.value)}>
        <option value="">All statuses</option>{statuses.map((value) => <option value={value} key={value}>{label(value)}</option>)}</select></div>
        <div><label htmlFor="filter-type">Filter by type</label><select id="filter-type" value={type} onChange={(event) => filter('type', event.target.value)}>
          <option value="">Both move types</option><option value="MOVE_IN">Move in</option><option value="MOVE_OUT">Move out</option></select></div>
        {(status || type) && <button className="text-button" onClick={() => setParams({})}>Clear filters</button>}
      </div><ErrorNotice errors={requests.errors} retry={() => { void requests.refresh(); }} />
      {requests.loading ? <p role="status" className="empty-inline">Loading requests…</p> : requests.data && !requests.errors.length && <AdminRequestList requests={requests.data} adminId={adminId} />}
    </section>
    <section className={`panel ${styles.section}`} aria-labelledby="admin-notifications-heading"><div className="row spread"><h2 id="admin-notifications-heading">Notifications</h2>
      <button className="text-button" disabled={notifications.loading} onClick={() => { void notifications.refresh(); }}>Refresh notifications</button></div>
      <ErrorNotice errors={notifications.errors} retry={() => { void notifications.refresh(); }} />
      {notifications.loading && !notifications.data && <p role="status">Loading notifications…</p>}
      {notifications.data && (notifications.data.length ? <ul className="activity-list">{notifications.data.slice(0, 5).map((item) => <li key={item.id}>
        <div className="row spread"><strong>{item.title}</strong><time className="muted small" dateTime={item.createdAt}>{dateLabel(item.createdAt, true)}</time></div>
        <p>{item.message}</p>{item.moveRequestId && <Link to={`/admin/${adminId}/move-requests/${item.moveRequestId}`}>Review request</Link>}
      </li>)}</ul> : <p className="empty-inline">No notifications yet.</p>)}
    </section>
  </>;
}
