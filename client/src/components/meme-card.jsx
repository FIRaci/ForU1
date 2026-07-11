/* Meme card — thumbnail grid item with overlay */
import { motion } from 'motion/react';
import { IconHeart, IconFilm, IconVideo } from './icons';
import MediaPreview from './media-preview';
import './meme-card.css';

/**
 * Badge component for GIF/Video indicators
 */
function TypeBadge({ mediaType }) {
  if (mediaType === 'gif') {
    return (
      <span className="meme-card__type-badge">
        <IconFilm size={12} color="currentColor" /> GIF
      </span>
    );
  }
  if (mediaType === 'video') {
    return (
      <span className="meme-card__type-badge">
        <IconVideo size={12} color="currentColor" /> VID
      </span>
    );
  }
  return null;
}

export default function MemeCard({ meme, onClick }) {
  const { title, thumbnail_url, file_url, media_type, like_count = 0 } = meme;

  return (
    <motion.article
      className="meme-card"
      onClick={() => onClick?.(meme)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ scale: 1.02 }}
      layout
    >
      {/* Thumbnail */}
      <div className="meme-card__media">
        <MediaPreview src={thumbnail_url || file_url} mediaType={media_type} alt={title} mode="thumbnail" />
      </div>

      {/* Like count badge — top right */}
      {like_count > 0 && (
        <span className="meme-card__likes">
          <IconHeart size={12} color="var(--color-like)" filled />
          {like_count}
        </span>
      )}

      {/* Type indicator — top left */}
      <TypeBadge mediaType={media_type} />

      {/* Title overlay — bottom */}
      <div className="meme-card__overlay">
        <h3 className="meme-card__title">{title}</h3>
      </div>
    </motion.article>
  );
}
