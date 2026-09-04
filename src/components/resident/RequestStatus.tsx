import { useState } from 'react';
import type { FormEvent } from 'react';
import type { RequestComment, StatusHistory, RunAction } from '../../types/moveRequest';
import { moveRequestApi } from '../../services/moveRequestApi';
import { CommentList } from '../shared/CommentList';
import { StatusHistoryList } from '../shared/StatusHistoryList';

export function RequestStatus({ history, comments, requestId, residentId, busy, runAction }: {
  history: StatusHistory[]; comments: RequestComment[]; requestId: string; residentId: string; busy: boolean; runAction: RunAction;
}) {
  const [comment, setComment] = useState('');
  async function add(event: FormEvent) {
    event.preventDefault();
    if (!comment.trim() || busy) return;
    if (await runAction(() => moveRequestApi.addComment(requestId, residentId, comment.trim()), 'Comment added.')) setComment('');
  }
  return <section className="panel" aria-labelledby="activity-heading"><h2 id="activity-heading">Updates & activity</h2>
    <h3>Comments</h3><CommentList comments={comments} />
    <form className="comment-composer" onSubmit={(event) => { void add(event); }}>
      <label htmlFor="resident-comment">Message to your community</label>
      <textarea id="resident-comment" rows={3} value={comment} disabled={busy} maxLength={10000} onChange={(event) => setComment(event.target.value)} placeholder="Share an update or ask a question…" />
      <button className="secondary" disabled={busy || !comment.trim()}>Add comment</button>
    </form>
    <h3>Status history</h3><StatusHistoryList history={history} />
  </section>;
}
