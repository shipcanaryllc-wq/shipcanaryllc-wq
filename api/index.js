// Vercel serverless function - Express app entry point
// This file must be in /api directory for Vercel to recognize it

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Load environment variables
require('dotenv').config();

const app = express();

// CORS Configuration - Strict allowlist
const getAllowedOrigins = () => {
  const origins = [];
  
  // Production domains
  if (process.env.NODE_ENV === 'production') {
    // Always allow shipcanary.com domains
    origins.push('https://shipcanary.com');
    origins.push('https://www.shipcanary.com');
    
    // Allow FRONTEND_URL if set
    if (process.env.FRONTEND_URL) {
      origins.push(process.env.FRONTEND_URL);
    }
    
    // Allow Vercel preview deployments (optional, for preview branches)
    // origins.push(/^https:\/\/.*\.vercel\.app$/);
  } else {
    // Development: allow localhost on common ports
    origins.push('http://localhost:3000');
    origins.push('http://localhost:3001');
    origins.push('http://127.0.0.1:3000');
    origins.push('http://127.0.0.1:3001');
  }
  
  return origins.filter(Boolean);
};

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    const allowedOrigins = getAllowedOrigins();
    
    // Check exact matches
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow Vercel preview deployments in production (optional)
    if (process.env.NODE_ENV === 'production' && origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    
    // Reject all other origins
    callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));
app.use(morgan('combined'));

// BTCPay webhook route - MUST be before express.json() to use raw body
const btcpayWebhookHandler = require('../server/controllers/btcpayWebhookController');
app.post('/api/btcpay/webhook', express.raw({ type: 'application/json' }), btcpayWebhookHandler);

// Standard JSON body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration for OAuth
app.use(session({
  secret: process.env.JWT_SECRET || 'shipcanary-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL || process.env.VERCEL_URL || 'http://localhost:5001'}/api/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const User = require('../server/models/User');
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        return done(null, user);
      }
      
      user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        user.googleId = profile.id;
        user.name = profile.displayName;
        user.picture = profile.photos[0]?.value;
        await user.save();
        return done(null, user);
      }
      
      user = new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        picture: profile.photos[0]?.value,
        balance: 10.00,
        isVerified: true
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
      const User = require('../server/models/User');
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}

// Database connection (reuse connection if exists)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shipcanary';

if (!mongoose.connection.readyState) {
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 10000,
    connectTimeoutMS: 10000
  })
  .then(() => {
    console.log('✅ MongoDB connected successfully');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
  });
}

// Import routes
app.use('/api/auth', require('../server/routes/auth'));
app.use('/api/orders', require('../server/routes/orders'));
app.use('/api/addresses', require('../server/routes/addresses'));
app.use('/api/packages', require('../server/routes/packages'));
app.use('/api/payments', require('../server/routes/payments'));
app.use('/api/payments', require('../server/routes/payments-btcpay'));
app.use('/api/deposits', require('../server/routes/deposits'));
app.use('/api/users', require('../server/routes/users'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Export for Vercel serverless
module.exports = app;

