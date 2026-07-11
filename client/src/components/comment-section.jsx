/* Comment section — curator's note for a meme */
import './comment-section.css';

/**
 * Displays the admin's description as a styled "curator note" card.
 * Hidden entirely when there's no description.
 */
export default function CommentSection({ description, createdAt }) {
  if (!description) return null;

  const timeAgo = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="comment-section">
      <div className="comment-section__header">
        <span className="comment-section__badge">Note from the curator</span>
        <span className="comment-section__time">{timeAgo}</span>
      </div>
      <p className="comment-section__text">{description}</p>
    </div>
  );
}
