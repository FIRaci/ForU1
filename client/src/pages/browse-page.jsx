/* Browse page — filtered grid of memes by type, grouped by date */
import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMemes } from '../services/api-service';
import MemeCard from '../components/meme-card';
import DateSeparator from '../components/date-separator';
import MediaViewerModal from '../components/media-viewer-modal';
import { IconChevronRight } from '../components/icons';
import './browse-page.css';

/* Labels for each media type */
const TYPE_LABELS = {
  image: 'Images',
  gif: 'GIFs',
  video: 'Videos',
};

/**
 * Groups memes by their date (YYYY-MM-DD) for date separator rendering.
 */
function groupByDate(memes) {
  const groups = [];
  let lastDate = null;

  for (const meme of memes) {
    const date = new Date(meme.created_at).toISOString().split('T')[0];
    if (date !== lastDate) {
      groups.push({ date, memes: [meme] });
      lastDate = date;
    } else {
      groups[groups.length - 1].memes.push(meme);
    }
  }

  return groups;
}

export default function BrowsePage() {
  const { type } = useParams();
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeme, setSelectedMeme] = useState(null);

  const label = TYPE_LABELS[type] || 'All';

  useEffect(() => {
    setLoading(true);
    getMemes(type)
      .then((data) => setMemes(data))
      .catch((err) => console.error('Failed to fetch memes:', err))
      .finally(() => setLoading(false));
  }, [type]);

  const groups = useMemo(() => groupByDate(memes), [memes]);

  return (
    <div className="browse container">
      {/* Breadcrumb */}
      <nav className="browse__breadcrumb" aria-label="Breadcrumb">
        <Link to="/" className="browse__breadcrumb-link">Home</Link>
        <IconChevronRight size={14} color="var(--color-text-muted)" />
        <span className="browse__breadcrumb-current">{label}</span>
      </nav>

      {/* Page heading */}
      <h1 className="browse__heading">{label}</h1>

      {/* Content */}
      {loading ? (
        <div className="browse__skeleton-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="browse__skeleton-card" />
          ))}
        </div>
      ) : memes.length === 0 ? (
        <div className="browse__empty">
          <p className="browse__empty-text">
            No {label.toLowerCase()} uploaded yet.
          </p>
          <p className="browse__empty-hint">
            Check back soon — good things are coming!
          </p>
        </div>
      ) : (
        <div className="browse__content">
          {groups.map((group) => (
            <div key={group.date} className="browse__date-group">
              <DateSeparator date={group.date} />
              <div className="browse__grid">
                {group.memes.map((meme) => (
                  <MemeCard
                    key={meme.id}
                    meme={meme}
                    onClick={() => setSelectedMeme(meme)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media Viewer Modal */}
      <MediaViewerModal
        meme={selectedMeme}
        isOpen={!!selectedMeme}
        onClose={() => setSelectedMeme(null)}
      />
    </div>
  );
}
