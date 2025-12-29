const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

/**
 * Upload image to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} mimetype - MIME type (e.g., 'image/jpeg')
 * @param {string} userId - User ID for unique filename
 * @returns {Promise<{secure_url: string, public_id: string}>} - Cloudinary result with URL and public_id
 */
const uploadImage = async (fileBuffer, mimetype, userId) => {
  // Check if Cloudinary is configured
  if (!isCloudinaryConfigured()) {
    throw new Error('AVATAR_UPLOAD_NOT_CONFIGURED');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'shipcanary/avatars',
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
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id
          });
        }
      }
    );
    
    uploadStream.end(fileBuffer);
  });
};

module.exports = {
  uploadImage
};


