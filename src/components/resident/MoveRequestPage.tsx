import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useResource } from '../../hooks/useResource';
import { loadRequestPage, moveRequestApi } from '../../services/moveRequestApi';
import { apiErrors } from '../../services/http';
import type { FieldError, RunAction } from '../../types/moveRequest';
import { dateLabel, editable, ErrorNotice, label, StatusBadge } from '../common';
import { AgentChat } from './AgentChat';
import { DocumentSection } from './DocumentSection';
import { RequestDetailsForm } from './RequestDetailsForm';
import { RequestProgress } from './RequestProgress';
import { RequestStatus } from './RequestStatus';

export function MoveRequestPage({ residentId, requestId }: { residentId: string; requestId: string }) {
  const resource = useResource(useCallback(() => loadRequestPage(requestId, residentId), [requestId, residentId]));
  const [writing, setWriting] = useState(false);
  const writeLock = useRef(false);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [notice, setNotice] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const feedback = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  const runAction: RunAction = async (operation, message) => {
    if (writeLock.current) return false;
    writeLock.current = true; setWriting(true); setErrors([]); setNotice('');
    try {
      await operation();
      const refreshed = await resource.refresh();
      if (refreshed) setNotice(message);
      else setErrors([{ field: 'request', message: 'Your change was saved, but the refreshed request could not be loaded. Retry loading before making more changes.' }]);
      return true;
    } catch (error) {
      setErrors(apiErrors(error));
      feedback.current?.scrollIntoView({ block: 'nearest' });
      // Re-read a possible concurrent status change before enabling further edits.
      await resource.refresh();
      return false;
    } finally { writeLock.current = false; setWriting(false); }
  };
  const data = resource.data;
  const busy = writing || resource.loading || resource.errors.length > 0;
  const canEdit = data ? editable(data.request.status) : false;
  const latestChange = data?.history.filter((item) => item.toStatus === 'NEEDS_CHANGES').at(-1)?.reason;
  const latestAdminComment = data?.comments.filter((item) => item.authorType === 'ADMIN').at(-1)?.comment;
  return <><Link className="back-link" to={`/resident/${residentId}`} onClick={(event) => {
    if (dirty && !window.confirm('Leave this request and discard unsaved detail edits?')) event.preventDefault();
  }}>← Back to dashboard</Link>
    <div className="page-heading"><p className="eyebrow">{data?.request.community?.name ?? 'Resident workspace'}</p>
      <h1>{data ? `${label(data.request.type)} request` : 'Your move request'}</h1>
      {data && <div className="row"><p className="muted">{data.request.resident?.name} · Unit {data.request.unit?.unitNumber ?? '—'} · {dateLabel(data.request.requestedDate)}</p><StatusBadge status={data.request.status} /></div>}
    </div>
    <ErrorNotice errors={resource.errors} retry={() => { void resource.refresh(); }} />
    <div ref={feedback}><ErrorNotice errors={errors} />{notice && <p className="notice success" role="status">{notice}</p>}</div>
    {resource.loading && !data && <p role="status">Loading your request…</p>}
    {data && <>
      {data.request.status === 'NEEDS_CHANGES' && <section className="notice warning" aria-label="Changes requested"><h2>Changes Requested</h2>
        <p className="preserve-lines">{latestChange || latestAdminComment || 'Review the comments below, update your request and submit it again.'}</p>
        <p>Review the outstanding requirements below, add a comment if needed, then resubmit.</p></section>}
      {data.request.status === 'REJECTED' && <p className="notice error preserve-lines" role="alert">Rejection reason: {data.request.rejectionReason ?? 'See the admin comments below.'}</p>}
      <div className="workspace-grid"><div className="chat-column"><AgentChat {...{ requestId, residentId, busy, dirty, runAction }}
        requestRevision={JSON.stringify([data.request, data.documents, data.progress])} /></div>
        <div className="details-column"><RequestProgress request={data.request} progress={data.progress} />
          {canEdit ? <RequestDetailsForm key={JSON.stringify([data.request.requestedDate, data.request.requestedTimeSlot, data.request.details])}
            request={data.request} config={data.progress.workflowConfig} {...{ busy, errors, runAction }} onDirty={setDirty} />
            : <section className="panel"><h2 id="details-heading">Move details</h2><p className="muted small">Details can be edited while a request is a draft or needs changes.</p>
              <dl className="request-meta">{Object.entries({ vehicleCount: data.request.details?.vehicleCount,
                occupantCount: data.request.details?.occupantCount, notes: data.request.details?.notes }).map(([field, value]) => <div key={field}><dt>{label(field)}</dt><dd className="preserve-lines">{value ?? 'Not set'}</dd></div>)}</dl>
              {data.request.details?.vehicleDetails != null && <><h3>Vehicle details</h3><pre>{JSON.stringify(data.request.details.vehicleDetails, null, 2)}</pre></>}
            </section>}
          <DocumentSection requestId={requestId} documents={data.documents} requiredDocuments={data.progress.workflowConfig?.requiredDocuments ?? []}
            canEdit={canEdit} busy={busy || dirty} {...{ errors, runAction }} />
          {canEdit && <section className="panel submit-panel"><h2>{data.request.status === 'NEEDS_CHANGES' ? 'Ready to resubmit?' : 'Ready for review?'}</h2>
            <p className="muted small">{dirty ? 'Save or discard your detail edits before submitting.' : 'Submitting sends this request to your community. Details will be locked while it is under review.'}</p>
            <button disabled={busy || dirty} onClick={() => { void runAction(() => moveRequestApi.submit(requestId), 'Request submitted. Your community has been notified.'); }}>{writing ? 'Working…' : data.request.status === 'NEEDS_CHANGES' ? 'Resubmit request' : 'Submit request'}</button>
          </section>}
          <RequestStatus history={data.history} comments={data.comments} {...{ requestId, residentId, busy, runAction }} />
          {data.progress.canCancel && <section className="panel"><h2>Change of plans?</h2><button className="text-button danger-text" disabled={busy || dirty} onClick={() => setCancelling(!cancelling)}>{cancelling ? 'Keep this request' : 'Cancel request'}</button>
            {cancelling && <form onSubmit={(event) => {
              event.preventDefault();
              if (!cancellationReason.trim() || busy || dirty || !window.confirm('Cancel this move request? This cannot be undone.')) return;
              void runAction(() => moveRequestApi.cancel(requestId, residentId, cancellationReason.trim()), 'Request cancelled. Your community has been notified.');
            }}><label htmlFor="cancellation-reason">Cancellation reason</label><textarea id="cancellation-reason" required maxLength={8000} rows={2} value={cancellationReason} disabled={busy} onChange={(event) => setCancellationReason(event.target.value)} />
              <button className="danger" disabled={busy || dirty || !cancellationReason.trim()}>Confirm cancellation</button></form>}
          </section>}
        </div>
      </div>
    </>}
  </>;
}
