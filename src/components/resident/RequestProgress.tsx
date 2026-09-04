import type { MoveRequest, RequestProgressData } from '../../types/moveRequest';
import { dateLabel, label, StatusBadge } from '../common';

export function RequestProgress({ request, progress }: { request: MoveRequest; progress: RequestProgressData }) {
  const { sections, workflowConfig } = progress;
  return <section className="panel" aria-labelledby="progress-heading"><div className="row spread"><h2 id="progress-heading">Your request at a glance</h2><StatusBadge status={request.status} /></div>
    <dl className="request-meta"><div><dt>Move type</dt><dd>{label(request.type)}</dd></div><div><dt>Requested date</dt><dd>{dateLabel(request.requestedDate)}</dd></div>
      <div><dt>Time slot</dt><dd>{request.requestedTimeSlot ?? 'Not set'}</dd></div><div><dt>Unit</dt><dd>{request.unit?.unitNumber ?? '—'}</dd></div></dl>
    {workflowConfig?.instructions && <p className="instructions">{workflowConfig.instructions}</p>}
    {workflowConfig && <p className="muted small">Allowed days: {workflowConfig.allowedDays.map(label).join(', ') || 'None configured'}.</p>}
    {!workflowConfig && <p className="notice error" role="alert">Community requirements are not configured. Contact your community admin before submitting.</p>}
    <div className="progress-section">
      <div className="row spread"><h3>Move details</h3><span className="muted small">{sections.moveDetails.completed ? 'Complete' : 'To do'}</span></div>
      {sections.moveDetails.items.length ? <ul className="progress-list">{sections.moveDetails.items.map((item) => <li key={item.key}>
        <span className={item.completed ? 'done' : 'pending'} aria-label={item.completed ? 'Complete' : 'Missing'}>{item.completed ? '✓' : '○'}</span>{label(item.key)}
      </li>)}</ul> : <p className="muted small">{workflowConfig ? 'No requirements configured.' : 'Requirements unavailable.'}</p>}
    </div>
    <div className="progress-section"><div className="row spread"><h3>Checklist</h3><span className="muted small">{sections.checklist.items.length ? (sections.checklist.completed ? 'Complete' : 'In progress') : 'No items'}</span></div>
      {sections.checklist.items.length > 0 && <ul className="progress-list">{sections.checklist.items.map((item) => <li key={item.id}>
        <span className={item.status !== 'PENDING' ? 'done' : 'pending'} aria-hidden="true">{item.status === 'COMPLETED' ? '✓' : item.status === 'NOT_APPLICABLE' ? '–' : '○'}</span>
        <span>{item.label} <span className="muted small">· {label(item.status)}</span></span>
      </li>)}</ul>}
      <p className="muted small">Checklist review is handled by your community and does not block submission.</p>
    </div>
    <p className={`readiness ${progress.readyToSubmit ? 'ready' : ''}`}>
      {progress.readyToSubmit ? '✓ Ready to submit' : request.status === 'DRAFT' || request.status === 'NEEDS_CHANGES' ? 'Complete the requirements below before submitting.' : `Request ${label(request.status).toLowerCase()}`}
    </p>
    {progress.errors.length > 0 && <ul className="small progress-errors" role="alert">{progress.errors.map((error, i) => <li key={`${error.field}-${i}`}>{error.message}</li>)}</ul>}
  </section>;
}
