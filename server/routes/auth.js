const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { registrationLimiter, loginLimiter, handleLoginAttempt, checkSuspiciousActivity, trackRegistrationAttempt, generateFingerprint } = require('../middleware/fraudPrevention');
const { sendPasswordResetEmail } = require('../services/emailService');
const rateLimit = require('express-rate-limit');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Rate limiter for password reset requests
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Too many password reset requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many password reset requests. Please try again in an hour.',
      error: 'RATE_LIMIT_EXCEEDED'
    });
  },
});

// Configure Passport Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists with this Google ID
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        return done(null, user);
      }
      
      // Check if user exists with this email
      user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        // Link Google account to existing user
        user.googleId = profile.id;
        user.name = profile.displayName;
        user.picture = profile.photos[0]?.value;
        await user.save();
        return done(null, user);
      }
      
      // Create new user with Google OAuth
      user = new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        picture: profile.photos[0]?.value,
        balance: 10.00, // $10 free credit
        isVerified: true // Google emails are verified
      });
      
      await user.save();
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}

// Register
router.post('/register', 
  registrationLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  ],
  async (req, res) => {
    try {
      // Check MongoDB connection
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ 
          message: 'Database connection error. Please check MongoDB configuration and IP whitelist.' 
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0]?.trim();
      const deviceFingerprint = generateFingerprint(req);

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        await trackRegistrationAttempt(email, ipAddress, req, false);
        return res.status(400).json({ message: 'User already exists' });
      }

      // Fraud prevention check (enhanced)
      const suspiciousCheck = await checkSuspiciousActivity(email, ipAddress, req);
      if (suspiciousCheck.suspicious) {
        await trackRegistrationAttempt(email, ipAddress, req, false);
        return res.status(403).json({ message: suspiciousCheck.reason });
      }

      // Create user with $10 free credit
      const user = new User({
        email,
        password,
        balance: 10.00,
        ipAddress,
        registrationIP: ipAddress,
        deviceFingerprint,
        hasUsedCredit: false
      });

      await user.save();
      
      // Track successful registration
      await trackRegistrationAttempt(email, ipAddress, req, true, user._id);

      // Generate token
      const token = jwt.sign(
        { userId: user._id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name || null,
          fullName: user.name || null,
          balance: user.balance,
          role: user.role || 'User',
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      // Send more detailed error message for debugging
      const errorMessage = error.message || 'Server error during registration';
      console.error('Error details:', {
        message: errorMessage,
        code: error.code,
        name: error.name
      });
      res.status(500).json({ 
        message: errorMessage.includes('MongoServerError') || errorMessage.includes('MongoNetworkError') 
          ? 'Database connection error. Please check MongoDB configuration.' 
          : errorMessage 
      });
    }
  }
);

// Login
router.post('/login',
  loginLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      // Check MongoDB connection
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ 
          message: 'Database connection error. Please check MongoDB configuration and IP whitelist.' 
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (user.isLocked) {
        return res.status(403).json({ message: 'Account is locked. Please contact support.' });
      }

      const isMatch = await user.comparePassword(password);
      const attemptResult = await handleLoginAttempt(user, isMatch, ipAddress);

      if (!attemptResult.success) {
        if (attemptResult.isLocked) {
          return res.status(403).json({ 
            message: 'Account locked due to too many failed attempts. Please try again later.' 
          });
        }
        return res.status(401).json({ 
          message: 'Invalid credentials',
          remainingAttempts: attemptResult.remainingAttempts
        });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user._id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name || null,
          fullName: user.name || null,
          balance: user.balance,
          role: user.role || 'User',
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  }
);

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name || null,
      fullName: user.name || null, // Alias for consistency
      businessName: user.businessName || null,
      avatarUrl: user.avatarUrl || null, // Only return avatarUrl, not picture fallback
      balance: user.balance,
      role: user.role || 'User',
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Google OAuth Routes
// Initiate Google OAuth
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/login?error=google_oauth_not_configured`);
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// Google OAuth Callback
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get('/google/callback',
    (req, res, next) => {
      passport.authenticate('google', { session: false }, async (err, user, info) => {
        if (err) {
          console.error('Google OAuth error:', err);
          console.error('Error details:', {
            message: err.message,
            stack: err.stack,
            code: err.code
          });
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
        }
        if (!user) {
          console.error('Google OAuth: No user returned');
          console.error('Info:', info);
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
        }
        
        // If this is a new user (just created), check for fraud
        if (user.createdAt && new Date() - user.createdAt < 5000) { // Created within last 5 seconds
          const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0]?.trim();
          if (ipAddress) {
            const suspiciousCheck = await checkSuspiciousActivity(user.email, ipAddress, req);
            if (suspiciousCheck.suspicious) {
              // Delete the newly created user
              await User.deleteOne({ _id: user._id });
              await trackRegistrationAttempt(user.email, ipAddress, req, false);
              const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
              return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(suspiciousCheck.reason)}`);
            }
            
            // Update user with IP and fingerprint if not set
            if (!user.registrationIP) {
              user.registrationIP = ipAddress;
              user.deviceFingerprint = generateFingerprint(req);
              await user.save();
            }
            
            // Track successful registration
            await trackRegistrationAttempt(user.email, ipAddress, req, true, user._id);
          }
        }
        
        req.user = user;
        next();
      })(req, res, next);
    },
    async (req, res) => {
      try {
        // Generate JWT token
        const token = jwt.sign(
          { userId: req.user._id },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        // Redirect to frontend with token
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/callback?token=${token}&email=${encodeURIComponent(req.user.email)}`);
      } catch (error) {
        console.error('Google OAuth callback error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
      }
    }
  );
} else {
  // Google OAuth callback route (when not configured)
  router.get('/google/callback', (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/login?error=google_oauth_not_configured`);
  });
}

// Request password reset
router.post('/request-password-reset',
  // Temporarily disabled rate limiter for testing
  // passwordResetLimiter,
  [
    body('email').isEmail().normalizeEmail()
  ],
  async (req, res) => {
    const { email } = req.body;
    
    // Helper to mask email for logging
    const maskEmail = (email) => {
      if (!email) return 'N/A';
      const [localPart, domain] = email.split('@');
      if (!domain) return email;
      const maskedLocal = localPart.length > 2 
        ? localPart.substring(0, 2) + '*'.repeat(Math.min(localPart.length - 2, 4))
        : '*'.repeat(localPart.length);
      return `${maskedLocal}@${domain}`;
    };

    const maskedEmail = maskEmail(email);
    
    // Step 1: Log request received with masked email
    console.log('[RESET] request received', { 
      email: maskedEmail, 
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('[RESET] validation failed', { errors: errors.array() });
        return res.status(400).json({ errors: errors.array() });
      }

      // Step 2: Verify Resend is configured BEFORE processing
      const hasResendKey = !!process.env.RESEND_API_KEY;
      const emailFrom = process.env.EMAIL_FROM;
      
      if (!hasResendKey || !emailFrom) {
        console.error('[RESET] EMAIL NOT CONFIGURED', { 
          hasKey: hasResendKey, 
          from: emailFrom || 'MISSING',
          email: maskedEmail
        });
        // Return generic 200 response (security) BUT DO NOT attempt to send
        return res.json({ 
          message: 'If an account with that email exists, a password reset link has been sent.' 
        });
      }

      const user = await User.findOne({ email: email.toLowerCase() });

      // Log user found/not found (but still return generic 200 for security)
      if (!user) {
        console.log('[RESET] user not found', { email: maskedEmail });
        return res.json({ 
          message: 'If an account with that email exists, a password reset link has been sent.' 
        });
      }

      console.log('[RESET] user found', { 
        userId: user._id.toString(), 
        email: maskEmail(user.email)
      });

      // Generate secure random token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      
      // Set token and expiration (1 hour)
      const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = expiresAt;
      await user.save();

      console.log('[RESET] token saved', { 
        userId: user._id.toString(), 
        expiresAt: new Date(expiresAt).toISOString() 
      });

      // Build reset link using FRONTEND_URL (NOT localhost)
      const frontendUrl = process.env.FRONTEND_URL;
      if (!frontendUrl) {
        console.error('[RESET] FRONTEND_URL not configured');
        return res.status(500).json({ ok: false, error: 'SERVER_CONFIG_ERROR', details: 'FRONTEND_URL not set' });
      }

      const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
      
      // Log resetUrl host only (don't log full token)
      try {
        const resetUrlHost = new URL(resetUrl).host;
        console.log('[RESET] resetUrl host:', resetUrlHost);
      } catch (urlError) {
        console.error('[RESET] invalid resetUrl format', { resetUrl: resetUrl.substring(0, 50) + '...' });
      }

      // Step 5: Actually send the email and log provider response
      console.log('[RESET] before calling Resend', { 
        to: maskEmail(user.email),
        from: emailFrom
      });
      
      let emailResult;
      try {
        emailResult = await sendPasswordResetEmail(user.email, resetToken);
        console.log('[RESET] Resend result', { 
          id: emailResult.id || emailResult.messageId,
          success: emailResult.success,
          to: maskEmail(user.email),
          userId: user._id.toString()
        });
      } catch (emailError) {
        // IMPORTANT: Do NOT return 200 if Resend fails
        console.error('[RESET] Resend failed', {
          error: emailError.message,
          stack: emailError.stack,
          to: maskEmail(user.email),
          userId: user._id.toString(),
          errorType: emailError.constructor.name
        });
        return res.status(500).json({ 
          ok: false, 
          error: 'EMAIL_SEND_FAILED', 
          details: emailError.message 
        });
      }

      // Return success with Resend message id
      return res.json({ 
        ok: true,
        messageId: emailResult.id || emailResult.messageId,
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    } catch (error) {
      console.error('[RESET] unexpected error', {
        error: error.message,
        stack: error.stack,
        email: maskedEmail
      });
      return res.status(500).json({ ok: false, error: 'SERVER_ERROR', details: error.message });
    }
  }
);

// Reset password with token
router.post('/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must be at least 8 characters and contain uppercase, lowercase, and a number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token, password } = req.body;
      
      // Hash the token to compare with stored hash
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      // Find user with valid token
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ 
          message: 'Invalid or expired password reset token' 
        });
      }

      // Update password
      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      res.json({ 
        message: 'Password has been reset successfully. You can now log in with your new password.' 
      });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;

