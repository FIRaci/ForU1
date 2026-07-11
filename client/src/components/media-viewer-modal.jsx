/* Media viewer modal — full-screen media view with reactions */
import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IconX } from './icons';
import MediaPreview from './media-preview';
import ReactionButtons from './reaction-buttons';
import CommentSection from './comment-section';
import './media-viewer-modal.css';

export default function MediaViewerModal({ meme, isOpen, onClose }) {
  /* Close on ESC */
  const handleKey = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKey]);

  return (
    <AnimatePresence>
      {isOpen && meme && (
        <motion.div
          className="viewer-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop — click to close */}
          <div className="viewer-modal__backdrop" onClick={onClose} />

          {/* Content card */}
          <motion.div
            className="viewer-modal__content"
            initial={{ scale: 0.92, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Close button */}
            <button className="viewer-modal__close" onClick={onClose} aria-label="Close">
              <IconX size={20} />
            </button>

            {/* Media */}
            <div className="viewer-modal__media">
              <MediaPreview
                src={meme.file_url}
                mediaType={meme.media_type}
                alt={meme.title}
                mode="full"
              />
            </div>

            {/* Info section */}
            <div className="viewer-modal__info">
              <h2 className="viewer-modal__title">{meme.title}</h2>
              <p className="viewer-modal__date">
                {new Date(meme.created_at).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })}
              </p>
              <ReactionButtons
                memeId={meme.id}
                initialLikes={meme.like_count || 0}
                initialDislikes={meme.dislike_count || 0}
              />
              <CommentSection description={meme.description} createdAt={meme.created_at} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
