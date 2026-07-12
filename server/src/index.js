/**
 * Foru API server — Express entry point.
 * Serves uploaded files statically + REST API.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { join } from 'path';
import memeRoutes from './routes/meme-routes.js';
import reactionRoutes from './routes/reaction-routes.js';
import statsRoutes from './routes/stats-routes.js';
import prisma from './lib/prisma.js';

const app = express();
const PORT = process.env.PORT || 3001;

/* ---- CORS ---- */
const allowedOrigin = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .replace(/\/+$/, '')   // strip trailing slashes
  .toLowerCase();

app.use(cors({
  origin: (origin, callback) => {
    /* Allow requests with no origin (mobile apps, curl, server-to-server) */
    if (!origin) return callback(null, true);
    const normalized = origin.replace(/\/+$/, '').toLowerCase();
    if (normalized === allowedOrigin) return callback(null, true);
    callback(new Error(`CORS: ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-Device-ID', 'X-Admin-Key'],
}));

/* ---- Body parsing ---- */
app.use(express.json());

/* ---- Rate limiting ---- */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased to 1000 to prevent 429 errors for heavy users
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
app.use(globalLimiter);

/* ---- API Routes ---- */
app.use('/api/memes', memeRoutes);
app.use('/api/memes', reactionRoutes);
app.use('/api/stats', statsRoutes);

/* Health check */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ---- Global error handler ---- */
app.use((err, _req, res, _next) => {
  /* Multer errors */
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size exceeds 50MB limit' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Unexpected file field' });
  }
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

/* ---- Start ---- */
app.listen(PORT, () => {
  console.log(`🚀 Foru API running on port ${PORT}`);
});
