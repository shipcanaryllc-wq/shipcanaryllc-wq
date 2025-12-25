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

// Create crypto payment address
router.post('/create-crypto',
  auth,
  [
    body('amount').isFloat({ min: 5 }).withMessage('Minimum amount is $5'),
    body('currency').isIn(['BTC', 'ETH']).withMessage('Currency must be BTC or ETH')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { amount, currency } = req.body;

      // Generate a unique payment address
      // In production, you would integrate with a crypto payment processor like:
      // - BTCPay Server
      // - Coinbase Commerce
      // - BitPay
      // - Or your own Bitcoin/Ethereum node
      
      // For now, we'll generate a placeholder address
      // In production, this should call your crypto payment service API
      const paymentId = crypto.randomBytes(16).toString('hex');
      const address = generateCryptoAddress(currency, paymentId);

      // Store pending payment (you'd want a Payment model for this)
      // For now, we'll just return the address
      // In production, store: userId, amount, currency, address, paymentId, status: 'pending'

      res.json({
        address,
        paymentId,
        amount,
        currency,
        message: 'Send the exact amount to this address. Your balance will update after confirmation.'
      });
    } catch (error) {
      console.error('Crypto payment error:', error);
      res.status(500).json({ message: 'Failed to generate crypto address' });
    }
  }
);

// Helper function to generate crypto address (placeholder)
// In production, integrate with actual crypto payment service
function generateCryptoAddress(currency, paymentId) {
  // This is a placeholder - in production, use a real crypto payment service
  // Example services: BTCPay Server, Coinbase Commerce API, BitPay
  
  if (currency === 'BTC') {
    // Placeholder Bitcoin address format
    return `bc1q${paymentId.substring(0, 40)}`;
  } else if (currency === 'ETH') {
    // Placeholder Ethereum address format
    return `0x${paymentId.substring(0, 40)}`;
  }
  
  return `crypto_${paymentId}`;
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

