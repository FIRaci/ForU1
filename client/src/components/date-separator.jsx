/* Date separator — decorative divider with relative date label */
import './date-separator.css';

/**
 * Formats a date string into human-readable relative label.
 * "Today", "Yesterday", or full date like "July 10, 2026"
 */
function formatDateLabel(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = (today - target) / (1000 * 60 * 60 * 24);

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DateSeparator({ date }) {
  return (
    <div className="date-separator">
      <span className="date-separator__line" />
      <span className="date-separator__label">{formatDateLabel(date)}</span>
      <span className="date-separator__line" />
    </div>
  );
}
