import { useState, useCallback } from 'react';

const SESSION_KEY = 'foru_admin_key';

/**
 * Admin authentication hook.
 * Stores admin key in sessionStorage for session duration.
 * Provides prompt flow + validation state.
 */
export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(() => !!sessionStorage.getItem(SESSION_KEY));

  const adminKey = sessionStorage.getItem(SESSION_KEY);

  /** Prompt user for admin key, store in session */
  const promptAdminKey = useCallback(() => {
    const key = window.prompt('Enter admin key to upload memes:');
    if (key && key.trim()) {
      sessionStorage.setItem(SESSION_KEY, key.trim());
      setIsAdmin(true);
      return true;
    }
    return false;
  }, []);

  /** Clear admin session */
  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAdmin(false);
  }, []);

  return { isAdmin, adminKey, promptAdminKey, logout };
}
