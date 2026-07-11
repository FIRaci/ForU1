/**
 * File type detection service.
 * Uses the file-type package to inspect magic bytes in the file buffer,
 * providing reliable type detection independent of the uploaded filename.
 */

import { fileTypeFromBuffer } from 'file-type';

// Map MIME types to our internal media type categories
const MIME_TO_MEDIA_TYPE = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/gif': 'gif',
  'video/mp4': 'video',
  'video/webm': 'video',
};

/**
 * Detect the media type of a file buffer using magic byte analysis.
 *
 * @param {Buffer} buffer — Raw file buffer
 * @returns {Promise<'image'|'gif'|'video'|null>} Detected media type or null if unsupported
 */
export async function detectMediaType(buffer) {
  if (!buffer || buffer.length === 0) {
    return null;
  }

  const result = await fileTypeFromBuffer(buffer);

  if (!result) {
    return null;
  }

  return MIME_TO_MEDIA_TYPE[result.mime] || null;
}
