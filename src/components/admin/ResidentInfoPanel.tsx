import type { AdminRequest } from '../../types/admin';
import { label } from '../common';

export function ResidentInfoPanel({ request }: { request: AdminRequest }) {
  const resident = request.resident;
  return <section className="panel" aria-labelledby="resident-info-heading"><h2 id="resident-info-heading">Resident & unit</h2>
    <dl className="request-meta"><div><dt>Resident</dt><dd>{resident?.name ?? 'Not available'}</dd></div><div><dt>Resident type</dt><dd>{resident?.residentType ? label(resident.residentType) : 'Not available'}</dd></div>
      <div><dt>Email</dt><dd>{resident?.email ?? 'Not provided'}</dd></div><div><dt>Phone</dt><dd>{resident?.phone ?? 'Not provided'}</dd></div>
      <div><dt>Unit</dt><dd>{request.unit?.unitNumber ?? 'Not available'}</dd></div><div><dt>Tower / floor</dt><dd>{request.unit?.tower ?? '—'} / {request.unit?.floor ?? '—'}</dd></div>
      <div><dt>Community</dt><dd>{request.community?.name ?? 'Not available'}</dd></div>
    </dl>
  </section>;
}
