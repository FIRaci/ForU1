/**
 * Stats routes — aggregate counts by media type.
 */

import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

/**
 * GET /api/stats
 * Returns counts of memes grouped by media type, plus total.
 */
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT media_type, COUNT(*)::int AS count
       FROM memes
       GROUP BY media_type`
    );

    // Build stats object with defaults
    const stats = { images: 0, gifs: 0, videos: 0, total: 0 };

    for (const row of rows) {
      switch (row.media_type) {
        case 'image':
          stats.images = row.count;
          break;
        case 'gif':
          stats.gifs = row.count;
          break;
        case 'video':
          stats.videos = row.count;
          break;
      }
      stats.total += row.count;
    }

    res.json(stats);
  } catch (err) {
    console.error('[Stats] Error fetching stats:', err.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
