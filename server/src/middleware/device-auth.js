/**
 * Device auth middleware — extracts device ID from header.
 * No database lookup needed — device ID stored directly in reactions.
 * Every visitor is auto-"logged in" via localStorage UUID on frontend.
 */

/**
 * Require device ID (for reactions).
 */
export function deviceAuth(req, res, next) {
  const deviceId = req.headers['x-device-id'];
  if (!deviceId) {
    return res.status(400).json({ error: 'Device ID required' });
  }
  req.deviceId = deviceId;
  next();
}

/**
 * Optional device ID (for listing memes with user's reaction state).
 */
export function optionalDeviceAuth(req, res, next) {
  req.deviceId = req.headers['x-device-id'] || null;
  next();
}
