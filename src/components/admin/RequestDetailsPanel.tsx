import type { AdminRequest } from '../../types/admin';
import { dateLabel, label } from '../common';

export function RequestDetailsPanel({ request }: { request: AdminRequest }) {
  return <section className="panel" aria-labelledby="request-details-heading"><h2 id="request-details-heading">Move request details</h2>
    <dl className="request-meta"><div><dt>Type</dt><dd>{label(request.type)}</dd></div><div><dt>Requested date</dt><dd>{dateLabel(request.requestedDate)}</dd></div>
      <div><dt>Requested time slot</dt><dd>{request.requestedTimeSlot ?? 'Not set'}</dd></div><div><dt>Submitted</dt><dd>{dateLabel(request.submittedAt, true)}</dd></div>
      {Object.entries({ vehicleCount: request.details?.vehicleCount, occupantCount: request.details?.occupantCount,
        notes: request.details?.notes }).map(([field, value]) => <div key={field}><dt>{label(field)}</dt><dd className="preserve-lines">{value ?? 'Not set'}</dd></div>)}
    </dl>
    {request.details?.vehicleDetails != null && <><h3>Vehicle details</h3><pre>{JSON.stringify(request.details.vehicleDetails, null, 2)}</pre></>}
    {request.workflowConfig ? <details><summary>Community requirements</summary>
      <p className="instructions">{request.workflowConfig.instructions || 'No additional instructions.'}</p>
      <p className="small">Required fields: {request.workflowConfig.requiredFields.map(label).join(', ') || 'None'}.</p>
      <p className="small">{request.workflowConfig.requiredDocuments.length ? `Required documents: ${request.workflowConfig.requiredDocuments.map(label).join(', ')}.` : 'Supporting documents are optional.'}</p>
      <p className="small">Allowed days: {request.workflowConfig.allowedDays.map(label).join(', ') || 'None'}.</p>
      <p className="small">Time slots: {request.workflowConfig.allowedTimeSlots.map((slot) => `${slot.start}–${slot.end}`).join(', ') || 'None'}.</p>
    </details> : <p className="notice error" role="alert">This move type does not have a community workflow configuration.</p>}
  </section>;
}
