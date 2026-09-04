import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { loginByEmail, loginErrorMessage } from '../../services/demoLoginApi';
import type { DemoLoginResponse } from '../../types/demoLogin';

// Actual deterministic accounts in Backend/src/seeders/fixtures/local-workflow.ts.
const demoEmails = [
  'ananya.rao@green-heights.example.test', 'rohan.mehta@green-heights.example.test',
  'kavya.nair@marina-residence.example.test', 'arjun.iyer@marina-residence.example.test',
  'meera.desai@green-heights.example.test', 'vikram.shah@marina-residence.example.test',
];
export function DemoLoginPage({ onLogin }: { onLogin: (user: DemoLoginResponse) => void }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    const normalized = email.trim();
    if (!normalized) { setError('Enter your email address.'); input.current?.focus(); return; }
    if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setError('Enter a valid email address.'); input.current?.focus(); return;
    }
    pending.current = true; setBusy(true); setError('');
    try { onLogin(await loginByEmail(normalized)); }
    catch (failure) { setError(loginErrorMessage(failure)); }
    finally { pending.current = false; setBusy(false); }
  }
  return <section className="panel entry login-entry"><p className="eyebrow">Move-In / Move-Out Management</p>
    <h1>Welcome to ANACITY</h1><p>Enter your registered email address.</p>
    <form onSubmit={(event) => { void submit(event); }} noValidate aria-busy={busy}>
      <label htmlFor="login-email">Email address</label>
      <input ref={input} id="login-email" type="email" autoComplete="email" required maxLength={254} value={email}
        disabled={busy} onChange={(event) => { setEmail(event.target.value); setError(''); }}
        aria-invalid={!!error} aria-describedby={error ? 'login-error' : undefined} />
      {error && <p className="field-error" id="login-error" role="alert">{error}</p>}
      <button type="submit" disabled={busy}>{busy ? 'Signing in...' : 'Continue'}</button>
    </form>
    <p className="muted small">Demo email lookup only. This prototype does not verify email ownership.</p>
    <div className="demo-identities"><h2>Demo accounts</h2><p className="muted small">Choose an email to fill the form. Your workspace is determined automatically.</p>
      <ul className="activity-list">{demoEmails.map((address) => <li key={address}><button type="button" className="text-button demo-email" disabled={busy}
        onClick={() => { setEmail(address); setError(''); input.current?.focus(); }}>{address}</button></li>)}</ul>
    </div>
  </section>;
}
