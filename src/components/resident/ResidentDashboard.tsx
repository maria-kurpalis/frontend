import { useCallback, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useResource } from '../../hooks/useResource';
import { moveRequestApi } from '../../services/moveRequestApi';
import { apiErrors } from '../../services/http';
import type { FieldError, RequestType } from '../../types/moveRequest';
import { dateLabel, ErrorNotice } from '../common';
import { RequestCard } from './RequestCard';

export function ResidentDashboard({ residentId }: { residentId: string }) {
  const navigate = useNavigate();
  const { data, loading, errors, refresh } = useResource(useCallback(() => moveRequestApi.dashboard(residentId), [residentId]));
  const notifications = useResource(useCallback(() => moveRequestApi.notifications(residentId), [residentId]));
  const createLock = useRef(false);
  const [creating, setCreating] = useState<RequestType | null>(null);
  const [actionErrors, setActionErrors] = useState<FieldError[]>([]);
  async function create(type: RequestType) {
    if (createLock.current) return;
    createLock.current = true;
    setCreating(type); setActionErrors([]);
    try {
      const request = await moveRequestApi.create(residentId, type);
      navigate(`/resident/${residentId}/move-requests/${request.id}`);
    } catch (error) { setActionErrors(apiErrors(error)); }
    finally { createLock.current = false; setCreating(null); }
  }
  const name = data?.resident.name;
  return <><div className="page-heading row spread"><div><p className="eyebrow">Your resident workspace</p>
    <h1>{name ? `Welcome, ${name}.` : 'Welcome home.'}</h1><p className="muted">{data?.community?.name}{data?.unit && ` · Unit ${data.unit.unitNumber}`}</p>
    <p className="muted">A clear path from planning your move to getting approval.</p></div>
    <Link className="text-link" to="/">Change resident</Link></div>
    <ErrorNotice errors={errors} retry={() => { void refresh(); }} /><ErrorNotice errors={actionErrors} />
    {loading && !data && <p role="status">Loading your dashboard…</p>}
    {data && <><section aria-label="Request summary" className="summary-grid">
      {([
        ['Total requests', data.totalRequests], ['Draft', data.draftRequests], ['Needs changes', data.needsChangesRequests], ['Approved', data.approvedRequests],
      ] as const).map(([title, count]) => <div className="panel summary-card" key={title}><p>{title}</p><strong>{count}</strong></div>)}
    </section><section className="panel new-request row spread"><div><h2>Planning a move?</h2><p className="muted">Start a request. Your community’s requirements will guide you.</p></div>
      <div className="row actions"><button disabled={Boolean(creating)} onClick={() => { void create('MOVE_IN'); }}>{creating === 'MOVE_IN' ? 'Creating…' : '+ New move-in request'}</button>
        <button className="secondary" disabled={Boolean(creating)} onClick={() => { void create('MOVE_OUT'); }}>{creating === 'MOVE_OUT' ? 'Creating…' : '+ New move-out request'}</button></div>
    </section><section aria-labelledby="recent-heading"><div className="row spread section-heading"><h2 id="recent-heading">Recent requests</h2><span className="muted small">Latest 5</span></div>
      {data.recentRequests.length ? <div className="request-grid">{data.recentRequests.map((request) => <RequestCard key={request.id} request={request} residentId={residentId} />)}</div>
        : <div className="panel empty"><h3>Your next move starts here.</h3><p>No requests yet. Choose move-in or move-out above to get started.</p></div>}
    </section><section className="panel resident-notifications" aria-labelledby="notifications-heading">
      <div className="row spread"><h2 id="notifications-heading">Notifications</h2><button className="text-button" disabled={notifications.loading} onClick={() => { void notifications.refresh(); }}>Refresh notifications</button></div>
      <ErrorNotice errors={notifications.errors} retry={() => { void notifications.refresh(); }} />
      {notifications.loading && !notifications.data && <p role="status">Loading notifications…</p>}
      {notifications.data && (notifications.data.length ? <ul className="activity-list">{notifications.data.slice(0, 5).map((item) => <li key={item.id}>
        <div className="row spread"><strong>{item.title}</strong><time className="muted small" dateTime={item.createdAt}>{dateLabel(item.createdAt, true)}</time></div>
        <p className="preserve-lines">{item.message}</p>{item.moveRequestId && <Link to={`/resident/${residentId}/move-requests/${item.moveRequestId}`}>View request</Link>}
      </li>)}</ul> : <p className="empty-inline">No notifications yet. Updates from your community will appear here.</p>)}
    </section></>}
  </>;
}
