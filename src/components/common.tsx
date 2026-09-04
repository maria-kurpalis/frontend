import type { FieldError, RequestStatus } from '../types/moveRequest';

export const editable = (status: RequestStatus) => status === 'DRAFT' || status === 'NEEDS_CHANGES';
const labels: Record<string, string> = {
  requestedDate: 'Requested date', requestedTimeSlot: 'Time slot',
  vehicleCount: 'Vehicle count', vehicleDetails: 'Vehicle details', occupantCount: 'Occupant count', notes: 'Notes',
  UNDER_REVIEW: 'Under Review', NEEDS_CHANGES: 'Changes Requested',
  REQUEST_CHANGES: 'Request Changes', MANUAL_REVIEW: 'Manual Review', NOT_APPLICABLE: 'Not Applicable',
};
export function label(value: string): string { return labels[value] ?? value.toLowerCase().replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase()); }
export function dateLabel(value: string | null | undefined, withTime = false): string {
  if (!value) return 'Not set';
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? 'Not set' : new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', ...(withTime ? { hour: 'numeric', minute: '2-digit' } as const : {}),
  }).format(date);
}
export function StatusBadge({ status, text }: { status: string; text?: string }) { return <span className={`badge badge-${status.toLowerCase()}`}>{text ?? label(status)}</span>; }
export function ErrorNotice({ errors, retry }: { errors: FieldError[]; retry?: () => void }) {
  if (!errors.length) return null;
  return <div className="notice error" role="alert"><ul>{errors.map((error, i) => <li key={`${error.field}-${i}`}>{error.message}</li>)}</ul>
    {retry && <button type="button" className="text-button" onClick={retry}>Try again</button>}
  </div>;
}
export function FieldErrors({ field, errors }: { field: string; errors: FieldError[] }) {
  const matching = errors.filter((error) => error.field === field);
  return matching.length ? <div id={`error-${field}`} className="field-error" role="alert">{matching.map((error, i) => <p key={i}>{error.message}</p>)}</div> : null;
}
