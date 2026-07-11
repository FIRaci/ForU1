import { useMemo } from 'react';

const STORAGE_KEY = 'foru_device_id';

/**
 * Generates a UUID v4-style identifier.
 * Uses crypto.randomUUID when available, otherwise manual fallback.
 */
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  /* Fallback for older browsers */
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * Returns a stable device ID persisted in localStorage.
 * Creates one on first visit.
 */
export function useDeviceId() {
  const deviceId = useMemo(() => {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = generateId();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  }, []);

  return deviceId;
}
