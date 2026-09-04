import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useResource } from '../../hooks/useResource';
import { adminApi } from '../../services/adminApi';
import { apiErrors } from '../../services/http';
import type { FieldError, RequestType, WorkflowConfig } from '../../types/moveRequest';
import { ErrorNotice, label } from '../common';

const fields = ['requestedDate', 'requestedTimeSlot', 'vehicleCount', 'vehicleDetails', 'occupantCount', 'notes'];
const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const empty: WorkflowConfig = { requiredFields: [], requiredDocuments: [], allowedDays: [], allowedTimeSlots: [], instructions: '' };

function ConfigForm({ config, type, communityId, adminId, saved }: {
  config: WorkflowConfig | null; type: RequestType; communityId: string; adminId: string; saved: () => Promise<boolean>;
}) {
  const [values, setValues] = useState<WorkflowConfig>(config ?? empty);
  const [documents, setDocuments] = useState(config?.requiredDocuments.join('\n') ?? '');
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function change(next: WorkflowConfig) { setValues(next); setDirty(true); }
  function toggle(field: 'requiredFields' | 'allowedDays', value: string) {
    change({ ...values, [field]: values[field].includes(value) ? values[field].filter((item) => item !== value) : [...values[field], value] });
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    const requiredDocuments = [...new Set(documents.split('\n').map((value) => value.trim()).filter(Boolean))];
    const failures: FieldError[] = [];
    if (requiredDocuments.some((value) => [...value].length > 100)) failures.push({ field: 'requiredDocuments', message: 'Each document type must be at most 100 characters.' });
    if (values.allowedTimeSlots.some(({ start, end }) => !/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || start >= end))
      failures.push({ field: 'allowedTimeSlots', message: 'Each time slot needs a start and end, with the start before the end.' });
    setErrors(failures);
    if (failures.length) return;
    lock.current = true; setSaving(true);
    try {
      await adminApi.saveWorkflowConfig(communityId, adminId, type, { ...values, requiredDocuments });
      setDirty(false); await saved();
    } catch (error) { setErrors(apiErrors(error)); }
    finally { lock.current = false; setSaving(false); }
  }
  return <form onSubmit={(event) => { void save(event); }}>
    {!config && <p className="notice warning">Not configured yet. Saving creates this move type’s configuration.</p>}
    <ErrorNotice errors={errors} />
    <fieldset disabled={saving} className="config-fields">
      <fieldset><legend>Required fields</legend><div className="config-checks">{fields.map((field) => <label key={field}>
        <input type="checkbox" checked={values.requiredFields.includes(field)} onChange={() => toggle('requiredFields', field)} />{label(field)}</label>)}</div></fieldset>
      <div><label htmlFor={`documents-${type}`}>Required document types (one per line)</label>
        <textarea id={`documents-${type}`} rows={4} value={documents} onChange={(event) => { setDocuments(event.target.value); setDirty(true); }} />
        <p className="muted small">Use your community’s document identifiers. Keep existing identifiers when they already have uploaded documents.</p></div>
      <fieldset><legend>Allowed days</legend><div className="config-checks">{days.map((day) => <label key={day}>
        <input type="checkbox" checked={values.allowedDays.includes(day)} onChange={() => toggle('allowedDays', day)} />{label(day)}</label>)}</div></fieldset>
      <fieldset><legend>Allowed time slots</legend>{values.allowedTimeSlots.map((slot, index) => <div className="config-slot" key={index}>
        {(['start', 'end'] as const).map((key) => <label key={key}>{label(key)} {index + 1}<input type="time" required value={slot[key]} onChange={(event) => change({ ...values,
          allowedTimeSlots: values.allowedTimeSlots.map((item, i) => i === index ? { ...item, [key]: event.target.value } : item) })} /></label>)}
        <button type="button" className="text-button" aria-label={`Remove time slot ${index + 1}`} onClick={() => change({ ...values, allowedTimeSlots: values.allowedTimeSlots.filter((_, i) => i !== index) })}>Remove</button>
      </div>)}<button type="button" className="secondary" onClick={() => change({ ...values, allowedTimeSlots: [...values.allowedTimeSlots, { start: '', end: '' }] })}>Add time slot</button></fieldset>
      <div><label htmlFor={`instructions-${type}`}>Instructions</label><textarea id={`instructions-${type}`} rows={4} value={values.instructions} onChange={(event) => change({ ...values, instructions: event.target.value })} /></div>
      <div className="row"><button type="submit">{saving ? 'Saving…' : 'Save configuration'}</button>{dirty && <span className="muted small">Unsaved changes</span>}</div>
    </fieldset>
  </form>;
}

function ConfigPanel({ type, adminId, communityId }: { type: RequestType; adminId: string; communityId: string }) {
  const resource = useResource(useCallback(async () => ({ config: await adminApi.workflowConfig(communityId, type) }), [communityId, type]));
  const [notice, setNotice] = useState('');
  return <section className="panel" aria-label={`${label(type)} configuration`}><h2>{label(type)} configuration</h2>
    <ErrorNotice errors={resource.errors} retry={() => { void resource.refresh(); }} />
    {notice && <p className="notice success" role="status">{notice}</p>}
    {resource.loading ? <p role="status">Loading configuration…</p> : !resource.errors.length && resource.data && <ConfigForm key={JSON.stringify(resource.data.config)} config={resource.data.config} {...{ type, adminId, communityId }} saved={async () => {
      const ok = await resource.refresh(); setNotice(ok ? 'Configuration saved. New validations use these requirements.' : ''); return ok;
    }} />}
  </section>;
}

export function WorkflowConfigPage({ adminId, communityId }: { adminId: string; communityId: string }) {
  return <><Link className="back-link" to={`/admin/${adminId}/community/${communityId}`}>← Back to admin dashboard</Link>
    <div className="page-heading"><p className="eyebrow">Community settings</p><h1>Workflow configuration</h1>
      <p className="muted">Set requirements for each move type. Changes apply when requests are next validated; existing statuses stay unchanged.</p></div>
    <div className="config-grid">{(['MOVE_IN', 'MOVE_OUT'] as const).map((type) => <ConfigPanel key={`${communityId}-${type}`} {...{ type, adminId, communityId }} />)}</div>
  </>;
}
