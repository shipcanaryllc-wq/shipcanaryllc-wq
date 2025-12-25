const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const RegistrationAttempt = require('../models/RegistrationAttempt');

// Rate limiting for registration - stricter limits
// For development, increased limits; reduce for production
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 2 : 10, // 10 accounts per hour in dev, 2 in production
  message: 'Too many accounts created from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Rate limiting for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 20, // 20 login attempts per 15 min in dev, 5 in production
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Account lockout after failed login attempts
const handleLoginAttempt = async (user, success, ipAddress) => {
  const MAX_ATTEMPTS = 5;
  const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

  if (success) {
    // Reset on successful login
    if (user.loginAttempts > 0) {
      await User.updateOne(
        { _id: user._id },
        {
          $set: { loginAttempts: 0, lastLogin: new Date(), ipAddress },
          $unset: { lockUntil: 1 }
        }
      );
    }
    return { success: true };
  } else {
    // Increment login attempts
    const updates = { $inc: { loginAttempts: 1 } };
    
    if (user.loginAttempts + 1 >= MAX_ATTEMPTS && !user.isLocked) {
      updates.$set = { lockUntil: Date.now() + LOCK_TIME };
    }
    
    await User.updateOne({ _id: user._id }, updates);
    
    const updatedUser = await User.findById(user._id);
    return {
      success: false,
      isLocked: updatedUser.isLocked,
      remainingAttempts: Math.max(0, MAX_ATTEMPTS - updatedUser.loginAttempts)
    };
  }
};

// Email validation helper
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Generate device fingerprint from request headers
const generateFingerprint = (req) => {
  const userAgent = req.get('user-agent') || '';
  const acceptLanguage = req.get('accept-language') || '';
  const acceptEncoding = req.get('accept-encoding') || '';
  // Simple fingerprint - in production, use a more sophisticated method
  return `${userAgent.substring(0, 50)}|${acceptLanguage.substring(0, 20)}|${acceptEncoding.substring(0, 20)}`;
};

// Check for similar email patterns (e.g., test1@gmail.com, test2@gmail.com)
const checkSimilarEmails = async (email, ipAddress) => {
  try {
    const [localPart, domain] = email.split('@');
    
    // Check for emails with similar patterns from same IP
    // Look for emails like: test1@, test2@, test3@ from same IP
    const basePattern = localPart.replace(/\d+$/, ''); // Remove trailing numbers
    const similarPattern = new RegExp(`^${basePattern}\\d*@${domain}$`);
    
    const similarAccounts = await User.find({
      email: similarPattern,
      registrationIP: ipAddress
    }).limit(5);
    
    if (similarAccounts.length >= 3) {
      return { suspicious: true, reason: 'Multiple accounts with similar email patterns detected' };
    }
    
    return { suspicious: false };
  } catch (error) {
    console.error('Similar email check error:', error);
    return { suspicious: false };
  }
};

// Check for suspicious patterns
const checkSuspiciousActivity = async (email, ipAddress, req) => {
  try {
    // Check for multiple accounts from same IP (stricter limit)
    const accountsFromIP = await User.countDocuments({ registrationIP: ipAddress });
    if (accountsFromIP >= 6) {
      return { suspicious: true, reason: 'Too many accounts from this IP address. Maximum 5 accounts per IP allowed.' };
    }

    // Check for accounts created recently from same IP (within last 24 hours)
    const recentAccounts = await User.countDocuments({
      registrationIP: ipAddress,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    if (recentAccounts >= 5) {
      return { suspicious: true, reason: 'Too many accounts created recently from this IP address' };
    }

    // Check for device fingerprint reuse - DISABLED until launch
    // if (req) {
    //   const fingerprint = generateFingerprint(req);
    //   const accountsWithFingerprint = await User.countDocuments({ deviceFingerprint: fingerprint });
    //   if (accountsWithFingerprint >= 2) {
    //     return { suspicious: true, reason: 'Multiple accounts detected from same device' };
    //   }
    // }

    // Check for similar email patterns
    const similarCheck = await checkSimilarEmails(email, ipAddress);
    if (similarCheck.suspicious) {
      return similarCheck;
    }

    // Check for disposable email domains (expanded list)
    const disposableDomains = [
      'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
      'throwaway.email', 'temp-mail.org', 'getnada.com', 'mohmal.com',
      'fakeinbox.com', 'trashmail.com', 'yopmail.com', 'sharklasers.com',
      'guerrillamailblock.com', 'pokemail.net', 'spam4.me', 'emailondeck.com'
    ];
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain && disposableDomains.some(d => domain.includes(d))) {
      return { suspicious: true, reason: 'Disposable email addresses are not allowed' };
    }

    // Check for email domain patterns that suggest abuse
    // Look for emails with many numbers or random strings
    const localPart = email.split('@')[0];
    const numberCount = (localPart.match(/\d/g) || []).length;
    const randomPattern = /^[a-z]{1,3}\d{4,}/i; // e.g., abc1234, xyz5678
    
    if (numberCount > 5 || randomPattern.test(localPart)) {
      // Check if this pattern exists from same IP
      const suspiciousAccounts = await User.countDocuments({
        registrationIP: ipAddress,
        email: { $regex: /^\w{1,3}\d{4,}/i }
      });
      if (suspiciousAccounts >= 2) {
        return { suspicious: true, reason: 'Suspicious email pattern detected' };
      }
    }

    // Check registration attempts in last hour
    const recentAttempts = await RegistrationAttempt.countDocuments({
      ipAddress,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
    });
    if (recentAttempts >= 5) {
      return { suspicious: true, reason: 'Too many registration attempts from this IP address' };
    }

    return { suspicious: false };
  } catch (error) {
    // If database query fails, don't block registration (might be MongoDB connection issue)
    console.error('Fraud check error:', error);
    return { suspicious: false };
  }
};

// Track registration attempt
const trackRegistrationAttempt = async (email, ipAddress, req, success, userId = null) => {
  try {
    const fingerprint = req ? generateFingerprint(req) : null;
    const userAgent = req ? req.get('user-agent') : null;
    
    await RegistrationAttempt.create({
      email,
      ipAddress,
      userAgent,
      fingerprint,
      success,
      userId
    });
  } catch (error) {
    console.error('Error tracking registration attempt:', error);
  }
};

module.exports = {
  registrationLimiter,
  loginLimiter,
  handleLoginAttempt,
  isValidEmail,
  checkSuspiciousActivity,
  trackRegistrationAttempt,
  generateFingerprint
};

