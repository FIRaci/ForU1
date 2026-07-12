/**
 * Reaction routes — like/dislike toggle with Prisma.
 * Uses device_id directly (no users table).
 */

import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { deviceAuth } from '../middleware/device-auth.js';

const router = Router();

/**
 * POST /api/memes/:id/react
 * Toggle like/dislike. Body: { is_like: boolean }
 * - No existing reaction → create it
 * - Same reaction → remove it (toggle off)
 * - Opposite reaction → switch it
 */
router.post('/:id/react', deviceAuth, async (req, res) => {
  try {
    const { id: memeId } = req.params;
    const { is_like: isLike } = req.body;

    if (typeof isLike !== 'boolean') {
      return res.status(400).json({ error: 'is_like must be a boolean' });
    }

    /* Check meme exists */
    const meme = await prisma.meme.findUnique({ where: { id: memeId } });
    if (!meme) return res.status(404).json({ error: 'Meme not found' });

    /* Find existing reaction from this device */
    const existing = await prisma.reaction.findUnique({
      where: { memeId_deviceId: { memeId, deviceId: req.deviceId } },
    });

    let action;

    if (!existing) {
      /* No reaction → create */
      await prisma.reaction.create({
        data: { memeId, deviceId: req.deviceId, isLike },
      });
      await prisma.meme.update({
        where: { id: memeId },
        data: isLike
          ? { likeCount: { increment: 1 } }
          : { dislikeCount: { increment: 1 } },
      });
      action = isLike ? 'liked' : 'disliked';

    } else if (existing.isLike === isLike) {
      /* Same reaction → remove (toggle off) */
      await prisma.reaction.delete({
        where: { memeId_deviceId: { memeId, deviceId: req.deviceId } },
      });
      await prisma.meme.update({
        where: { id: memeId },
        data: isLike
          ? { likeCount: { decrement: 1 } }
          : { dislikeCount: { decrement: 1 } },
      });
      action = 'removed';

    } else {
      /* Opposite reaction → switch */
      await prisma.reaction.update({
        where: { memeId_deviceId: { memeId, deviceId: req.deviceId } },
        data: { isLike },
      });
      await prisma.meme.update({
        where: { id: memeId },
        data: isLike
          ? { likeCount: { increment: 1 }, dislikeCount: { decrement: 1 } }
          : { likeCount: { decrement: 1 }, dislikeCount: { increment: 1 } },
      });
      action = isLike ? 'switched to like' : 'switched to dislike';
    }

    /* Return updated meme */
    const updated = await prisma.meme.findUnique({ where: { id: memeId } });
    res.json({
      action,
      like_count: updated.likeCount,
      dislike_count: updated.dislikeCount,
    });
  } catch (err) {
    console.error('[Reactions] Error:', err.message);
    res.status(500).json({ error: 'Failed to process reaction' });
  }
});

/**
 * GET /api/memes/:id/reaction
 * Get current device's reaction for a meme.
 */
router.get('/:id/reaction', deviceAuth, async (req, res) => {
  try {
    const reaction = await prisma.reaction.findUnique({
      where: {
        memeId_deviceId: { memeId: req.params.id, deviceId: req.deviceId },
      },
    });

    res.json({
      reaction: reaction
        ? (reaction.isLike ? 'like' : 'dislike')
        : null,
    });
  } catch (err) {
    console.error('[Reactions] Get error:', err.message);
    res.status(500).json({ error: 'Failed to get reaction' });
  }
});

export default router;
