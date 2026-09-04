import { useCallback } from 'react';
import { useResource } from '../../hooks/useResource';
import { adminApi } from '../../services/adminApi';
import type { JsonValue } from '../../types/moveRequest';
import { dateLabel, ErrorNotice, label } from '../common';

function recorded(value: JsonValue | null) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  // Only concise human-relevant fields; never render arbitrary metadata blobs.
  return Object.entries(value).filter(([key, item]) => ['status', 'comment', 'reason', 'rejectionReason', 'documentType', 'requestedDate', 'requestedTimeSlot'].includes(key)
    && (typeof item === 'string' || typeof item === 'number')).map(([key, item]) => ({ key, value: String(item).slice(0, 500) }));
}

export function AuditLogPanel({ requestId, adminId, revision }: { requestId: string; adminId: string; revision: number }) {
  const resource = useResource(useCallback(async () => ({ logs: await adminApi.auditLogs(requestId, adminId), revision }), [requestId, adminId, revision]));
  const logs = resource.data?.logs ?? [];
  return <section className="panel" aria-labelledby="audit-heading"><h2 id="audit-heading">Audit log</h2>
    <p className="muted small">Latest actions first. This history is read-only.</p>
    <ErrorNotice errors={resource.errors} retry={() => { void resource.refresh(); }} />
    {resource.loading && <p className="muted small">Loading audit entries…</p>}
    <details><summary>View audit entries ({logs.length})</summary>{logs.length ? <ul className="activity-list">{logs.map((log) => <li key={log.id}>
      <div className="row spread"><strong>{label(log.action)}</strong><time className="muted small" dateTime={log.createdAt}>{dateLabel(log.createdAt, true)}</time></div>
      <p className="muted small">{label(log.actorType)}</p>
      {([['Before', log.previousValue], ['After', log.newValue], ['Details', log.metadata]] as const).map(([title, value]) => recorded(value).map((item) =>
        <p className="small preserve-lines" key={`${title}-${item.key}`}>{title} · {label(item.key)}: {item.key === 'status' ? label(item.value) : item.value}</p>))}
    </li>)}</ul> : !resource.loading && !resource.errors.length && <p className="empty-inline">No audit entries yet.</p>}</details>
  </section>;
}
