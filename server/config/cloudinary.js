const cloudinary = require('cloudinary').v2;

/**
 * Cloudinary Configuration Module
 * Reads CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET from process.env
 */
const configureCloudinary = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    const missing = [];
    if (!cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
    if (!apiKey) missing.push('CLOUDINARY_API_KEY');
    if (!apiSecret) missing.push('CLOUDINARY_API_SECRET');
    
    console.warn('⚠️  WARNING: Cloudinary credentials not configured.');
    console.warn(`⚠️  Missing: ${missing.join(', ')}`);
    console.warn('⚠️  Avatar uploads will return 503 until configured.');
    return false;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
  });

  console.log('✅ Cloudinary configured successfully');
  return true;
};

/**
 * Check if Cloudinary is configured
 */
const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

// Initialize on module load
const isConfigured = configureCloudinary();

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  isConfigured
};




