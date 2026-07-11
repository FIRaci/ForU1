/**
 * Device-based authentication middleware.
 * Extracts X-Device-ID header, upserts user record, attaches to req.user.
 */

import pool from '../db/pool.js';

/**
 * Requires X-Device-ID header. Returns 401 if missing.
 * Upserts a user row keyed by device_id and attaches { id, deviceId } to req.user.
 */
export async function deviceAuth(req, res, next) {
  try {
    const deviceId = req.headers['x-device-id'];

    if (!deviceId || typeof deviceId !== 'string' || deviceId.trim() === '') {
      return res.status(401).json({ error: 'Missing X-Device-ID header' });
    }

    // Upsert: insert if new device, return existing row otherwise
    const { rows } = await pool.query(
      `INSERT INTO users (device_id)
       VALUES ($1)
       ON CONFLICT (device_id) DO UPDATE SET device_id = EXCLUDED.device_id
       RETURNING id, device_id, display_name`,
      [deviceId.trim()]
    );

    req.user = {
      id: rows[0].id,
      deviceId: rows[0].device_id,
      displayName: rows[0].display_name,
    };

    next();
  } catch (err) {
    console.error('[DeviceAuth] Error:', err.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional device auth — attaches req.user if header present, but does not
 * block the request if the header is missing.
 */
export async function optionalDeviceAuth(req, res, next) {
  try {
    const deviceId = req.headers['x-device-id'];

    if (!deviceId || typeof deviceId !== 'string' || deviceId.trim() === '') {
      // No device header — proceed without user context
      req.user = null;
      return next();
    }

    const { rows } = await pool.query(
      `INSERT INTO users (device_id)
       VALUES ($1)
       ON CONFLICT (device_id) DO UPDATE SET device_id = EXCLUDED.device_id
       RETURNING id, device_id, display_name`,
      [deviceId.trim()]
    );

    req.user = {
      id: rows[0].id,
      deviceId: rows[0].device_id,
      displayName: rows[0].display_name,
    };

    next();
  } catch (err) {
    // Non-critical — log and continue without user
    console.error('[DeviceAuth] Optional auth error:', err.message);
    req.user = null;
    next();
  }
}
