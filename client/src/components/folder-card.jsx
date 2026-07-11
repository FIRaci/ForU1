/* Folder card — navigable card for each meme type */
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { IconFolder, IconCamera, IconFilm, IconVideo } from './icons';
import './folder-card.css';

/* Map type to icon and label */
const TYPE_CONFIG = {
  image: { label: 'Images', Icon: IconCamera, color: '#E11D48' },
  gif:   { label: 'GIFs',   Icon: IconFilm,   color: '#F43F5E' },
  video: { label: 'Videos', Icon: IconVideo,   color: '#FB7185' },
};

export default function FolderCard({ type, count = 0 }) {
  const navigate = useNavigate();
  const { label, Icon, color } = TYPE_CONFIG[type] || TYPE_CONFIG.image;

  return (
    <motion.button
      className="folder-card"
      onClick={() => navigate(`/browse/${type}`)}
      whileHover={{ y: -8, rotate: 1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Folder icon shape */}
      <div className="folder-card__icon-wrapper">
        <IconFolder size={64} color="var(--color-folder-yellow-dark)" />
        <div className="folder-card__inner-icon">
          <Icon size={24} color={color} />
        </div>
      </div>

      {/* Label */}
      <h3 className="folder-card__label">{label}</h3>

      {/* Count badge */}
      <span className="folder-card__count">
        {count} {count === 1 ? 'file' : 'files'}
      </span>
    </motion.button>
  );
}
