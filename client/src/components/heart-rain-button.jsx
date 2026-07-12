/* Heart rain button — fixed FAB that triggers heart physics */
import { motion } from 'motion/react';
import { IconHeart } from './icons';
import './heart-rain-button.css';

/**
 * Dispatches a custom 'heart-rain' event on the window
 * to trigger heart creation in HeartPhysicsCanvas.
 */
function triggerHeartRain() {
  window.dispatchEvent(new CustomEvent('heart-rain'));
}

/**
 * Vacuum effect — sucks hearts upwards
 */
function toggleVacuum(active) {
  window.dispatchEvent(new CustomEvent('heart-vacuum', { detail: active }));
}

export default function HeartRainButton() {
  return (
    <motion.button
      className="heart-rain-btn"
      onClick={triggerHeartRain}
      onMouseEnter={() => toggleVacuum(true)}
      onMouseLeave={() => toggleVacuum(false)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title="Rain hearts!"
      aria-label="Rain hearts"
    >
      {/* Pulse ring */}
      <span className="heart-rain-btn__pulse" />
      <IconHeart size={22} color="#fff" filled />
    </motion.button>
  );
}
