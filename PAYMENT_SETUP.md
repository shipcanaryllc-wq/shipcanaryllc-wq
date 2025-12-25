# Payment Setup Guide

## Stripe Setup (Credit/Debit Cards)

1. **Create a Stripe Account:**
   - Go to https://stripe.com
   - Sign up for a free account
   - Get your API keys from the Dashboard

2. **Add Stripe Keys to `.env`:**
   ```
   STRIPE_SECRET_KEY=sk_test_your-secret-key
   STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key
   ```

3. **Set up Webhook (for production):**
   - In Stripe Dashboard, go to Developers > Webhooks
   - Add endpoint: `https://yourdomain.com/api/payments/webhook`
   - Select event: `checkout.session.completed`
   - Copy the webhook signing secret to `.env`:
     ```
     STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
     ```

4. **Test Mode:**
   - Use test cards: https://stripe.com/docs/testing
   - Test card: `4242 4242 4242 4242`
   - Any future expiry date, any CVC

## Crypto Payment Setup

The crypto payment system currently uses placeholder addresses. For production, integrate with one of these services:

### Option 1: BTCPay Server (Recommended - Self-hosted, Anonymous)
- Self-hosted Bitcoin payment processor
- No KYC required
- Supports Bitcoin, Lightning Network
- Documentation: https://btcpayserver.org/

### Option 2: Coinbase Commerce
- Easy integration
- Supports Bitcoin, Ethereum, USDC, and more
- API: https://commerce.coinbase.com/docs/api/

### Option 3: BitPay
- Enterprise solution
- Supports multiple cryptocurrencies
- API: https://bitpay.com/api

### Implementation Steps:

1. Choose a crypto payment service
2. Update `server/routes/payments.js`:
   - Replace `generateCryptoAddress()` with actual API call
   - Set up webhook handler for payment confirmations
   - Update user balance when payment is confirmed

3. Example for Coinbase Commerce:
   ```javascript
   const coinbase = require('coinbase-commerce-node');
   const Client = coinbase.Client;
   const Charge = coinbase.resources.Charge;
   
   Client.init(process.env.COINBASE_API_KEY);
   
   const charge = await Charge.create({
     name: 'ShipCanary Balance',
     description: `Add $${amount} to account`,
     local_price: {
       amount: amount,
       currency: 'USD'
     },
     pricing_type: 'fixed_price'
   });
   ```

## Payment Flow

1. **Credit Card:**
   - User enters amount
   - Redirects to Stripe Checkout
   - After payment, redirects back with success
   - Balance updates automatically via webhook

2. **Crypto:**
   - User enters amount
   - System generates payment address
   - User sends crypto to address
   - System monitors blockchain (via webhook/service)
   - Balance updates after confirmation

## Testing Payments

- **Stripe Test Mode:** Use test cards from Stripe docs
- **Crypto Test Mode:** Use testnet addresses for development

