import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

// Configured automatically via the CLOUDINARY_URL environment variable
// Format: CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>

/**
 * Upload a file buffer to Cloudinary using upload_stream.
 *
 * @param {Buffer} buffer - The file buffer from Multer.
 * @param {string} resourceType - 'image' | 'video' | 'auto'.
 * @returns {Promise<string>} The secure URL of the uploaded file on Cloudinary.
 */
export const uploadToCloudinary = (buffer, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: 'foru_memes',
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Upload Error:', error);
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );

    // Pipe the buffer to the upload stream
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Delete a file from Cloudinary (best-effort).
 * Note: Deleting requires the public_id, which we'd need to extract from the URL,
 * or just let Cloudinary keep them since we're mostly just archiving/deleting DB records.
 * For this simple migration, we'll just log or implement a basic extractor if needed.
 */
export const deleteFromCloudinary = async (fileUrl) => {
  try {
    // Extract public_id from URL (e.g. https://res.cloudinary.com/dpjc9w12o/image/upload/v12345/foru_memes/abc123.jpg)
    // A simplified extraction:
    const matches = fileUrl.match(/\/v\d+\/(foru_memes\/[^.]+)/);
    if (matches && matches[1]) {
      const publicId = matches[1];
      // Cloudinary requires knowing if it's 'image' or 'video' to destroy. We try both or infer from extension.
      const isVideo = fileUrl.match(/\.(mp4|webm)$/i);
      await cloudinary.uploader.destroy(publicId, { resource_type: isVideo ? 'video' : 'image' });
      console.log(`[Cloudinary] Deleted: ${publicId}`);
    }
  } catch (error) {
    console.error('[Cloudinary] Delete failed:', error.message);
  }
};
