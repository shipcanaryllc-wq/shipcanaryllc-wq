const mongoose = require('mongoose');

const registrationAttemptSchema = new mongoose.Schema({
  ipAddress: {
    type: String,
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    index: true
  },
  userAgent: String,
  fingerprint: String, // Browser/device fingerprint
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400000 // Auto-delete after 24 hours
  },
  success: {
    type: Boolean,
    default: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for fast lookups
registrationAttemptSchema.index({ ipAddress: 1, createdAt: -1 });
registrationAttemptSchema.index({ email: 1 });
registrationAttemptSchema.index({ fingerprint: 1 });

module.exports = mongoose.model('RegistrationAttempt', registrationAttemptSchema);

