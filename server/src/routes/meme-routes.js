/**
 * Meme routes — CRUD operations for memes.
 * GET endpoints are public; POST/PATCH/DELETE require admin auth.
 */

import { Router } from 'express';
import pool from '../db/pool.js';
import { adminAuth } from '../middleware/admin-auth.js';
import { optionalDeviceAuth } from '../middleware/device-auth.js';
import upload from '../middleware/multer-config.js';
import { detectMediaType } from '../services/file-type-service.js';
import {
  uploadStream,
  getThumbUrl,
  deleteFile,
  getResourceType,
} from '../services/cloudinary-service.js';

const router = Router();

/**
 * GET /api/memes
 * List all memes, newest first.
 * Optional query: ?type=image|gif|video
 * Includes the requesting user's reaction if X-Device-ID is present.
 */
router.get('/', optionalDeviceAuth, async (req, res) => {
  try {
    const { type } = req.query;
    const validTypes = ['image', 'gif', 'video'];
    const params = [];
    let whereClause = '';

    // Optional media type filter
    if (type && validTypes.includes(type)) {
      params.push(type);
      whereClause = 'WHERE m.media_type = $1';
    }

    // If user is authenticated, LEFT JOIN to get their reaction
    const userJoin = req.user
      ? `LEFT JOIN reactions r ON r.meme_id = m.id AND r.user_id = $${params.length + 1}`
      : '';

    const userSelect = req.user
      ? ', r.is_like AS user_reaction'
      : ', NULL AS user_reaction';

    if (req.user) {
      params.push(req.user.id);
    }

    const query = `
      SELECT
        m.id, m.title, m.description, m.file_url, m.thumbnail_url,
        m.media_type, m.width, m.height, m.file_size,
        m.like_count, m.dislike_count, m.created_at
        ${userSelect}
      FROM memes m
      ${userJoin}
      ${whereClause}
      ORDER BY m.created_at DESC
    `;

    const { rows } = await pool.query(query, params);

    // Normalize user_reaction: true=liked, false=disliked, null=none
    const memes = rows.map((row) => ({
      ...row,
      user_reaction:
        row.user_reaction === true
          ? 'like'
          : row.user_reaction === false
            ? 'dislike'
            : null,
    }));

    res.json(memes);
  } catch (err) {
    console.error('[Memes] Error listing memes:', err.message);
    res.status(500).json({ error: 'Failed to fetch memes' });
  }
});

/**
 * GET /api/memes/:id
 * Single meme with its comments.
 */
router.get('/:id', optionalDeviceAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const memeParams = [id];

    // Fetch meme with optional user reaction
    const userJoin = req.user
      ? `LEFT JOIN reactions r ON r.meme_id = m.id AND r.user_id = $2`
      : '';
    const userSelect = req.user
      ? ', r.is_like AS user_reaction'
      : ', NULL AS user_reaction';

    if (req.user) {
      memeParams.push(req.user.id);
    }

    const memeQuery = `
      SELECT
        m.id, m.title, m.description, m.file_url, m.thumbnail_url,
        m.media_type, m.width, m.height, m.file_size,
        m.like_count, m.dislike_count, m.created_at
        ${userSelect}
      FROM memes m
      ${userJoin}
      WHERE m.id = $1
    `;

    const { rows: memeRows } = await pool.query(memeQuery, memeParams);

    if (memeRows.length === 0) {
      return res.status(404).json({ error: 'Meme not found' });
    }

    // Fetch comments for this meme
    const { rows: comments } = await pool.query(
      `SELECT id, content, created_at
       FROM comments
       WHERE meme_id = $1
       ORDER BY created_at ASC`,
      [id]
    );

    const meme = memeRows[0];

    res.json({
      ...meme,
      user_reaction:
        meme.user_reaction === true
          ? 'like'
          : meme.user_reaction === false
            ? 'dislike'
            : null,
      comments,
    });
  } catch (err) {
    console.error('[Memes] Error fetching meme:', err.message);
    res.status(500).json({ error: 'Failed to fetch meme' });
  }
});

/**
 * POST /api/memes
 * Admin only — upload a file and create a meme record.
 * Multipart form: file, title, description (optional).
 */
router.post('/', adminAuth, upload.single('file'), async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    // Detect media type from magic bytes (not MIME header)
    const mediaType = await detectMediaType(req.file.buffer);

    if (!mediaType) {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    const resourceType = getResourceType(mediaType);

    // Upload to Cloudinary via stream
    const uploadResult = await uploadStream(req.file.buffer, {
      folder: 'foru-memes',
      resource_type: resourceType,
    });

    // Generate thumbnail URL
    const thumbnailUrl = getThumbUrl(uploadResult.public_id, mediaType);

    // Insert meme record into database
    const { rows } = await pool.query(
      `INSERT INTO memes (title, description, file_url, thumbnail_url,
         cloudinary_public_id, media_type, width, height, file_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        title.trim(),
        description?.trim() || null,
        uploadResult.secure_url,
        thumbnailUrl,
        uploadResult.public_id,
        mediaType,
        uploadResult.width || null,
        uploadResult.height || null,
        uploadResult.bytes || null,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    // Handle multer file-size errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds 50MB limit' });
    }

    console.error('[Memes] Error creating meme:', err.message);
    res.status(500).json({ error: 'Failed to create meme' });
  }
});

/**
 * PATCH /api/memes/:id
 * Admin only — update title and/or description.
 */
router.patch('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!title && description === undefined) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    // Build dynamic SET clause
    const setClauses = [];
    const params = [];
    let paramIdx = 1;

    if (title) {
      setClauses.push(`title = $${paramIdx++}`);
      params.push(title.trim());
    }

    if (description !== undefined) {
      setClauses.push(`description = $${paramIdx++}`);
      params.push(description?.trim() || null);
    }

    params.push(id);

    const { rows } = await pool.query(
      `UPDATE memes SET ${setClauses.join(', ')}
       WHERE id = $${paramIdx}
       RETURNING *`,
      params
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Meme not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('[Memes] Error updating meme:', err.message);
    res.status(500).json({ error: 'Failed to update meme' });
  }
});

/**
 * DELETE /api/memes/:id
 * Admin only — delete from Cloudinary + database.
 */
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the meme to get Cloudinary info before deletion
    const { rows } = await pool.query(
      'SELECT cloudinary_public_id, media_type FROM memes WHERE id = $1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Meme not found' });
    }

    const { cloudinary_public_id, media_type } = rows[0];

    // Delete from Cloudinary (best effort — DB deletion proceeds regardless)
    if (cloudinary_public_id) {
      try {
        const resourceType = getResourceType(media_type);
        await deleteFile(cloudinary_public_id, resourceType);
      } catch (cloudErr) {
        console.error('[Memes] Cloudinary deletion failed:', cloudErr.message);
        // Continue with DB deletion even if Cloudinary fails
      }
    }

    // Delete from database (cascades to reactions + comments)
    await pool.query('DELETE FROM memes WHERE id = $1', [id]);

    res.json({ message: 'Meme deleted successfully' });
  } catch (err) {
    console.error('[Memes] Error deleting meme:', err.message);
    res.status(500).json({ error: 'Failed to delete meme' });
  }
});

export default router;
