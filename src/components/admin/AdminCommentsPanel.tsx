import { useState } from 'react';
import type { FormEvent } from 'react';
import { adminApi } from '../../services/adminApi';
import type { RequestComment, RunAction } from '../../types/moveRequest';
import { CommentList } from '../shared/CommentList';

export function AdminCommentsPanel({ comments, requestId, adminId, busy, runAction }: { comments: RequestComment[]; requestId: string; adminId: string; busy: boolean; runAction: RunAction }) {
  const [comment, setComment] = useState('');
  async function add(event: FormEvent) {
    event.preventDefault(); if (!comment.trim()) return;
    if (await runAction(() => adminApi.comment(requestId, adminId, comment.trim()), 'Comment added.')) setComment('');
  }
  return <section className="panel" aria-labelledby="admin-comments-heading"><h2 id="admin-comments-heading">Comments</h2><CommentList comments={comments} />
    <form onSubmit={(event) => { void add(event); }}><fieldset disabled={busy}><label htmlFor="admin-comment">Add a comment for the resident</label>
      <textarea id="admin-comment" rows={3} maxLength={8000} required value={comment} onChange={(event) => setComment(event.target.value)} />
      <button className="secondary" type="submit" disabled={!comment.trim()} style={{ marginTop: 12 }}>Add comment</button>
    </fieldset></form>
  </section>;
}
