/**
 * Meme routes — CRUD with Prisma + local file storage.
 * GET is public; POST/PATCH/DELETE require admin auth.
 */

import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { adminAuth } from '../middleware/admin-auth.js';
import { optionalDeviceAuth } from '../middleware/device-auth.js';
import upload from '../middleware/multer-config.js';
import { detectMediaType } from '../services/file-type-service.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinary-service.js';

const router = Router();

/** Map Prisma meme to frontend-expected snake_case format */
function formatMeme(meme, reactions) {
  return {
    id: meme.id,
    title: meme.title,
    description: meme.description,
    file_url: meme.filename, // We now store the absolute Cloudinary URL directly in filename
    media_type: meme.mediaType,
    file_size: meme.fileSize,
    like_count: meme.likeCount,
    dislike_count: meme.dislikeCount,
    created_at: meme.createdAt,
    user_reaction: reactions?.[0]
      ? (reactions[0].isLike ? 'like' : 'dislike')
      : null,
  };
}

/**
 * GET /api/memes
 * List all memes, newest first. Optional ?type=image|gif|video filter.
 */
router.get('/', optionalDeviceAuth, async (req, res) => {
  try {
    const { type } = req.query;
    const where = {};
    if (['image', 'gif', 'video'].includes(type)) {
      where.mediaType = type;
    }

    const memes = await prisma.meme.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: req.deviceId
        ? { reactions: { where: { deviceId: req.deviceId }, take: 1 } }
        : undefined,
    });

    res.json(memes.map((m) => formatMeme(m, m.reactions)));
  } catch (err) {
    console.error('[Memes] List error:', err.message);
    res.status(500).json({ error: 'Failed to fetch memes' });
  }
});

/**
 * GET /api/memes/:id — single meme detail
 */
router.get('/:id', optionalDeviceAuth, async (req, res) => {
  try {
    const meme = await prisma.meme.findUnique({
      where: { id: req.params.id },
      include: req.deviceId
        ? { reactions: { where: { deviceId: req.deviceId }, take: 1 } }
        : undefined,
    });

    if (!meme) return res.status(404).json({ error: 'Meme not found' });
    res.json(formatMeme(meme, meme.reactions));
  } catch (err) {
    console.error('[Memes] Detail error:', err.message);
    res.status(500).json({ error: 'Failed to fetch meme' });
  }
});

/**
 * POST /api/memes — admin upload
 */
router.post('/', adminAuth, upload.single('file'), async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
    if (!req.file) return res.status(400).json({ error: 'File is required' });

    const mediaType = await detectMediaType(req.file.buffer);
    if (!mediaType) return res.status(400).json({ error: 'Unsupported file type' });

    // Upload to Cloudinary instead of local disk
    const resourceType = mediaType === 'video' ? 'video' : 'image';
    const secureUrl = await uploadToCloudinary(req.file.buffer, resourceType);

    const meme = await prisma.meme.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        filename: secureUrl, // Store full Cloudinary URL
        mediaType,
        fileSize: req.file.size,
      },
    });

    res.status(201).json(formatMeme(meme));
  } catch (err) {
    console.error('[Memes] Upload error:', err.message);
    res.status(500).json({ error: 'Failed to upload meme' });
  }
});

/**
 * PATCH /api/memes/:id — admin update title/description
 */
router.patch('/:id', adminAuth, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title && description === undefined) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    const data = {};
    if (title) data.title = title.trim();
    if (description !== undefined) data.description = description?.trim() || null;

    const meme = await prisma.meme.update({
      where: { id: req.params.id },
      data,
    });

    res.json(formatMeme(meme));
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Meme not found' });
    console.error('[Memes] Update error:', err.message);
    res.status(500).json({ error: 'Failed to update meme' });
  }
});

/**
 * DELETE /api/memes/:id — admin delete file + DB record
 */
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const meme = await prisma.meme.findUnique({
      where: { id: req.params.id },
      select: { filename: true },
    });

    if (!meme) return res.status(404).json({ error: 'Meme not found' });

    // Delete from Cloudinary
    await deleteFromCloudinary(meme.filename);
    
    await prisma.meme.delete({ where: { id: req.params.id } });

    res.json({ message: 'Meme deleted successfully' });
  } catch (err) {
    console.error('[Memes] Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete meme' });
  }
});

export default router;
