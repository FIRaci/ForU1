/* Reaction buttons — like & dislike with toggle behavior */
import { useState } from 'react';
import { motion } from 'motion/react';
import { IconHeart, IconThumbsDown } from './icons';
import { reactToMeme, getUserReaction } from '../services/api-service';
import './reaction-buttons.css';
import { useEffect } from 'react';

export default function ReactionButtons({ memeId, initialLikes = 0, initialDislikes = 0 }) {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [userReaction, setUserReaction] = useState(null); // 'like' | 'dislike' | null

  /* Fetch current user's reaction on mount */
  useEffect(() => {
    getUserReaction(memeId)
      .then((data) => {
        if (data?.reaction) setUserReaction(data.reaction);
      })
      .catch(() => {}); // Silent fail if no reaction
  }, [memeId]);

  const handleReact = async (isLike) => {
    const type = isLike ? 'like' : 'dislike';
    const wasActive = userReaction === type;

    let newLikes = likes;
    let newDislikes = dislikes;

    /* Optimistic update */
    if (wasActive) {
      setUserReaction(null);
      isLike ? (newLikes -= 1) : (newDislikes -= 1);
    } else {
      /* Remove previous reaction if switching */
      if (userReaction === 'like') newLikes -= 1;
      if (userReaction === 'dislike') newDislikes -= 1;
      setUserReaction(type);
      isLike ? (newLikes += 1) : (newDislikes += 1);
    }

    setLikes(newLikes);
    setDislikes(newDislikes);

    try {
      await reactToMeme(memeId, isLike);
      /* Dispatch event so other components (like home page list) can sync */
      window.dispatchEvent(new CustomEvent('meme-reacted', {
        detail: { memeId, likes: newLikes, dislikes: newDislikes, userReaction: wasActive ? null : type }
      }));
    } catch {
      /* Revert on failure */
      setLikes(initialLikes);
      setDislikes(initialDislikes);
      setUserReaction(null);
    }
  };

  return (
    <div className="reaction-buttons">
      {/* Like button */}
      <motion.button
        className={`reaction-btn reaction-btn--like ${userReaction === 'like' ? 'is-active' : ''}`}
        onClick={() => handleReact(true)}
        whileTap={{ scale: 1.3 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        aria-label="Like"
      >
        <IconHeart size={20} filled={userReaction === 'like'} color="var(--color-like)" />
        <span className="reaction-btn__count">{likes}</span>
      </motion.button>

      {/* Dislike button */}
      <motion.button
        className={`reaction-btn reaction-btn--dislike ${userReaction === 'dislike' ? 'is-active' : ''}`}
        onClick={() => handleReact(false)}
        whileTap={{ x: [0, -4, 4, -4, 4, 0] }}
        transition={{ duration: 0.4 }}
        aria-label="Dislike"
      >
        <IconThumbsDown size={20} filled={userReaction === 'dislike'} color="var(--color-dislike)" />
        <span className="reaction-btn__count">{dislikes}</span>
      </motion.button>
    </div>
  );
}
