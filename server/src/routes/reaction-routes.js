/**
 * Reaction routes — like/dislike toggle logic.
 * Same reaction → remove. Opposite reaction → switch. No reaction → create.
 * Denormalized counts on memes table are updated atomically in a transaction.
 */

import { Router } from 'express';
import pool from '../db/pool.js';
import { deviceAuth } from '../middleware/device-auth.js';

const router = Router();

/**
 * POST /api/memes/:id/react
 * Body: { isLike: boolean }
 * Requires device auth (X-Device-ID header).
 *
 * Toggle logic:
 *   1. No existing reaction → insert it
 *   2. Same reaction exists → remove it (toggle off)
 *   3. Opposite reaction exists → switch it
 */
router.post('/:id/react', deviceAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    const { id: memeId } = req.params;
    const { isLike } = req.body;

    // Validate isLike is a boolean
    if (typeof isLike !== 'boolean') {
      return res.status(400).json({ error: 'isLike must be a boolean' });
    }

    const userId = req.user.id;

    await client.query('BEGIN');

    // Verify the meme exists
    const { rows: memeRows } = await client.query(
      'SELECT id FROM memes WHERE id = $1 FOR UPDATE',
      [memeId]
    );

    if (memeRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Meme not found' });
    }

    // Check for existing reaction
    const { rows: existingRows } = await client.query(
      'SELECT is_like FROM reactions WHERE meme_id = $1 AND user_id = $2',
      [memeId, userId]
    );

    let action;
    const existing = existingRows[0];

    if (!existing) {
      // Case 1: No existing reaction → create it
      await client.query(
        'INSERT INTO reactions (meme_id, user_id, is_like) VALUES ($1, $2, $3)',
        [memeId, userId, isLike]
      );

      // Update denormalized count: +1 like or +1 dislike
      if (isLike) {
        await client.query(
          'UPDATE memes SET like_count = like_count + 1 WHERE id = $1',
          [memeId]
        );
      } else {
        await client.query(
          'UPDATE memes SET dislike_count = dislike_count + 1 WHERE id = $1',
          [memeId]
        );
      }

      action = 'created';
    } else if (existing.is_like === isLike) {
      // Case 2: Same reaction → remove it (toggle off)
      await client.query(
        'DELETE FROM reactions WHERE meme_id = $1 AND user_id = $2',
        [memeId, userId]
      );

      // Update denormalized count: -1 like or -1 dislike
      if (isLike) {
        await client.query(
          'UPDATE memes SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1',
          [memeId]
        );
      } else {
        await client.query(
          'UPDATE memes SET dislike_count = GREATEST(dislike_count - 1, 0) WHERE id = $1',
          [memeId]
        );
      }

      action = 'removed';
    } else {
      // Case 3: Opposite reaction → switch it
      await client.query(
        'UPDATE reactions SET is_like = $3, created_at = NOW() WHERE meme_id = $1 AND user_id = $2',
        [memeId, userId, isLike]
      );

      // Swap counts: one goes up, the other goes down
      if (isLike) {
        // Switching from dislike to like
        await client.query(
          `UPDATE memes
           SET like_count = like_count + 1,
               dislike_count = GREATEST(dislike_count - 1, 0)
           WHERE id = $1`,
          [memeId]
        );
      } else {
        // Switching from like to dislike
        await client.query(
          `UPDATE memes
           SET dislike_count = dislike_count + 1,
               like_count = GREATEST(like_count - 1, 0)
           WHERE id = $1`,
          [memeId]
        );
      }

      action = 'switched';
    }

    await client.query('COMMIT');

    // Fetch updated counts
    const { rows: updatedRows } = await pool.query(
      'SELECT like_count, dislike_count FROM memes WHERE id = $1',
      [memeId]
    );

    res.json({
      action,
      isLike: action === 'removed' ? null : isLike,
      like_count: updatedRows[0].like_count,
      dislike_count: updatedRows[0].dislike_count,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Reactions] Error processing reaction:', err.message);
    res.status(500).json({ error: 'Failed to process reaction' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/memes/:id/reaction
 * Get the current user's reaction for a specific meme.
 * Requires device auth.
 */
router.get('/:id/reaction', deviceAuth, async (req, res) => {
  try {
    const { id: memeId } = req.params;
    const userId = req.user.id;

    const { rows } = await pool.query(
      'SELECT is_like FROM reactions WHERE meme_id = $1 AND user_id = $2',
      [memeId, userId]
    );

    if (rows.length === 0) {
      return res.json({ reaction: null });
    }

    res.json({
      reaction: rows[0].is_like ? 'like' : 'dislike',
    });
  } catch (err) {
    console.error('[Reactions] Error fetching reaction:', err.message);
    res.status(500).json({ error: 'Failed to fetch reaction' });
  }
});

export default router;
