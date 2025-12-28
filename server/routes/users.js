const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const { uploadImage } = require('../services/uploadService');
// const shippfast = require('../services/shippfast'); // DISABLED - ShippFast disabled until launch

const router = express.Router();

// Configure multer for memory storage (2MB limit)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: (req, file, cb) => {
    // Validate file type
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
    }
  }
});

// Get user balance (local balance only - ShippFast disabled)
router.get('/balance', auth, async (req, res) => {
  try {
    // Use local balance only (ShippFast sync disabled)
    const user = await User.findById(req.user._id).select('balance');
    res.json({ balance: user.balance });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Sync balance with ShippFast - DISABLED
router.post('/sync-balance', auth, async (req, res) => {
  try {
    // ShippFast sync disabled - return local balance
    const user = await User.findById(req.user._id).select('balance');
    res.json({ balance: user.balance, synced: false, message: 'ShippFast sync is disabled' });
  } catch (error) {
    console.error('Error syncing balance:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -passwordResetToken -passwordResetExpires');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user._id,
      email: user.email,
      name: user.name || null,
      fullName: user.name || null, // Alias for consistency
      businessName: user.businessName || null,
      avatarUrl: user.avatarUrl || user.picture || null,
      balance: user.balance,
      role: user.role || 'User', // Default role if not set
      createdAt: user.createdAt // Include createdAt from timestamps
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update current user profile (multipart/form-data)
router.put('/me', 
  auth,
  upload.single('avatar'), // Handle single file upload with field name 'avatar'
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Handle text fields from form-data
      const { name, businessName } = req.body;

      // Update name if provided
      if (name !== undefined) {
        const trimmedName = typeof name === 'string' ? name.trim() : '';
        if (trimmedName.length > 100) {
          return res.status(400).json({ message: 'Name must be 100 characters or less' });
        }
        user.name = trimmedName || null;
      }

      // Update businessName if provided
      if (businessName !== undefined) {
        const trimmedBusinessName = typeof businessName === 'string' ? businessName.trim() : '';
        if (trimmedBusinessName.length > 100) {
          return res.status(400).json({ message: 'Business name must be 100 characters or less' });
        }
        user.businessName = trimmedBusinessName || null;
      }

      // Handle avatar file upload if provided
      if (req.file) {
        try {
          // Validate file size (multer already checks, but double-check)
          if (req.file.size > 2 * 1024 * 1024) {
            return res.status(400).json({ message: 'File size exceeds 2MB limit' });
          }

          // Validate mimetype
          const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
          if (!allowedMimes.includes(req.file.mimetype)) {
            return res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' });
          }

          // Upload image and get URL
          const avatarUrl = await uploadImage(req.file.buffer, req.file.mimetype, user._id.toString());
          user.avatarUrl = avatarUrl;
        } catch (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          return res.status(500).json({ message: 'Failed to upload avatar image' });
        }
      }

      await user.save();

      // Return updated user object
      res.json({
        id: user._id,
        email: user.email,
        name: user.name || null,
        fullName: user.name || null, // Alias for consistency
        businessName: user.businessName || null,
        avatarUrl: user.avatarUrl || user.picture || null,
        balance: user.balance,
        role: user.role || 'User',
        createdAt: user.createdAt
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      
      // Handle multer errors
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File size exceeds 2MB limit' });
        }
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: error.message || 'Server error' });
    }
  }
);

module.exports = router;

