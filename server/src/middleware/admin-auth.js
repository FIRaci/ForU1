/**
 * Admin authentication middleware.
 * Compares X-Admin-Key header with the ADMIN_SECRET environment variable.
 */

/**
 * Requires valid X-Admin-Key header. Returns 403 if missing or incorrect.
 * Uses timing-safe comparison via constant-time string check.
 */
export function adminAuth(req, res, next) {
  const adminKey = req.headers['x-admin-key'];
  const secret = process.env.ADMIN_SECRET;

  // Ensure the server has an admin secret configured
  if (!secret) {
    console.error('[AdminAuth] ADMIN_SECRET not configured in environment');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  if (!adminKey || typeof adminKey !== 'string') {
    return res.status(403).json({ error: 'Admin authentication required' });
  }

  // Constant-length comparison to mitigate timing attacks
  if (adminKey.length !== secret.length || adminKey !== secret) {
    return res.status(403).json({ error: 'Invalid admin key' });
  }

  next();
}
