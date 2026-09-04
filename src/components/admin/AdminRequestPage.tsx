import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useResource } from '../../hooks/useResource';
import { loadAdminRequest } from '../../services/adminApi';
import { apiErrors } from '../../services/http';
import type { FieldError, RunAction } from '../../types/moveRequest';
import { dateLabel, ErrorNotice, label, StatusBadge } from '../common';
import { ResidentInfoPanel } from './ResidentInfoPanel';
import { RequestDetailsPanel } from './RequestDetailsPanel';
import { DocumentReviewPanel } from './DocumentReviewPanel';
import { ChecklistPanel } from './ChecklistPanel';
import { AgentAssessmentPanel } from './AgentAssessmentPanel';
import { AdminDecisionPanel } from './AdminDecisionPanel';
import { AdminCommentsPanel } from './AdminCommentsPanel';
import { StatusHistoryPanel } from './StatusHistoryPanel';
import { AuditLogPanel } from './AuditLogPanel';
import styles from './AdminRequestPage.module.css';

export function AdminRequestPage({ adminId, requestId }: { adminId: string; requestId: string }) {
  const resource = useResource(useCallback(() => loadAdminRequest(requestId, adminId), [requestId, adminId]));
  const location = useLocation();
  const [writing, setWriting] = useState(false);
  const lock = useRef(false);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const feedback = useRef<HTMLDivElement>(null);
  useEffect(() => { if (errors.length) feedback.current?.scrollIntoView({ block: 'nearest' }); }, [errors]);
  const busy = writing || resource.loading || resource.errors.length > 0;
  const runAction: RunAction = async (operation, successMessage) => {
    if (lock.current || busy) return false;
    lock.current = true; setWriting(true); setErrors([]); setNotice('');
    try {
      await operation();
      const refreshed = await resource.refresh();
      setRevision((value) => value + 1);
      if (refreshed) setNotice(successMessage);
      else setErrors([{ field: 'request', message: 'The action was saved, but the updated request could not be loaded. Refresh before taking another action.' }]);
      return true;
    } catch (error) {
      setErrors(apiErrors(error));
      // Reconcile server state after a stale transition or uncertain network result.
      await resource.refresh(); setRevision((value) => value + 1);
      return false;
    } finally { lock.current = false; setWriting(false); }
  };
  const data = resource.data;
  const request = data?.request;
  const search = typeof location.state?.dashboardSearch === 'string' ? location.state.dashboardSearch : '';
  return <><Link className="back-link" to={request ? `/admin/${adminId}/community/${request.communityId}${search}` : '/admin'}>← Back to admin dashboard</Link>
    <div className="page-heading row spread"><div><p className="eyebrow">{request?.community?.name ?? 'Community admin workspace'}</p>
      <h1>{request ? `${label(request.type)} request review` : 'Request review'}</h1>
      {request && <><p className="muted">{request.resident?.name} · Unit {request.unit?.unitNumber ?? '—'} · {dateLabel(request.requestedDate)} · {request.requestedTimeSlot ?? 'Time not set'}</p>
        <p className="muted small">Created {dateLabel(request.createdAt, true)} · Submitted {dateLabel(request.submittedAt, true)}</p></>}</div>
      {request && <StatusBadge status={request.status} />}
    </div>
    <ErrorNotice errors={resource.errors} retry={() => { void resource.refresh().then(() => setRevision((value) => value + 1)); }} />
    <div ref={feedback} aria-live="polite"><ErrorNotice errors={errors} />{notice && <p className="notice success" role="status">{notice}</p>}{writing && <p role="status" className={styles.processing}>Saving action. Please wait…</p>}</div>
    {resource.loading && !data && <p role="status">Loading request review…</p>}
    {data && request && <><div className={styles.refreshRow}><p className="muted small">Review the evidence, then record your decision.</p><button className="text-button" disabled={busy} onClick={() => { void resource.refresh().then(() => setRevision((value) => value + 1)); }}>Refresh review</button></div>
      {request.rejectionReason && <p className="notice error preserve-lines" role="alert">Rejection reason: {request.rejectionReason}</p>}
      <div className={styles.layout}><div className={styles.column}>
        <ResidentInfoPanel request={request} /><RequestDetailsPanel request={request} />
        <DocumentReviewPanel documents={request.documents} config={request.workflowConfig} {...{ requestId, adminId, busy, runAction }} />
        <ChecklistPanel items={request.checklistItems} {...{ requestId, adminId, busy, runAction }} />
        <AdminCommentsPanel comments={data.comments} {...{ requestId, adminId, busy, runAction }} />
        <StatusHistoryPanel history={data.history} /><AuditLogPanel {...{ requestId, adminId, revision }} />
      </div><aside className={styles.column} aria-label="Assessment and decisions">
        <AdminDecisionPanel key={request.status} status={request.status} allowedActions={request.allowedActions} {...{ requestId, adminId, busy, runAction }} />
        <AgentAssessmentPanel {...{ requestId, adminId, busy, runAction, revision }} />
      </aside></div>
    </>}
  </>;
}
