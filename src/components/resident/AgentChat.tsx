import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { agentApi, AssistantUnavailableError, assistantUnavailableMessage } from '../../services/agentApi';
import { apiErrors } from '../../services/http';
import { useResource } from '../../hooks/useResource';
import type { ChatResponse, Conversation, FieldError, RunAction } from '../../types/moveRequest';
import { dateLabel, ErrorNotice, label } from '../common';

export function AgentChat({ requestId, residentId, busy, dirty, runAction, requestRevision }: {
  requestId: string; residentId: string; busy: boolean; dirty: boolean; runAction: RunAction; requestRevision: string;
}) {
  const loadLatest = useCallback(async () => {
    const first = await agentApi.history(requestId, residentId);
    return first.pagination.totalPages > 1 ? agentApi.history(requestId, residentId, first.pagination.totalPages) : first;
  }, [requestId, residentId]);
  const history = useResource(loadLatest);
  const health = useResource(useCallback(() => agentApi.health(), []));
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [older, setOlder] = useState<Conversation[]>([]);
  const [oldestPage, setOldestPage] = useState<number | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [olderErrors, setOlderErrors] = useState<FieldError[]>([]);
  const [sentPair, setSentPair] = useState<Conversation[]>([]);
  const [response, setResponse] = useState<ChatResponse | null>(null);
  // Reply validation describes a snapshot. Current requirements live in the
  // progress panel; do not keep resolved chat warnings after subsequent edits.
  useEffect(() => { setResponse((current) => current ? { ...current, validationErrors: [] } : null); }, [requestRevision]);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => { if (sending || sentPair.length) bottom.current?.scrollIntoView({ block: 'nearest' }); }, [sending, sentPair]);
  async function more() {
    const page = (oldestPage ?? history.data?.pagination.page ?? 1) - 1;
    if (page < 1 || loadingOlder) return;
    setLoadingOlder(true); setOlderErrors([]);
    try {
      const result = await agentApi.history(requestId, residentId, page);
      setOlder((current) => [...result.data, ...current]); setOldestPage(page);
    } catch (error) { setOlderErrors(apiErrors(error)); }
    finally { setLoadingOlder(false); }
  }
  async function refreshHistory() {
    const ok = await history.refresh();
    if (ok) { setOlder([]); setOldestPage(null); setSentPair([]); }
  }
  async function send(event: FormEvent) {
    event.preventDefault();
    if (!message.trim() || sending || busy || dirty) return;
    setSending(true); setResponse(null); setUnavailable(false);
    const submittedMessage = message.trim();
    const ok = await runAction(async () => {
      let result: ChatResponse;
      try { result = await agentApi.chat(requestId, residentId, submittedMessage); }
      catch (error) { if (error instanceof AssistantUnavailableError) setUnavailable(true); throw error; }
      setResponse(result); setMessage('');
      const createdAt = new Date().toISOString();
      setSentPair([
        { id: `sent-${result.conversationId}`, role: 'USER', message: submittedMessage, createdAt },
        { id: result.conversationId, role: 'AGENT', message: result.message, createdAt },
      ]);
    }, 'Conversation saved. Request progress refreshed.');
    // Reconcile a response lost in transit as well as a successful interaction.
    if (ok) await refreshHistory();
    else await history.refresh();
    setSending(false);
  }
  const persisted = [...older, ...(history.data?.data ?? [])];
  // Replace the temporary pair once both persisted messages have been loaded.
  const allMessages = sentPair.length && !persisted.some((item) => item.id === sentPair[1].id) ? [...persisted, ...sentPair] : persisted;
  const messages = [...new Map(allMessages.map((item) => [item.id, item])).values()];
  return <section className="panel chat-panel" aria-labelledby="chat-heading"><div className="chat-heading"><p className="eyebrow">A little help along the way</p><h2 id="chat-heading">Move assistant</h2>
    <p className="muted small">Tell me about your move. I can help fill in details and explain your community’s requirements.</p></div>
    {(unavailable || health.data?.agentConfigured === false || health.errors.length > 0) && <div className="notice error assistant-fallback" role="alert"><p>{assistantUnavailableMessage}</p>
      {unavailable && <p className="small">Your message stays in the composer so you can retry. Check the conversation before sending it again.</p>}
      <a href="#details-heading">Continue with request details</a>
      {health.data?.agentConfigured === false && <div><button className="text-button" disabled={health.loading} onClick={() => { void health.refresh(); }}>Check again</button></div>}</div>}
    <ErrorNotice errors={history.errors} retry={() => { void refreshHistory(); }} />
    <ErrorNotice errors={olderErrors} />
    {history.loading && !history.data && <p role="status">Loading conversation…</p>}
    <div className="chat-messages" aria-label="Conversation messages" aria-live="polite">
      {(oldestPage ?? history.data?.pagination.page ?? 1) > 1 && <button className="text-button" disabled={loadingOlder || sending} onClick={() => { void more(); }}>{loadingOlder ? 'Loading…' : 'Load earlier messages'}</button>}
      {!history.loading && !messages.length && <div className="chat-empty"><span className="assistant-symbol" aria-hidden="true">✦</span><h3>Let’s plan your move.</h3>
        <p>Start by telling the assistant when you’re planning to move.</p><p className="muted small">For example: “I’m moving next Saturday morning.”</p></div>}
      {messages.map((item) => <article className={`chat-message message-${item.role.toLowerCase()}`} key={item.id}>
        <span className="message-author">{item.role === 'USER' ? 'You' : item.role === 'AGENT' ? 'Move assistant' : 'Community admin'}</span>
        <p className="preserve-lines">{item.message}</p><time dateTime={item.createdAt}>{dateLabel(item.createdAt, true)}</time>
      </article>)}
      {sending && <p role="status" className="muted small">Assistant is checking your request…</p>}<div ref={bottom} />
    </div>
    {response?.appliedFields && Object.keys(response.appliedFields).length > 0 && <p className="small done">Updated: {Object.keys(response.appliedFields).map(label).join(', ')}.</p>}
    {response && response.validationErrors.length > 0 && <ErrorNotice errors={response.validationErrors} />}
    <form className="chat-composer" onSubmit={(event) => { void send(event); }}><label htmlFor="chat-message">Your message</label>
      <textarea id="chat-message" rows={3} maxLength={8000} value={message} placeholder="Tell the assistant about your move…"
        disabled={busy || sending || health.data?.agentConfigured === false} onChange={(event) => setMessage(event.target.value)} />
      <div className="row spread"><span className="muted small">{dirty ? 'Save or discard your detail edits before chatting.' : 'Review any suggested changes before submitting.'}</span>
        <button type="submit" disabled={!message.trim() || busy || sending || dirty || history.loading || health.data?.agentConfigured === false}>{sending ? 'Sending…' : 'Send message'}</button></div>
    </form>
  </section>;
}
