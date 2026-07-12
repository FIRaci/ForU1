/**
 * File storage service — save/delete files on local disk.
 * Files served via express.static('/uploads').
 */

import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

/** Map MIME types to file extensions */
const EXT_MAP = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

/** Ensure the uploads directory exists */
export async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Save a file buffer to disk.
 * @param {Buffer} buffer - File contents
 * @param {string} mime - MIME type (e.g. 'image/png')
 * @returns {string} Generated filename
 */
export async function saveFile(buffer, mime) {
  await ensureUploadDir();
  const ext = EXT_MAP[mime] || 'bin';
  const filename = `${randomUUID()}.${ext}`;
  const filepath = join(UPLOAD_DIR, filename);
  await writeFile(filepath, buffer);
  return filename;
}

/**
 * Delete a stored file (best-effort, won't throw).
 * @param {string} filename
 */
export async function deleteStoredFile(filename) {
  try {
    await unlink(join(UPLOAD_DIR, filename));
  } catch (err) {
    console.error('[Storage] Delete failed:', err.message);
  }
}

/**
 * Build the public URL path for a stored file.
 * @param {string} filename
 * @returns {string} URL path like /uploads/abc-123.jpg
 */
export function getFileUrl(filename) {
  return `/uploads/${filename}`;
}

export { UPLOAD_DIR };
