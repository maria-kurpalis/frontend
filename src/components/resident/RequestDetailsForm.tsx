import { useState } from 'react';
import type { FormEvent } from 'react';
import type { FieldError, MoveRequest, RunAction, UpdateMoveRequest, WorkflowConfig } from '../../types/moveRequest';
import { moveRequestApi } from '../../services/moveRequestApi';
import { FieldErrors, label } from '../common';

const fields = ['requestedDate', 'requestedTimeSlot', 'vehicleCount', 'vehicleDetails', 'occupantCount', 'notes'] as const;
type FormValues = Record<typeof fields[number], string>;
function initialValues(request: MoveRequest): FormValues {
  return {
    requestedDate: request.requestedDate ?? '', requestedTimeSlot: request.requestedTimeSlot ?? '',
    vehicleCount: request.details?.vehicleCount?.toString() ?? '',
    occupantCount: request.details?.occupantCount?.toString() ?? '', notes: request.details?.notes ?? '',
    vehicleDetails: request.details?.vehicleDetails == null ? '' : JSON.stringify(request.details.vehicleDetails, null, 2),
  };
}
export function RequestDetailsForm({ request, config, busy, errors, runAction, onDirty }: {
  request: MoveRequest; config: WorkflowConfig | null; busy: boolean; errors: FieldError[];
  runAction: RunAction; onDirty: (dirty: boolean) => void;
}) {
  const [values, setValues] = useState(() => initialValues(request));
  const [localErrors, setLocalErrors] = useState<FieldError[]>([]);
  const allErrors = [...localErrors, ...errors];
  const slots = config?.allowedTimeSlots.map(({ start, end }) => `${start}-${end}`) ?? [];
  function change(field: keyof FormValues, value: string) {
    const next = { ...values, [field]: value };
    setValues(next); setLocalErrors([]);
    const original = initialValues(request);
    onDirty(fields.some((key) => next[key] !== original[key]));
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    const input: UpdateMoveRequest = {};
    const failures: FieldError[] = [];
    for (const field of fields) {
      const value = values[field].trim();
      if (field === 'vehicleDetails') {
        if (!value) input.vehicleDetails = null;
        else {
          try {
            const parsed: unknown = JSON.parse(value);
            if (parsed === null || typeof parsed !== 'object') throw new Error('invalid');
            input.vehicleDetails = parsed as NonNullable<UpdateMoveRequest['vehicleDetails']>;
          } catch { failures.push({ field, message: 'Enter vehicle details as a valid JSON object or array.' }); }
        }
      } else if (field === 'vehicleCount' || field === 'occupantCount') {
        if (!value) input[field] = null;
        else if (!/^\d+$/.test(value) || Number(value) > 2147483647) failures.push({ field, message: `${label(field)} must be a non-negative whole number.` });
        else input[field] = Number(value);
      } else input[field] = value || null;
    }
    setLocalErrors(failures);
    if (failures.length) return;
    if (await runAction(() => moveRequestApi.update(request.id, input), 'Request details saved.')) onDirty(false);
  }
  return <section className="panel" aria-labelledby="details-heading"><h2 id="details-heading">Edit details</h2>
    <p className="muted small">Required fields are marked *. Save your details before chatting or submitting.</p>
    <form onSubmit={(event) => { void save(event); }}><fieldset disabled={busy} className="form-grid">
      {fields.map((field) => {
        const invalid = allErrors.some((error) => error.field === field);
        const props = { id: field, value: values[field], 'aria-invalid': invalid, 'aria-describedby': `error-${field}` };
        return <div className={field === 'vehicleDetails' || field === 'notes' ? 'full-width' : ''} key={field}>
          <label htmlFor={field}>{label(field)}{config?.requiredFields.includes(field) ? ' *' : ''}</label>
          {field === 'vehicleDetails' || field === 'notes' ? <textarea {...props} rows={field === 'vehicleDetails' ? 3 : 2}
            placeholder={field === 'vehicleDetails' ? '[{"registration": "KA01AB1234", "type": "Van"}]' : 'Anything the community should know?'}
            onChange={(event) => change(field, event.target.value)} />
            : field === 'requestedTimeSlot' && config ? <select {...props} onChange={(event) => change(field, event.target.value)}>
              <option value="">Choose a time slot</option>{values[field] && !slots.includes(values[field]) && <option value={values[field]}>{values[field]} (no longer allowed)</option>}
              {slots.map((slot) => <option value={slot} key={slot}>{slot}</option>)}
            </select>
              : <input {...props} type={field === 'requestedDate' ? 'date' : field.endsWith('Count') ? 'number' : 'text'}
                min={field.endsWith('Count') ? 0 : undefined} max={field.endsWith('Count') ? 2147483647 : undefined}
                step={field.endsWith('Count') ? 1 : undefined}
                placeholder={field === 'requestedTimeSlot' ? '09:00-12:00' : undefined} onChange={(event) => change(field, event.target.value)} />}
          {field === 'vehicleDetails' && <p className="muted small">Optional structured vehicle information (JSON).</p>}
          <FieldErrors field={field} errors={allErrors} />
        </div>;
      })}
      <div className="full-width row actions"><button type="submit">Save details</button><button className="text-button" type="button" onClick={() => { setValues(initialValues(request)); onDirty(false); setLocalErrors([]); }}>Discard edits</button></div>
    </fieldset></form>
  </section>;
}
