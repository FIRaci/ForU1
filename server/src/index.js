/**
 * Foru Meme Gallery — Express API entry point.
 * Loads env vars, applies global middleware, mounts routes, starts server.
 */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// Route modules
import memeRoutes from './routes/meme-routes.js';
import reactionRoutes from './routes/reaction-routes.js';
import statsRoutes from './routes/stats-routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── CORS ───────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Device-ID', 'X-Admin-Key'],
  })
);

// ─── Body Parsing ───────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ─── Global Rate Limiter (100 requests per 15 min) ─────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
app.use(globalLimiter);

// ─── Upload Rate Limiter (10 per 15 min — stricter) ────
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Upload limit reached, please try again later' },
});

// ─── Routes ─────────────────────────────────────────────
// Apply stricter rate limit only to meme creation (upload)
app.post('/api/memes', uploadLimiter);

app.use('/api/memes', memeRoutes);

// Reaction routes are nested under /api/memes/:id but in a separate router
app.use('/api/memes', reactionRoutes);

app.use('/api/stats', statsRoutes);

// ─── Health Check ───────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 Catch-All ──────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ───────────────────────────────
app.use((err, _req, res, _next) => {
  // Handle multer errors (file size, type, etc.)
  if (err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File size exceeds 50MB limit'
        : err.message;
    return res.status(400).json({ error: message });
  }

  // Handle multer file-filter rejections
  if (err.message && err.message.includes('File type')) {
    return res.status(400).json({ error: err.message });
  }

  console.error('[Server] Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start Server ───────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Foru API running on http://localhost:${PORT}`);
  console.log(`   CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
});

export default app;
