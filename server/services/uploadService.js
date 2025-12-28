const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary if credentials are provided
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

/**
 * Upload image to Cloudinary or save to local /uploads folder
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} mimetype - MIME type (e.g., 'image/jpeg')
 * @param {string} userId - User ID for unique filename
 * @returns {Promise<string>} - URL of uploaded image
 */
const uploadImage = async (fileBuffer, mimetype, userId) => {
  // Try Cloudinary first if configured
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'avatars',
            public_id: `user-${userId}`,
            overwrite: true,
            resource_type: 'image',
            transformation: [
              { width: 400, height: 400, crop: 'fill', gravity: 'face' },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              console.log('Image uploaded to Cloudinary:', result.secure_url);
              resolve(result.secure_url);
            }
          }
        );
        
        uploadStream.end(fileBuffer);
      });
    } catch (error) {
      console.error('Cloudinary upload failed, falling back to local storage:', error);
      // Fall through to local storage
    }
  }

  // Fallback: Save to local /uploads folder
  // WARNING: This won't persist on Railway/Render unless using persistent volumes
  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const extension = mimetype.split('/')[1]; // e.g., 'jpeg' from 'image/jpeg'
  const filename = `avatar-${userId}-${Date.now()}.${extension}`;
  const filepath = path.join(uploadsDir, filename);

  fs.writeFileSync(filepath, fileBuffer);

  // Return URL - adjust based on your server setup
  const baseUrl = process.env.BACKEND_URL || process.env.FRONTEND_URL || 'http://localhost:5001';
  const uploadUrl = `${baseUrl}/uploads/${filename}`;

  console.warn('⚠️  WARNING: Using local file storage. This will NOT persist on Railway/Render.');
  console.warn('⚠️  Configure Cloudinary (CLOUDINARY_*) for production use.');

  return uploadUrl;
};

module.exports = {
  uploadImage
};

