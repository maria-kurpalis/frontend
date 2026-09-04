import { useCallback, useState } from 'react';
import { useResource } from '../../hooks/useResource';
import { adminApi } from '../../services/adminApi';
import type { JsonValue, RunAction } from '../../types/moveRequest';
import { dateLabel, ErrorNotice, label, StatusBadge } from '../common';
import styles from './AgentAssessmentPanel.module.css';

function issuesList(issues: JsonValue | null): string[] {
  if (!Array.isArray(issues)) return issues == null ? [] : ['Issue details are unavailable.'];
  return issues.map((issue) => {
    if (typeof issue === 'string') return issue;
    if (issue && !Array.isArray(issue) && typeof issue === 'object' && typeof issue.message === 'string') {
      return `${typeof issue.field === 'string' ? `${label(issue.field)}: ` : ''}${issue.message}`;
    }
    return 'Issue details are unavailable.';
  });
}
export function AgentAssessmentPanel({ requestId, adminId, busy, runAction, revision }: {
  requestId: string; adminId: string; busy: boolean; runAction: RunAction; revision: number;
}) {
  const resource = useResource(useCallback(async () => ({ assessment: await adminApi.latestAssessment(requestId, adminId), revision }), [requestId, adminId, revision]));
  const summaryResource = useResource(useCallback(async () => ({ summary: await adminApi.summary(requestId, adminId), revision }), [requestId, adminId, revision]));
  const [running, setRunning] = useState(false);
  async function assess() {
    if (busy || running) return;
    setRunning(true);
    try { await runAction(() => adminApi.assess(requestId, adminId), 'AI assessment saved. Review its recommendation before deciding.'); }
    finally { setRunning(false); }
  }
  const assessment = resource.data?.assessment;
  const summary = summaryResource.data?.summary;
  const issues = issuesList(assessment?.issues ?? null);
  return <section className={`panel ${styles.panel}`} aria-labelledby="assessment-heading"><div className="row spread"><h2 id="assessment-heading">Agent assessment</h2><span className={styles.advisory}>Advisory</span></div>
    <p className={styles.boundary}>AI recommendation — final decision remains with the admin. You make the final decision; running an assessment does not change the request status.</p>
    <ErrorNotice errors={resource.errors} retry={() => { void resource.refresh(); }} />
    {resource.loading && <p role="status" className="muted small">Refreshing assessment and summary…</p>}
    {assessment ? <><div className={styles.recommendation}><span className="muted small">AI recommendation</span><strong>{label(assessment.recommendation)}</strong></div>
      <p className="small">Confidence: {assessment.confidence == null ? 'Not provided' : `${Math.round(Number(assessment.confidence) * 100)}%`}</p>
      <p className="muted small">Generated {dateLabel(assessment.createdAt, true)}. This assessment reflects the request at that time.</p>
      <h3>Reasoning</h3><p className="preserve-lines">{assessment.reasoning}</p><h3>Issues</h3>
      {issues.length ? <ul className={styles.issues}>{issues.map((issue, i) => <li key={i}>{issue}</li>)}</ul> : <p className="muted small">No issues were recorded in this assessment.</p>}
    </> : !resource.loading && !resource.errors.length && <p className="empty-inline">No assessment yet. Run one when you are ready.</p>}
    <button disabled={busy || running || resource.loading} onClick={() => { void assess(); }}>{running ? 'Running assessment…' : 'Run AI assessment'}</button>
    <ErrorNotice errors={summaryResource.errors} retry={() => { void summaryResource.refresh(); }} />
    {summaryResource.loading && <p className="muted small">Refreshing deterministic summary…</p>}
    {summary && <div className={styles.summary}><h3>Current request summary</h3><div className="row"><StatusBadge status={summary.status} /></div>
      <p>{summary.resident?.name} · Unit {summary.unit?.unitNumber ?? '—'}</p><p className="small">{dateLabel(summary.requestedDate)} · {summary.requestedTimeSlot ?? 'Time not set'}</p>
      <p className="small">{summary.documentCounts.required ? `${summary.documentCounts.required} required documents` : 'Supporting documents are optional'} · {summary.documentCounts.uploaded} uploaded · {summary.documentCounts.verified} verified · {summary.documentCounts.rejected} rejected</p>
      <p className="small">Checklist: {summary.checklistCounts.completed} completed · {summary.checklistCounts.pending} pending · {summary.checklistCounts.notApplicable} not applicable</p>
      <h3>Submission validation</h3>{summary.validation.errors.length ? <ul className={`${styles.issues} error-message`} role="alert">{summary.validation.errors.map((error, i) => <li key={i}>{error.message}</li>)}</ul>
        : <p className="small done">Community submission requirements are satisfied.</p>}
      <h3>Review checks</h3>{summary.validation.reviewWarnings.length ? <ul className={`${styles.issues} error-message`} role="alert">{summary.validation.reviewWarnings.map((error, i) => <li key={i}>{error.message}</li>)}</ul>
        : <p className="small done">No outstanding review warnings.</p>}
    </div>}
  </section>;
}
