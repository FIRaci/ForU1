/**
 * API Service — centralized fetch wrapper for the Foru backend.
 * Auto-attaches device ID and admin key headers.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '';

/** Build headers with optional auth */
function getHeaders() {
  const headers = {};
  const deviceId = localStorage.getItem('foru_device_id');
  if (deviceId) headers['X-Device-ID'] = deviceId;
  const adminKey = sessionStorage.getItem('foru_admin_key');
  if (adminKey) headers['X-Admin-Key'] = adminKey;
  return headers;
}

/** Generic fetch with error handling */
async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...getHeaders(), ...options.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

/** GET /api/memes — list memes, optionally filtered by type */
export const getMemes = (type) =>
  request(type ? `/api/memes?type=${type}` : '/api/memes');

/** GET /api/memes/:id — single meme detail */
export const getMeme = (id) => request(`/api/memes/${id}`);

/** POST /api/memes — upload a new meme (FormData) */
export const uploadMeme = (formData) =>
  request('/api/memes', { method: 'POST', body: formData });

/** PATCH /api/memes/:id — update title/description */
export const updateMeme = (id, data) =>
  request(`/api/memes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

/** DELETE /api/memes/:id */
export const deleteMeme = (id) =>
  request(`/api/memes/${id}`, { method: 'DELETE' });

/** POST /api/memes/:id/react — toggle like/dislike */
export const reactToMeme = (id, isLike) =>
  request(`/api/memes/${id}/react`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_like: isLike }),
  });

/** GET /api/memes/:id/reaction — get current user's reaction */
export const getUserReaction = (memeId) =>
  request(`/api/memes/${memeId}/reaction`);

/** GET /api/stats — gallery statistics */
export const getStats = () => request('/api/stats');
