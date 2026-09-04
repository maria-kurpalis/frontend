import { useState } from 'react';
import { adminApi } from '../../services/adminApi';
import type { AdminDecision } from '../../types/admin';
import type { RequestStatus, RunAction } from '../../types/moveRequest';
import { label } from '../common';
import styles from './AdminRequestPage.module.css';

export function AdminDecisionPanel({ requestId, adminId, status, busy, runAction, allowedActions }: {
  requestId: string; adminId: string; status: RequestStatus; busy: boolean; runAction: RunAction; allowedActions: AdminDecision[];
}) {
  const [text, setText] = useState('');
  const [reasonError, setReasonError] = useState('');
  async function decide(action: AdminDecision) {
    if (busy || !allowedActions.includes(action)) return;
    if ((action === 'request-changes' || action === 'reject') && !text.trim()) { setReasonError('Enter a reason before requesting changes or rejecting the request.'); return; }
    setReasonError('');
    if ((action === 'approve' || action === 'reject') && !window.confirm(`${action === 'approve' ? 'Approve' : 'Reject'} this move request? This records your final review decision.`)) return;
    const messages: Record<AdminDecision, string> = {
      review: 'Review started.', approve: 'Request approved.', 'request-changes': 'Changes requested. The resident can edit and resubmit.',
      reject: 'Request rejected.', complete: 'Request marked completed.',
    };
    if (await runAction(() => adminApi.decide(requestId, adminId, action, action === 'review' ? undefined : text), messages[action])) setText('');
  }
  return <section className={`panel ${styles.decisionPanel}`} aria-labelledby="decision-heading"><h2 id="decision-heading">Admin decision</h2>
    {allowedActions.includes('review') ? <><p className="muted small">Start the review before approving, rejecting or requesting changes.</p>
      <button disabled={busy} onClick={() => { void decide('review'); }}>Start review</button></>
      : allowedActions.some((action) => ['approve', 'request-changes', 'reject'].includes(action)) ? <form onSubmit={(event) => event.preventDefault()}><fieldset disabled={busy}>
        <p className="muted small">The final decision is yours. Check the request and any supporting documents before proceeding.</p>
        <label htmlFor="decision-note">Decision comment / reason</label><textarea id="decision-note" rows={3} maxLength={8000} value={text} aria-invalid={Boolean(reasonError)} aria-describedby="decision-error"
          onChange={(event) => { setText(event.target.value); setReasonError(''); }} />
        <p className="muted small">A reason is required for Request changes and Reject. An approval comment is optional.</p>
        {reasonError && <p id="decision-error" className="field-error" role="alert">{reasonError}</p>}
        <div className="row actions">{allowedActions.includes('approve') && <button type="button" onClick={() => { void decide('approve'); }}>Approve</button>}
          {allowedActions.includes('request-changes') && <button className="secondary" type="button" onClick={() => { void decide('request-changes'); }}>Request changes</button>}
          {allowedActions.includes('reject') && <button className="danger" type="button" onClick={() => { void decide('reject'); }}>Reject</button>}</div>
      </fieldset></form>
        : allowedActions.includes('complete') ? <form onSubmit={(event) => { event.preventDefault(); void decide('complete'); }}><fieldset disabled={busy}>
          <p className="muted small">Mark the request completed once the move has finished.</p>
          <label htmlFor="completion-comment">Completion comment (optional)</label><textarea id="completion-comment" maxLength={8000} rows={2} value={text} onChange={(event) => setText(event.target.value)} />
          <button type="submit">Mark completed</button>
        </fieldset></form>
          : <p className="muted small">{status === 'NEEDS_CHANGES' ? 'Waiting for the resident to update and resubmit. Start a new review once it is submitted.'
            : status === 'DRAFT' ? 'Waiting for the resident to submit this draft.' : `This request is ${label(status).toLowerCase()}. No further decision is available.`}</p>}
  </section>;
}
