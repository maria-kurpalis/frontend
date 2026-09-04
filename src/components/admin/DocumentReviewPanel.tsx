import { useState } from 'react';
import type { FormEvent } from 'react';
import { adminApi } from '../../services/adminApi';
import type { RequestDocument, RunAction, WorkflowConfig } from '../../types/moveRequest';
import { dateLabel, label, StatusBadge } from '../common';
import { DocumentLink } from '../shared/DocumentLink';

function DocumentReview({ document, requestId, adminId, busy, runAction }: {
  document: RequestDocument; requestId: string; adminId: string; busy: boolean; runAction: RunAction;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  async function reject(event: FormEvent) {
    event.preventDefault();
    if (!reason.trim()) return;
    if (await runAction(() => adminApi.rejectDocument(requestId, adminId, document.id, reason.trim()), 'Document rejected. The reason has been recorded.')) { setReason(''); setRejecting(false); }
  }
  return <li className="document-row"><div className="row spread"><strong>{label(document.documentType)}</strong><StatusBadge status={document.status} /></div>
    <p className="muted small">Uploaded {dateLabel(document.uploadedAt, true)}</p>
    {document.verifiedAt && <p className="muted small">Reviewed by {document.verifier?.name ?? 'Community admin'} · {dateLabel(document.verifiedAt, true)}</p>}
    <div className="row actions"><DocumentLink url={document.fileUrl} />
      {document.status === 'PENDING' && <><button className="secondary" disabled={busy} onClick={() => { void runAction(() => adminApi.verifyDocument(requestId, adminId, document.id), 'Document verified.'); }}>Verify</button>
        <button className="text-button danger-text" disabled={busy} onClick={() => setRejecting(!rejecting)}>{rejecting ? 'Cancel rejection' : 'Reject document'}</button></>}
    </div>
    {rejecting && document.status === 'PENDING' && <form onSubmit={(event) => { void reject(event); }}><fieldset disabled={busy}>
      <label htmlFor={`document-reason-${document.id}`}>Document rejection reason</label><textarea id={`document-reason-${document.id}`} rows={2} required maxLength={8000} value={reason} onChange={(event) => setReason(event.target.value)} />
      <button className="danger" type="submit" disabled={!reason.trim()}>Save document rejection</button>
    </fieldset></form>}
  </li>;
}
export function DocumentReviewPanel({ documents, requestId, adminId, busy, runAction, config }: {
  documents: RequestDocument[]; requestId: string; adminId: string; busy: boolean; runAction: RunAction; config: WorkflowConfig | null;
}) {
  return <section className="panel" aria-labelledby="document-review-heading"><h2 id="document-review-heading">Document review</h2>
    <p className="muted small">Review any supporting documents the resident chose to provide.</p>
    {config && config.requiredDocuments.length > 0 && <div className="document-requirements" aria-label="Required documents"><h3>Required documents</h3>
      {[...new Set(config.requiredDocuments)].map((type) => {
        const matches = documents.filter((document) => document.documentType === type && document.fileUrl.trim());
        const document = matches.find((item) => item.status === 'VERIFIED') ?? matches.find((item) => item.status === 'PENDING') ?? matches[0];
        return <div className="row spread" key={type}><span>{label(type)}</span><StatusBadge status={document?.status ?? 'MISSING'} /></div>;
      })}
    </div>}
    {documents.length ? <ul className="document-list">{documents.map((document) => <DocumentReview key={document.id} {...{ document, requestId, adminId, busy, runAction }} />)}</ul>
      : <p className="empty-inline">No supporting documents were provided.</p>}
  </section>;
}
