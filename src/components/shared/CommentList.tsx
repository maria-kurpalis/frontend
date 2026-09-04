import type { RequestComment } from '../../types/moveRequest';
import { dateLabel, label } from '../common';

export function CommentList({ comments }: { comments: RequestComment[] }) {
  return comments.length ? <ul className="activity-list">{comments.map((comment) => <li key={comment.id}>
    <div className="row spread"><strong>{label(comment.authorType)}</strong><time className="muted small" dateTime={comment.createdAt}>{dateLabel(comment.createdAt, true)}</time></div>
    <p className="preserve-lines">{comment.comment}</p>
  </li>)}</ul> : <p className="muted small">No comments yet.</p>;
}
