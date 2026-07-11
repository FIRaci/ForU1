import { useEffect, useCallback } from 'react';

/**
 * Custom hook for keyboard shortcuts.
 * Skips when user is typing in input/textarea.
 * @param {string} key - Key to listen for (e.g. 't', 'Escape')
 * @param {Function} callback - Fires on key press
 * @param {{ alt, ctrl, shift }} modifiers - Required modifier keys
 */
export function useKeyboardShortcut(key, callback, { alt = false, ctrl = false, shift = false } = {}) {
  const handler = useCallback(
    (e) => {
      /* Skip if user is typing in an input field */
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;

      /* Check modifier keys */
      if (alt && !e.altKey) return;
      if (ctrl && !e.ctrlKey) return;
      if (shift && !e.shiftKey) return;

      /* Match the key (case-insensitive) */
      if (e.key.toLowerCase() !== key.toLowerCase()) return;

      e.preventDefault();
      callback(e);
    },
    [key, callback, alt, ctrl, shift]
  );

  useEffect(() => {
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler]);
}
