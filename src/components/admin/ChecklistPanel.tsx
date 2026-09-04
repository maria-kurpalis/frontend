import { useState } from 'react';
import { adminApi } from '../../services/adminApi';
import type { ChecklistItem, RunAction } from '../../types/moveRequest';
import { StatusBadge } from '../common';
import styles from './AdminRequestPage.module.css';

function ChecklistRow({ item, requestId, adminId, busy, runAction }: { item: ChecklistItem; requestId: string; adminId: string; busy: boolean; runAction: RunAction }) {
  const [status, setStatus] = useState(item.status);
  return <li className={styles.checklistRow}><div><strong>{item.label}</strong><p><StatusBadge status={item.status} /></p></div>
    <form className="row" onSubmit={(event) => {
      event.preventDefault(); if (status !== item.status) void runAction(() => adminApi.updateChecklist(requestId, adminId, item.id, status), 'Checklist item updated.');
    }}><label className={styles.srOnly} htmlFor={`checklist-${item.id}`}>{item.label} status</label>
      <select id={`checklist-${item.id}`} value={status} disabled={busy} onChange={(event) => setStatus(event.target.value as ChecklistItem['status'])}>
        <option value="PENDING">Pending</option><option value="COMPLETED">Completed</option><option value="NOT_APPLICABLE">Not applicable</option></select>
      <button className="secondary" disabled={busy || status === item.status} type="submit" aria-label={`Save ${item.label} status`}>Save</button>
    </form></li>;
}
export function ChecklistPanel({ items, requestId, adminId, busy, runAction }: { items: ChecklistItem[]; requestId: string; adminId: string; busy: boolean; runAction: RunAction }) {
  return <section className="panel" aria-labelledby="checklist-heading"><h2 id="checklist-heading">Request checklist</h2>
    {items.length ? <ul className={styles.checklist}>{items.map((item) => <ChecklistRow key={`${item.id}:${item.status}`} {...{ item, requestId, adminId, busy, runAction }} />)}</ul>
      : <p className="empty-inline">No checklist items for this request.</p>}
  </section>;
}
