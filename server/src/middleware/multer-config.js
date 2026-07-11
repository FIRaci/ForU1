/**
 * Multer configuration for file uploads.
 * Uses memory storage (buffer) for streaming to Cloudinary.
 */

import multer from 'multer';

// Allowed MIME types for meme uploads
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
]);

// 50 MB file size limit
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const storage = multer.memoryStorage();

/**
 * File filter — rejects files with disallowed MIME types.
 */
function fileFilter(_req, file, cb) {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type "${file.mimetype}" is not allowed. ` +
        `Accepted: ${[...ALLOWED_MIME_TYPES].join(', ')}`
      ),
      false
    );
  }
}

/**
 * Configured multer instance — single file field named "file".
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

export default upload;
