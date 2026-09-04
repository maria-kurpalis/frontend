import { useState } from 'react';
import type { FormEvent } from 'react';
import { moveRequestApi } from '../../services/moveRequestApi';
import type { FieldError, RequestDocument, RunAction } from '../../types/moveRequest';
import { dateLabel, FieldErrors, label, StatusBadge } from '../common';
import { DocumentLink } from '../shared/DocumentLink';

function DocumentRow({ document, requestId, canEdit, busy, runAction }: { document: RequestDocument; requestId: string; canEdit: boolean; busy: boolean; runAction: RunAction }) {
  const [replacing, setReplacing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [url, setUrl] = useState(document.fileUrl);
  async function replace(event: FormEvent) {
    event.preventDefault();
    if (await runAction(() => moveRequestApi.replaceDocument(requestId, document.id, url.trim()), 'Document replaced. It is pending verification.')) setReplacing(false);
  }
  return <li className="document-row"><div className="row spread"><strong>{label(document.documentType)}</strong><StatusBadge status={document.status} text={document.status === 'PENDING' ? 'Uploaded' : undefined} /></div>
    <p className="muted small">Added {dateLabel(document.uploadedAt, true)}</p>
    <div className="row actions"><DocumentLink url={document.fileUrl} />
      {canEdit && <><button className="text-button" disabled={busy} onClick={() => { setReplacing(!replacing); setDeleting(false); setUrl(document.fileUrl); }}>{replacing ? 'Cancel replacement' : 'Replace'}</button>
        <button className="text-button danger-text" disabled={busy} onClick={() => { setDeleting(!deleting); setReplacing(false); }}>{deleting ? 'Keep document' : 'Delete'}</button></>}
    </div>
    {replacing && canEdit && <form onSubmit={(event) => { void replace(event); }}><label htmlFor={`replace-${document.id}`}>New file URL</label>
      <input id={`replace-${document.id}`} type="url" pattern="https?://.+" required value={url} disabled={busy} onChange={(event) => setUrl(event.target.value)} />
      <button className="secondary" type="submit" disabled={busy}>Save replacement</button></form>}
    {deleting && canEdit && <div className="notice warning"><p>Remove this document from the request?</p><button disabled={busy} className="danger" onClick={() => { void runAction(() => moveRequestApi.deleteDocument(requestId, document.id), 'Document deleted.'); }}>Confirm delete</button></div>}
  </li>;
}
export function DocumentSection({ requestId, documents, requiredDocuments, canEdit, busy, errors, runAction }: {
  requestId: string; documents: RequestDocument[]; requiredDocuments: string[]; canEdit: boolean; busy: boolean; errors: FieldError[]; runAction: RunAction;
}) {
  const [documentType, setDocumentType] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  async function add(event: FormEvent) {
    event.preventDefault();
    if (await runAction(() => moveRequestApi.addDocument(requestId, documentType.trim(), fileUrl.trim()), 'Document added. It is pending verification.')) { setFileUrl(''); setDocumentType(''); }
  }
  const hasRequiredDocuments = requiredDocuments.length > 0;
  return <section className="panel" aria-labelledby="documents-heading"><h2 id="documents-heading">{hasRequiredDocuments ? 'Documents' : 'Supporting Documents (Optional)'}</h2>
    <p className="muted small">{hasRequiredDocuments ? 'Add a link to each required or supporting document. Your community will verify it during review.' : 'You may attach supporting documents if relevant.'}</p>
    {requiredDocuments.length > 0 && <div className="document-requirements" aria-label="Required documents"><h3>Required documents</h3>{[...new Set(requiredDocuments)].map((type) => {
      const matches = documents.filter((document) => document.documentType === type && document.fileUrl.trim());
      const document = matches.find((item) => item.status === 'VERIFIED') ?? matches.find((item) => item.status === 'PENDING') ?? matches[0];
      const status = document?.status ?? 'MISSING';
      return <div key={type}><div className="row spread"><span className="small">{label(type)}</span>
        <StatusBadge status={status} text={status === 'PENDING' ? 'Uploaded' : undefined} /></div>
        {document && <div className="required-document-link"><DocumentLink url={document.fileUrl} showUrl /></div>}
        <FieldErrors field={`documents.${type}`} errors={errors} /></div>;
    })}</div>}
    {documents.length ? <ul className="document-list">{documents.map((document) => <DocumentRow key={document.id} {...{ document, requestId, canEdit, busy, runAction }} />)}</ul>
      : <p className="empty-inline">No supporting documents added.</p>}
    {canEdit && <form onSubmit={(event) => { void add(event); }}><fieldset disabled={busy}><h3>Add a supporting document</h3>
      <label htmlFor="document-type">Document type</label><input id="document-type" list="document-types" maxLength={100} required value={documentType} onChange={(event) => setDocumentType(event.target.value)} placeholder="Choose or enter a document type" />
      <datalist id="document-types">{requiredDocuments.map((type) => <option key={type} value={type}>{label(type)}</option>)}</datalist>
      <FieldErrors field="documentType" errors={errors} /><label htmlFor="file-url">File URL</label>
      <input id="file-url" type="url" pattern="https?://.+" required value={fileUrl} onChange={(event) => setFileUrl(event.target.value)} placeholder="https://example.com/document.pdf" />
      <FieldErrors field="fileUrl" errors={errors} /><button type="submit" className="secondary">Add document</button>
    </fieldset></form>}
  </section>;
}
