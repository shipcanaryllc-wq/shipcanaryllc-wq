// 1) Backend ONLY: Load dotenv at the very top BEFORE any other imports
const dotenv = require('dotenv');
const path = require('path');

// Load .env from server directory (where this file is located)
// This ensures it works regardless of where the process is started from
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

console.log('[STARTUP] Loading .env from:', envPath);
console.log('[STARTUP] Current working directory:', process.cwd());
console.log('[STARTUP] __dirname:', __dirname);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
const session = require('express-session');

// 2) Add startup assertions (backend)
const k = (process.env.SHIPLABEL_API_KEY || '').trim();
if (!k || k === 'undefined') {
  console.error('❌ FATAL ERROR: SHIPLABEL_API_KEY missing');
  console.error('   Set SHIPLABEL_API_KEY in server/.env file');
  console.error('   Key length:', k.length);
  console.error('   .env file path:', envPath);
  console.error('   File exists:', require('fs').existsSync(envPath));
  process.exit(1);
}
console.log('✅ SHIPLABEL_API_KEY loaded');
console.log('   Key length:', k.length);

// Email configuration validation
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
if (!RESEND_API_KEY || !EMAIL_FROM) {
  console.error('\n═══════════════════════════════════════════════════════════');
  console.error('⚠️  EMAIL NOT CONFIGURED: missing RESEND_API_KEY or EMAIL_FROM');
  console.error('═══════════════════════════════════════════════════════════');
  console.error('   Set RESEND_API_KEY in server/.env file');
  console.error('   Set EMAIL_FROM in server/.env file (e.g., onboarding@resend.dev)');
  console.error('   Password reset emails will fail until configured.');
  console.error('═══════════════════════════════════════════════════════════\n');
} else {
  console.log('✅ Email service configured');
  console.log('   RESEND_API_KEY: loaded');
  console.log('   EMAIL_FROM:', EMAIL_FROM);
}

// BTCPay configuration validation
const { normalizeBtcpayUrl, runSelfCheck } = require('./utils/normalizeBtcpayUrl');

// Run self-check in development mode
if (process.env.NODE_ENV !== 'production') {
  runSelfCheck();
}

let BTCPAY_URL_NORMALIZED;
const BTCPAY_URL_RAW = process.env.BTCPAY_URL;
const BTCPAY_API_KEY = process.env.BTCPAY_API_KEY;
const BTCPAY_STORE_ID = process.env.BTCPAY_STORE_ID;

if (!BTCPAY_URL_RAW || !BTCPAY_API_KEY || !BTCPAY_STORE_ID) {
  console.warn('\n═══════════════════════════════════════════════════════════');
  console.warn('⚠️  BTCPAY NOT FULLY CONFIGURED');
  console.warn('═══════════════════════════════════════════════════════════');
  if (!BTCPAY_URL_RAW) console.warn('   Missing: BTCPAY_URL');
  if (!BTCPAY_API_KEY) console.warn('   Missing: BTCPAY_API_KEY');
  if (!BTCPAY_STORE_ID) console.warn('   Missing: BTCPAY_STORE_ID');
  console.warn('   Bitcoin payments will fail until configured.');
  console.warn('═══════════════════════════════════════════════════════════\n');
} else {
  try {
    BTCPAY_URL_NORMALIZED = normalizeBtcpayUrl(BTCPAY_URL_RAW);
    console.log('✅ BTCPay configured');
    console.log('   BTCPAY_URL (raw):', BTCPAY_URL_RAW.substring(0, 50) + (BTCPAY_URL_RAW.length > 50 ? '...' : ''));
    console.log('   BTCPAY_URL (normalized):', BTCPAY_URL_NORMALIZED);
    console.log('   BTCPAY_STORE_ID:', BTCPAY_STORE_ID);
    console.log('   BTCPAY_API_KEY: loaded (not logged for security)');
  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════════════');
    console.error('❌ BTCPAY_URL VALIDATION FAILED');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('   Error:', error.message);
    console.error('   Raw value:', BTCPAY_URL_RAW);
    console.error('   Please fix BTCPAY_URL in Fly secrets:');
    console.error('   fly secrets set BTCPAY_URL=https://btcpay483258.lndyn.com -a shipcanary-api');
    console.error('═══════════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

const app = express();

// B) CORS Configuration - Strict allowlist
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

// Handle OPTIONS preflight requests explicitly
app.options('*', cors(corsOptions));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Disable CSP for development
}));
app.use(morgan('combined'));

// BTCPay webhook route - MUST be before express.json() to use raw body for HMAC verification
const btcpayWebhookHandler = require('./controllers/btcpayWebhookController');
app.post('/api/btcpay/webhook', express.raw({ type: 'application/json' }), btcpayWebhookHandler);

// Standard JSON body parser for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration for OAuth
app.use(session({
  secret: process.env.JWT_SECRET || 'shipcanary-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Cross-origin in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shipcanary';

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 10000,
  connectTimeoutMS: 10000
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log(`   - Database: ${mongoose.connection.name}`);
  console.log(`   - Connection state: ${mongoose.connection.readyState} (1=connected)`);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('💡 Possible issues:');
  console.error('   1. Cluster might be paused - check MongoDB Atlas dashboard');
  console.error('   2. IP not whitelisted - check Network Access in Atlas');
  console.error('   3. Wrong password in connection string');
  console.error('   4. Network/firewall blocking connection');
  console.error('💡 Check your cluster status: https://cloud.mongodb.com/');
  console.error('💡 Connection string (masked):', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
  // Don't exit - let the server start but routes will fail gracefully
});

// Log MongoDB connection state changes
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

// ============================================================================
// A) INSTRUMENTATION: Log Authorization header BEFORE routes
// ============================================================================
app.use('/api/orders', (req, res, next) => {
  console.log('\n[REQUEST LOGGER] ════════════════════════════════════════════════════════════════');
  console.log('[REQUEST LOGGER] 📥 INCOMING REQUEST TO /api/orders');
  console.log('[REQUEST LOGGER] ════════════════════════════════════════════════════════════════');
  console.log('[REQUEST LOGGER] Method:', req.method);
  console.log('[REQUEST LOGGER] Path:', req.path);
  console.log('[REQUEST LOGGER] URL:', req.url);
  
  // Check Authorization header (case-insensitive)
  const authHeader = req.headers.authorization || req.headers.Authorization;
  console.log('[REQUEST LOGGER] Authorization header present:', !!authHeader);
  if (authHeader) {
    console.log('[REQUEST LOGGER] Authorization header (first 30 chars):', authHeader.substring(0, 30) + '...');
    console.log('[REQUEST LOGGER] Authorization header length:', authHeader.length);
    console.log('[REQUEST LOGGER] Starts with "Bearer ":', authHeader.startsWith('Bearer ') || authHeader.startsWith('bearer '));
  } else {
    console.error('[REQUEST LOGGER] ❌ Authorization header MISSING!');
    console.error('[REQUEST LOGGER] All headers:', JSON.stringify(req.headers, null, 2));
  }
  console.log('[REQUEST LOGGER] ════════════════════════════════════════════════════════════════\n');
  next();
});

// Static file serving for uploads (local storage fallback)
// WARNING: This won't persist on Railway/Render unless using persistent volumes
const uploadsPath = path.join(__dirname, 'uploads');
if (require('fs').existsSync(uploadsPath)) {
  app.use('/uploads', express.static(uploadsPath));
  console.log('[STARTUP] Static uploads folder enabled:', uploadsPath);
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/addresses', require('./routes/addresses'));
app.use('/api/packages', require('./routes/packages'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/payments', require('./routes/payments-btcpay'));
app.use('/api/deposits', require('./routes/deposits'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/test', require('./routes/test-btcpay')); // Test endpoint for BTCPay verification

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ShipCanary API is running' });
});

// 6) Debug endpoint to verify env vars are loaded
// GET /api/debug/env (protected with auth middleware)
app.get('/api/debug/env', require('./middleware/auth'), (req, res) => {
  const k = process.env.SHIPLABEL_API_KEY || '';
  res.json({
    shiplabelKeyLength: k.length || 0,
    baseUrl: process.env.SHIPLABEL_BASE_URL || null,
    hasKey: Boolean(k),
    // keyPreview removed for security
    workingDir: process.cwd(),
    envFile: path.join(__dirname, '.env'),
    envFileExists: require('fs').existsSync(path.join(__dirname, '.env'))
  });
});

// 1) DEV-ONLY public debug route (NO secrets)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/debug/env-public', (req, res) => {
    const k = process.env.SHIPLABEL_API_KEY || '';
    res.json({
      shiplabelKeyLength: k.length || 0,
      hasShiplabelKey: Boolean(k),
      shiplabelBaseUrl: process.env.SHIPLABEL_BASE_URL || 'https://www.shiplabel.net/api/v2',
      nodeEnv: process.env.NODE_ENV || 'development',
      cwd: process.cwd(),
      dirname: __dirname,
    });
  });

  // Test email endpoint (DEV ONLY)
  app.post('/api/debug/test-email', express.json(), async (req, res) => {
    try {
      const { to } = req.body;
      
      if (!to || !to.includes('@')) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid email address. Provide { "to": "email@example.com" }' 
        });
      }

      const { sendEmail, isEmailConfigured } = require('./services/emailService');
      
      if (!isEmailConfigured()) {
        return res.status(503).json({ 
          success: false, 
          error: 'Email service not configured. Set RESEND_API_KEY and EMAIL_FROM in .env' 
        });
      }

      const result = await sendEmail({
        to,
        subject: 'Test Email from ShipCanary',
        html: '<p>This is a <strong>test email</strong> from ShipCanary.</p><p>If you received this, email sending is working correctly!</p>',
        text: 'This is a test email from ShipCanary. If you received this, email sending is working correctly!',
      });

      console.log('[DEBUG] Test email sent successfully. Resend ID:', result.id || result.messageId);
      res.json({ 
        success: true, 
        id: result.id || result.messageId,
        messageId: result.id || result.messageId,
        message: 'Test email sent successfully. Check your inbox.' 
      });
    } catch (error) {
      console.error('❌ Test email failed:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
}

// Debug email route protected by DEBUG_TOKEN (works in all environments)
app.post('/api/debug/email', express.json(), async (req, res) => {
  try {
    const debugToken = req.headers['x-debug-token'] || req.body.debugToken;
    const expectedToken = process.env.DEBUG_TOKEN;

    if (!expectedToken) {
      return res.status(503).json({ 
        ok: false, 
        error: 'DEBUG_TOKEN not configured' 
      });
    }

    if (debugToken !== expectedToken) {
      return res.status(401).json({ 
        ok: false, 
        error: 'UNAUTHORIZED',
        details: 'Invalid DEBUG_TOKEN' 
      });
    }

    const { to } = req.body;
    
    if (!to || !to.includes('@')) {
      return res.status(400).json({ 
        ok: false, 
        error: 'INVALID_EMAIL',
        details: 'Provide { "to": "email@example.com" }' 
      });
    }

    const { sendEmail, isEmailConfigured } = require('./services/emailService');
    
    if (!isEmailConfigured()) {
      return res.status(503).json({ 
        ok: false, 
        error: 'EMAIL_NOT_CONFIGURED',
        details: 'Set RESEND_API_KEY and EMAIL_FROM in environment variables' 
      });
    }

    console.log('[DEBUG-EMAIL] Sending test email', { to });

    const result = await sendEmail({
      to,
      subject: 'Debug Test Email from ShipCanary',
      html: '<p>This is a <strong>debug test email</strong> from ShipCanary.</p><p>If you received this, Resend integration is working correctly!</p>',
      text: 'This is a debug test email from ShipCanary. If you received this, Resend integration is working correctly!',
    });

    console.log('[DEBUG-EMAIL] Resend response', { 
      id: result.id || result.messageId,
      success: result.success 
    });

    res.json({ 
      ok: true, 
      messageId: result.id || result.messageId,
      id: result.id || result.messageId,
      message: 'Test email sent successfully. Check your inbox.' 
    });
  } catch (error) {
    console.error('[DEBUG-EMAIL] Failed', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      ok: false, 
      error: 'EMAIL_SEND_FAILED',
      details: error.message 
    });
  }
});

// 2) DEV-ONLY ShipLabel connectivity test route (NO secrets)
if (process.env.NODE_ENV !== 'production') {
  const { shiplabel } = require('./services/shiplabelClient');
  app.get('/api/debug/shiplabel-services-public', async (req, res) => {
    try {
      const r = await shiplabel.post('/services', {});
      
      // Parse labels using normalization helper
      const { normalizeShipLabelServicesResponse } = require('./services/shippingService');
      const labels = normalizeShipLabelServicesResponse(r.data);
      
      res.json({
        status: r.status,
        hasLabels: labels.length > 0,
        labelCount: labels.length,
        firstLabel: labels[0] ? { id: labels[0].id, name: labels[0].name } : null,
        rawShapePreview: JSON.stringify(r.data).slice(0, 200),
      });
    } catch (e) {
      res.status(502).json({
        message: 'ShipLabel connectivity failed',
        status: e.response?.status || null,
        bodyPreview: e.response?.data ? JSON.stringify(e.response.data).slice(0, 300) : null,
      });
    }
  });

  // DEV-ONLY endpoint to test ShipLabel auth with raw request
  app.get('/api/debug/shiplabel-auth-test', async (req, res) => {
    try {
      const { shiplabel } = require('./services/shiplabelClient');
      const axios = require('axios');
      
      // Test 1: Using our client (Bearer format)
      console.log('\n[TEST] Test 1: Using shiplabel client with Bearer token');
      try {
        const r1 = await shiplabel.post('/services', {});
        console.log('[TEST] ✅ Test 1 SUCCESS:', r1.status);
      } catch (e1) {
        console.log('[TEST] ❌ Test 1 FAILED:', e1.response?.status, e1.response?.data);
      }
      
      // Test 2: Direct axios call with Bearer
      console.log('\n[TEST] Test 2: Direct axios call with Bearer token');
      const apiKey = (process.env.SHIPLABEL_API_KEY || '').trim();
      try {
        const r2 = await axios.post('https://www.shiplabel.net/api/v2/services', {}, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('[TEST] ✅ Test 2 SUCCESS:', r2.status);
      } catch (e2) {
        console.log('[TEST] ❌ Test 2 FAILED:', e2.response?.status, e2.response?.data);
      }
      
      // Test 3: Direct axios call WITHOUT Bearer (just the key)
      console.log('\n[TEST] Test 3: Direct axios call WITHOUT Bearer (key only)');
      try {
        const r3 = await axios.post('https://www.shiplabel.net/api/v2/services', {}, {
          headers: {
            'Authorization': apiKey,
            'Content-Type': 'application/json'
          }
        });
        console.log('[TEST] ✅ Test 3 SUCCESS:', r3.status);
      } catch (e3) {
        console.log('[TEST] ❌ Test 3 FAILED:', e3.response?.status, e3.response?.data);
      }
      
      // Test 4: Using X-API-Key header
      console.log('\n[TEST] Test 4: Using X-API-Key header');
      try {
        const r4 = await axios.post('https://www.shiplabel.net/api/v2/services', {}, {
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json'
          }
        });
        console.log('[TEST] ✅ Test 4 SUCCESS:', r4.status);
      } catch (e4) {
        console.log('[TEST] ❌ Test 4 FAILED:', e4.response?.status, e4.response?.data);
      }
      
      res.json({
        message: 'Check server console logs for test results',
        apiKeyLength: apiKey?.length || 0
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // DEV-ONLY endpoint to test create-order end-to-end
  app.get('/api/debug/shiplabel-create-order-public', async (req, res) => {
    try {
      // Import normalization helpers
      const { normalizeShipLabelServicesResponse, normalizeShipLabelCreateOrderResponse } = require('./services/shippingService');
      
      // Step 1: Get first label ID from /services
      const servicesRes = await shiplabel.post('/services', {});
      
      // Parse labels using normalization helper
      const labels = normalizeShipLabelServicesResponse(servicesRes.data);
      
      if (labels.length === 0) {
        return res.status(502).json({
          message: 'No labels available from /services',
          status: servicesRes.status,
          bodyPreview: JSON.stringify(servicesRes.data).slice(0, 800),
        });
      }
      
      // ONLY use label ID 369 ($1.40 one)
      const label369 = labels.find(l => String(l.id) === '369');
      if (!label369) {
        return res.status(502).json({
          message: 'Label ID 369 not available from ShipLabel services',
          status: servicesRes.status,
          availableLabels: labels.map(l => ({ id: l.id, name: l.name })),
          bodyPreview: JSON.stringify(servicesRes.data).slice(0, 800),
        });
      }
      
      const labelId = String(label369.id);
      
      // Step 2: Call /create-order with hardcoded payload
      const payload = {
        label_id: labelId,
        fromName: "Test Sender",
        fromCompany: "ShipCanary",
        fromAddress: "123 Main Street",
        fromAddress2: "",
        fromZip: "10001",
        fromState: "NY",
        fromCity: "New York",
        fromCountry: "US",
        toName: "Test Receiver",
        toCompany: "ShipCanary",
        toAddress: "456 Elm Street",
        toAddress2: "",
        toZip: "90001",
        toState: "CA",
        toCity: "Los Angeles",
        toCountry: "US",
        weight: 1.0,
        length: 10.0,
        height: 5.0,
        width: 3.0,
        reference_1: "DEBUG",
        reference_2: "DEBUG",
        discription: "Debug shipment"
      };
      
      // Add detailed logging before create-order call
      console.log('[DEBUG] About to call /create-order');
      console.log('[DEBUG] Base URL:', shiplabel.defaults.baseURL);
      console.log('[DEBUG] Full URL will be:', shiplabel.defaults.baseURL + '/create-order');
      console.log('[DEBUG] Auth header present:', !!shiplabel.defaults.headers.Authorization);
      console.log('[DEBUG] Auth header value (first 30 chars):', shiplabel.defaults.headers.Authorization?.slice(0, 30) + '...');
      console.log('[DEBUG] Payload:', JSON.stringify(payload, null, 2));
      
      const createOrderRes = await shiplabel.post('/create-order', payload);
      
      // Step 3: Parse create-order response using normalization helper
      const { ok } = normalizeShipLabelCreateOrderResponse(createOrderRes.data);
      
      res.json({
        status: createOrderRes.status,
        ok: ok,
        labelId: labelId,
        bodyPreview: JSON.stringify(createOrderRes.data).slice(0, 800),
      });
    } catch (e) {
      // Step 4: If create-order fails, return 502 with error details
      res.status(502).json({
        message: 'ShipLabel create-order failed',
        status: e.response?.status || null,
        bodyPreview: e.response?.data ? JSON.stringify(e.response.data).slice(0, 800) : null,
      });
    }
  });
}

const PORT = Number(process.env.PORT) || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});


