/**
 * Stats routes — aggregate counts by media type using Prisma.
 */

import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

/**
 * GET /api/stats
 * Returns meme counts grouped by media type.
 */
router.get('/', async (_req, res) => {
  try {
    const counts = await prisma.meme.groupBy({
      by: ['mediaType'],
      _count: { id: true },
    });

    const stats = { images: 0, gifs: 0, videos: 0, total: 0 };

    for (const row of counts) {
      const count = row._count.id;
      switch (row.mediaType) {
        case 'image': stats.images = count; break;
        case 'gif': stats.gifs = count; break;
        case 'video': stats.videos = count; break;
      }
      stats.total += count;
    }

    res.json(stats);
  } catch (err) {
    console.error('[Stats] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
