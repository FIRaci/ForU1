/**
 * Cloudinary service — handles file upload, thumbnail generation, and deletion.
 * All uploads use upload_stream to pipe buffers directly without temp files.
 */

import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'node:stream';

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a buffer to Cloudinary via upload_stream.
 *
 * @param {Buffer} buffer — File buffer from multer
 * @param {object} options — Cloudinary upload options (folder, resource_type, etc.)
 * @returns {Promise<object>} Cloudinary upload result
 */
export function uploadStream(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadCallback = (error, result) => {
      if (error) return reject(error);
      resolve(result);
    };

    const stream = cloudinary.uploader.upload_stream(options, uploadCallback);

    // Convert buffer to readable stream and pipe to Cloudinary
    Readable.from(buffer).pipe(stream);
  });
}

/**
 * Generate a thumbnail URL using Cloudinary URL transformations.
 *
 * @param {string} publicId — Cloudinary public ID of the uploaded file
 * @param {string} mediaType — 'image' | 'gif' | 'video'
 * @returns {string} Transformed thumbnail URL
 */
export function getThumbUrl(publicId, mediaType) {
  if (mediaType === 'video') {
    // Video poster: grab frame at 1 second, scale to 400×400 crop-fill
    return cloudinary.url(publicId, {
      resource_type: 'video',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'auto' },
        { start_offset: '1' },
      ],
      format: 'jpg',
    });
  }

  // Image / GIF thumbnail: 400×400 crop-fill
  return cloudinary.url(publicId, {
    resource_type: 'image',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'auto' },
    ],
  });
}

/**
 * Delete a file from Cloudinary.
 *
 * @param {string} publicId — Cloudinary public ID
 * @param {string} resourceType — 'image' | 'video'
 * @returns {Promise<object>} Deletion result
 */
export function deleteFile(publicId, resourceType = 'image') {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
}

/**
 * Map our internal media type to Cloudinary's resource_type.
 * GIFs are treated as 'image' by Cloudinary.
 *
 * @param {string} mediaType — 'image' | 'gif' | 'video'
 * @returns {string} Cloudinary resource_type
 */
export function getResourceType(mediaType) {
  return mediaType === 'video' ? 'video' : 'image';
}
