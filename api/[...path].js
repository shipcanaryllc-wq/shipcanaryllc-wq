// Vercel serverless function wrapper for Express app
// This catches all /api/* routes and forwards them to Express

// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
const session = require('express-session');
const path = require('path');

// Initialize Express app
const app = express();

// CORS Configuration for Vercel
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      'https://shipcanary.com',
      'https://www.shipcanary.com',
      process.env.FRONTEND_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
    ].filter(Boolean)
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
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

// BTCPay webhook route - MUST be before express.json() to use raw body for HMAC verification
const btcpayWebhookHandler = require('../server/controllers/btcpayWebhookController');
app.post('/btcpay/webhook', express.raw({ type: 'application/json' }), btcpayWebhookHandler);

// Standard JSON body parser for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration for OAuth (simplified for serverless)
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

// Database connection (reuse connection if exists)
let mongooseConnection = null;

const connectDB = async () => {
  if (mongooseConnection && mongoose.connection.readyState === 1) {
    return mongooseConnection;
  }
  
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shipcanary';
  
  try {
    mongooseConnection = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    console.log('✅ MongoDB connected');
    return mongooseConnection;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    throw err;
  }
};

// Configure Passport Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.BACKEND_URL || 'http://localhost:5001'}/api/auth/google/callback`
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

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes (mounted at /api since Vercel routes /api/* to this function)
app.use('/auth', require('../server/routes/auth'));
app.use('/addresses', require('../server/routes/addresses'));
app.use('/packages', require('../server/routes/packages'));
app.use('/orders', require('../server/routes/orders'));
app.use('/users', require('../server/routes/users'));
app.use('/payments', require('../server/routes/payments'));
app.use('/payments/btcpay', require('../server/routes/payments-btcpay'));
app.use('/deposits', require('../server/routes/deposits'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Vercel serverless function handler
// Vercel passes requests to /api/* to this function, so we need to strip /api prefix
module.exports = async (req, res) => {
  // Connect to database
  try {
    await connectDB();
  } catch (err) {
    return res.status(503).json({ message: 'Database connection failed' });
  }
  
  // Vercel already routes /api/* to this function, so strip /api from path
  // The path comes as /api/auth/login, but our routes expect /auth/login
  const originalUrl = req.url;
  if (originalUrl.startsWith('/api/')) {
    req.url = originalUrl.replace(/^\/api/, '') || '/';
  }
  
  // Handle the request with Express
  return app(req, res);
};

