const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to decode JWT without verification (for debugging)
function decodeJWTWithoutVerification(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { error: 'Invalid JWT format - must have 3 parts' };
    }
    
    // Decode header
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    
    // Decode payload
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    
    return { header, payload };
  } catch (error) {
    return { error: error.message };
  }
}

// B.1) Token extraction function - reads from req.headers.authorization (lowercase)
function getToken(req) {
  // B.1: Use req.headers.authorization (lowercase - Express normalizes headers)
  const authHeader = req.headers.authorization || '';
  
  // B.2: Parse token strictly from "Bearer <token>"
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  
  // Fallback to x-auth-token if present (for backward compatibility)
  const xToken = req.header('x-auth-token');
  if (xToken) return xToken.trim();
  
  return null;
}

const auth = async (req, res, next) => {
  try {
    // TASK A.3: TEMP DEBUG LOG
    console.log("AUTH DEBUG", {
      hasAuth: Boolean(req.headers.authorization),
      authPreview: req.headers.authorization?.slice(0, 20),
      hasX: Boolean(req.header('x-auth-token')),
    });
    
    // Log incoming request for debugging
    console.log('\n[Auth] ════════════════════════════════════════════════════════════════');
    console.log('[Auth] 🔐 AUTH MIDDLEWARE CALLED');
    console.log('[Auth] ════════════════════════════════════════════════════════════════');
    console.log('[Auth] Method:', req.method);
    console.log('[Auth] Path:', req.path);
    console.log('[Auth] URL:', req.url);
    
    // TASK A: Use getToken function
    const token = getToken(req);
    
    if (!token) {
      console.error('[Auth] ❌ No token found');
      console.error('[Auth] Full headers:', JSON.stringify(req.headers, null, 2));
      console.error('[Auth] ════════════════════════════════════════════════════════════════\n');
      return res.status(401).json({ 
        message: "No token, authorization denied", 
        isAuthError: true 
      });
    }
    
    console.log('[Auth] ✅ Token extracted successfully');
    console.log('[Auth] Token length:', token.length);
    console.log('[Auth] Token (first 30 chars):', token.substring(0, 30) + '...');

    // Decode JWT without verification to inspect payload
    console.log('[Auth] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Auth] 🔍 DECODING JWT (without verification):');
    const decodedUnverified = decodeJWTWithoutVerification(token);
    if (decodedUnverified.error) {
      console.error('[Auth] ❌ Failed to decode JWT:', decodedUnverified.error);
    } else {
      console.log('[Auth] JWT Header:', JSON.stringify(decodedUnverified.header, null, 2));
      console.log('[Auth] JWT Payload:', JSON.stringify({
        userId: decodedUnverified.payload.userId,
        exp: decodedUnverified.payload.exp,
        iat: decodedUnverified.payload.iat,
        // Log exp as readable date
        expDate: decodedUnverified.payload.exp ? new Date(decodedUnverified.payload.exp * 1000).toISOString() : 'N/A',
        // Log all other claims
        ...Object.keys(decodedUnverified.payload).reduce((acc, key) => {
          if (!['userId', 'exp', 'iat'].includes(key)) {
            acc[key] = decodedUnverified.payload[key];
          }
          return acc;
        }, {})
      }, null, 2));
    }
    console.log('[Auth] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    console.log('[Auth] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Auth] 🔐 VERIFYING JWT:');
    console.log('[Auth] Verification method: jwt.verify() with JWT_SECRET');
    console.log('[Auth] JWT_SECRET present:', !!JWT_SECRET);
    console.log('[Auth] JWT_SECRET length:', JWT_SECRET ? JWT_SECRET.length : 0);
    console.log('[Auth] JWT_SECRET (first 10 chars):', JWT_SECRET ? `${JWT_SECRET.substring(0, 10)}...` : 'MISSING');
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('[Auth] ✅ Token verified successfully');
      console.log('[Auth] Decoded userId:', decoded.userId);
      console.log('[Auth] Decoded exp:', decoded.exp, `(${new Date(decoded.exp * 1000).toISOString()})`);
      console.log('[Auth] Token is valid and not expired');
    } catch (jwtError) {
      console.error('[Auth] ❌ JWT VERIFICATION FAILED:');
      console.error('[Auth] Error name:', jwtError.name);
      console.error('[Auth] Error message:', jwtError.message);
      console.error('[Auth] Error code:', jwtError.code);
      
      if (jwtError.name === 'TokenExpiredError') {
        console.error('[Auth] Token expired at:', new Date(jwtError.expiredAt).toISOString());
        console.error('[Auth] Current time:', new Date().toISOString());
      } else if (jwtError.name === 'JsonWebTokenError') {
        console.error('[Auth] JWT Error details:', jwtError.message);
        console.error('[Auth] Possible causes:');
        console.error('[Auth]   - Invalid signature (secret mismatch)');
        console.error('[Auth]   - Malformed token');
        console.error('[Auth]   - Token not signed with expected algorithm');
      } else if (jwtError.name === 'NotBeforeError') {
        console.error('[Auth] Token not active until:', new Date(jwtError.date).toISOString());
      }
      
      console.error('[Auth] Token (first 50 chars):', token.substring(0, 50));
      console.error('[Auth] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return res.status(401).json({ 
        message: jwtError.name === 'TokenExpiredError' 
          ? 'Token expired. Please log in again.' 
          : 'Token is not valid',
        isAuthError: true,
        errorType: jwtError.name,
        errorDetails: jwtError.message
      });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      console.error('[Auth] ❌ User not found for userId:', decoded.userId);
      return res.status(401).json({ message: 'Token is not valid' });
    }

    if (user.isLocked) {
      console.error('[Auth] ❌ Account is locked for userId:', decoded.userId);
      return res.status(403).json({ message: 'Account is locked. Please contact support.' });
    }

    console.log('[Auth] ✅ Auth successful for user:', user.email || user.username, '(userId:', user._id, ')');
    console.log('[Auth] ════════════════════════════════════════════════════════════════\n');
    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth] ❌ Auth middleware error:', error.message);
    console.error('[Auth] Error stack:', error.stack);
    console.error('[Auth] ════════════════════════════════════════════════════════════════\n');
    res.status(401).json({ 
      message: 'Token is not valid',
      isAuthError: true // Flag to distinguish from shipping errors
    });
  }
};

module.exports = auth;

