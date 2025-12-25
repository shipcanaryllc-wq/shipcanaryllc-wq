const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password required only if not using Google OAuth
    },
    minlength: 8
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  name: {
    type: String
  },
  picture: {
    type: String
  },
  balance: {
    type: Number,
    default: 10.00, // $10 free credit for new users
    min: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date,
  ipAddress: String,
  registrationIP: String, // IP used during registration
  deviceFingerprint: String, // Browser/device fingerprint
  hasUsedCredit: {
    type: Boolean,
    default: false
  },
  firstOrderDate: Date,
  flaggedForReview: {
    type: Boolean,
    default: false
  },
  flagReason: String
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

module.exports = mongoose.model('User', userSchema);

