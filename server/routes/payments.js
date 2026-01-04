const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Initialize Stripe only if key is provided
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

const crypto = require('crypto');

const router = express.Router();

// Create Stripe payment intent
router.post('/create-intent',
  auth,
  [
    body('amount').isFloat({ min: 5 }).withMessage('Minimum amount is $5')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!stripe) {
        return res.status(500).json({ message: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your .env file' });
      }

      const { amount } = req.body;
      const amountInCents = Math.round(amount * 100);

      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'ShipCanary Account Balance',
                description: `Add $${amount} to your ShipCanary account`,
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?payment=success&amount=${amount}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?payment=cancelled`,
        client_reference_id: req.user._id.toString(),
        metadata: {
          userId: req.user._id.toString(),
          amount: amount.toString()
        }
      });

      res.json({ checkoutUrl: session.url, sessionId: session.id });
    } catch (error) {
      console.error('Stripe error:', error);
      res.status(500).json({ message: 'Failed to create payment session' });
    }
  }
);

// Stripe webhook handler (for production)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ message: 'Stripe is not configured' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).json({ message: 'Webhook secret not configured' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;
    const amount = parseFloat(session.metadata.amount);

    try {
      const user = await User.findById(userId);
      if (user) {
        user.balance += amount;
        await user.save();
        console.log(`Added $${amount} to user ${userId}`);
      }
    } catch (error) {
      console.error('Error updating user balance:', error);
    }
  }

  res.json({ received: true });
});

// LEGACY ROUTE DISABLED: This route generated placeholder addresses and is NOT used.
// All BTC payments MUST go through BTCPay Server using the configured store's xpub derivation scheme.
// Use POST /api/payments/create (BTCPay route) instead.
router.post('/create-crypto',
  auth,
  [
    body('amount').isFloat({ min: 5 }).withMessage('Minimum amount is $5'),
    body('currency').isIn(['BTC', 'ETH']).withMessage('Currency must be BTC or ETH')
  ],
  async (req, res) => {
    console.warn('[Payment Security] ⚠️  Legacy /create-crypto route called - DISABLED');
    console.warn('  All BTC payments must use BTCPay Server via /api/payments/create');
    console.warn('  This ensures addresses are derived from the configured store xpub only');
    return res.status(410).json({ 
      message: 'This endpoint has been disabled. Use /api/payments/create for BTCPay Server integration.',
      error: 'LEGACY_ROUTE_DISABLED',
      useInstead: '/api/payments/create'
    });
  }
);

// Helper function DISABLED - placeholder address generation removed for security
// All addresses MUST come from BTCPay Server store's configured derivation scheme
function generateCryptoAddress(currency, paymentId) {
  throw new Error('Placeholder address generation is disabled. Use BTCPay Server integration.');
}

// Verify crypto payment (would be called by webhook from crypto service)
router.post('/verify-crypto',
  auth,
  async (req, res) => {
    try {
      const { paymentId, transactionHash } = req.body;

      // In production, verify the transaction with blockchain
      // For now, this is a placeholder
      // You would:
      // 1. Check transaction on blockchain
      // 2. Verify amount matches
      // 3. Update user balance
      // 4. Mark payment as completed

      res.json({ message: 'Payment verification endpoint - integrate with crypto service' });
    } catch (error) {
      console.error('Crypto verification error:', error);
      res.status(500).json({ message: 'Failed to verify payment' });
    }
  }
);

module.exports = router;

