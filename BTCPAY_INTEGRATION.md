# BTCPay Server Payment Integration

This document describes the production-ready BTCPay Server payment integration with third-party fiat→crypto on-ramp support.

## Architecture Overview

The payment flow follows this architecture:

1. **User initiates payment** → Creates BTCPay invoice via our backend
2. **User pays invoice** → Either:
   - Directly with existing crypto (via BTCPay checkout)
   - Buys crypto first via on-ramp widget, then pays invoice
3. **BTCPay webhook** → Notifies our backend when payment is confirmed
4. **Backend updates** → User balance updated, access granted

### Key Constraints

- ✅ **Backend ONLY talks to BTCPay** - No direct card processing
- ✅ **On-ramp is frontend-only** - User handles fiat/KYC separately
- ✅ **No KYC for merchant** - Users handle KYC with on-ramp provider
- ✅ **Webhook verification** - All webhooks are cryptographically verified

## Setup Instructions

### 1. BTCPay Server Configuration

1. **Set up BTCPay Server** (self-hosted or use BTCPay.org)
   - Create a store
   - Generate an API key with the following permissions:
     - `btcpay.store.canviewinvoices` (required)
     - `btcpay.store.cancreateinvoice` (required)
     - `btcpay.store.canmodifyinvoices` (optional, for updating invoices)
   - **Note**: You do NOT need `btcpay.store.webhooks.canmodifywebhooks` unless you want to manage webhooks via API
   - Note your Store ID

2. **Configure Webhook** (via BTCPay Server UI):
   - In BTCPay Server, go to **Store Settings → Webhooks**
   - Click **"Create a new webhook"**
   - Set webhook URL: `https://yourdomain.com/api/payments/btcpay-webhook`
     - For local development: Use a service like ngrok to expose `http://localhost:5001/api/payments/btcpay-webhook`
   - Select events: **InvoiceSettled**, **InvoiceProcessing**, **InvoiceExpired**, **InvoiceInvalid**
   - Set webhook secret (save this for `.env` as `BTCPAY_WEBHOOK_SECRET`)
   - **Alternative**: If you want to manage webhooks via API, you'll need `btcpay.store.webhooks.canmodifywebhooks` permission

3. **Add to `.env` file**:
   ```env
   BTCPAY_URL=https://btcpay.yourserver.com
   BTCPAY_API_KEY=your-api-key-here
   BTCPAY_STORE_ID=your-store-id-here
   BTCPAY_WEBHOOK_SECRET=your-webhook-secret-here
   ```

### 2. On-Ramp Provider Setup (Optional)

For users who don't have cryptocurrency, you can integrate a third-party on-ramp:

**MoonPay**:
1. Sign up at https://www.moonpay.com/
2. Get API key
3. Add to `.env`:
   ```env
   REACT_APP_ONRAMP_PROVIDER=moonpay
   REACT_APP_ONRAMP_API_KEY=your-moonpay-api-key
   ```

**Ramp**:
1. Sign up at https://ramp.network/
2. Get API key
3. Add to `.env`:
   ```env
   REACT_APP_ONRAMP_PROVIDER=ramp
   REACT_APP_ONRAMP_API_KEY=your-ramp-api-key
   ```

**Note**: The on-ramp widget currently has placeholder implementations. See `OnRampWidget.js` for TODO comments on integrating specific providers.

## Database Schema

### Payment Model

```javascript
{
  userId: ObjectId,           // User who made the payment
  btcpayInvoiceId: String,    // BTCPay invoice ID (unique)
  btcpayCheckoutUrl: String,  // URL to BTCPay checkout page
  amount: Number,             // Payment amount
  currency: String,           // USD, EUR, BTC, etc.
  status: String,            // PENDING, PAID, CONFIRMED, EXPIRED, FAILED
  orderId: ObjectId,         // Optional: link to order
  metadata: Map,             // Additional metadata
  btcpayStatus: String,      // Raw BTCPay status
  btcpayExceptionStatus: String, // BTCPay exception status
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### POST `/api/payments/create`

Creates a new BTCPay invoice.

**Authentication**: Required

**Request Body**:
```json
{
  "amount": 10.00,
  "currency": "USD",
  "metadata": {
    "source": "checkout_page"
  }
}
```

**Response**:
```json
{
  "paymentId": "payment_id_here",
  "btcpayInvoiceId": "btcpay_invoice_id",
  "btcpayCheckoutUrl": "https://btcpay.../i/invoice_id",
  "amount": 10.00,
  "currency": "USD"
}
```

### GET `/api/payments/:paymentId`

Gets payment status and details.

**Authentication**: Required (only owner can access)

**Response**:
```json
{
  "paymentId": "payment_id_here",
  "btcpayInvoiceId": "btcpay_invoice_id",
  "btcpayCheckoutUrl": "https://btcpay.../i/invoice_id",
  "amount": 10.00,
  "currency": "USD",
  "status": "CONFIRMED",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:05:00.000Z"
}
```

### POST `/api/payments/btcpay-webhook`

BTCPay Server webhook endpoint. **Do not call directly** - this is called by BTCPay Server.

**Authentication**: Verified via HMAC signature

**Process**:
1. Verifies webhook signature
2. Updates payment status in database
3. If status becomes CONFIRMED, updates user balance
4. Triggers any additional actions (activate subscriptions, etc.)

## Frontend Routes

### `/checkout`

Checkout page where users enter payment amount and create BTCPay invoice.

### `/checkout/:paymentId`

Payment detail page showing:
- BTCPay checkout link/iframe
- Payment status with real-time polling
- On-ramp widget button (if user doesn't have crypto)
- Success/error states

## Payment Status Flow

```
PENDING → PAID → CONFIRMED
   ↓        ↓
EXPIRED  FAILED
```

- **PENDING**: Invoice created, waiting for payment
- **PAID**: Payment received, waiting for blockchain confirmation
- **CONFIRMED**: Payment confirmed (enough confirmations), balance updated
- **EXPIRED**: Invoice expired without payment
- **FAILED**: Payment failed or invalid

## Security Features

1. **Webhook Signature Verification**: All webhooks are verified using HMAC-SHA256
2. **User Isolation**: Users can only access their own payments
3. **Idempotent Webhooks**: Multiple webhook calls don't cause duplicate updates
4. **No Secret Logging**: API keys and secrets are never logged
5. **Status Verification**: Frontend polls backend, never trusts client-side state

## Testing

### Local Development

1. **Mock BTCPay** (for testing without real BTCPay):
   - You can temporarily modify `btcpay.js` to return mock data
   - Or use BTCPay's testnet mode

2. **Test Webhook**:
   ```bash
   curl -X POST http://localhost:5001/api/payments/btcpay-webhook \
     -H "Content-Type: application/json" \
     -H "BTCPay-Sig: sha256=..." \
     -d '{"id":"test_invoice","status":"Settled"}'
   ```

### Production Checklist

- [ ] BTCPay Server configured and accessible
- [ ] Webhook URL is publicly accessible
- [ ] Webhook secret is set and secure
- [ ] API key has correct permissions
- [ ] Store ID is correct
- [ ] Frontend environment variables set
- [ ] On-ramp provider integrated (if using)
- [ ] Error handling tested
- [ ] Webhook signature verification tested

## Troubleshooting

### "BTCPay configuration missing"
- Check that all BTCPay environment variables are set in `server/.env`

### "Invalid webhook signature"
- Verify `BTCPAY_WEBHOOK_SECRET` matches the secret in BTCPay Server
- Check that webhook payload is not being modified (e.g., by proxy)

### "Payment not found" in webhook
- Ensure payment was created before webhook is sent
- Check that `btcpayInvoiceId` matches between invoice creation and webhook

### On-ramp widget not working
- Check provider API key is set in frontend `.env`
- See `OnRampWidget.js` for provider-specific integration TODOs
- Ensure provider allows your domain in CORS settings

## Next Steps

1. **Integrate On-Ramp Providers**: Complete the TODO sections in `OnRampWidget.js` for MoonPay/Ramp/Transak
2. **Add Subscription Support**: Link payments to subscription models
3. **Add Order Linking**: Connect payments to shipping orders
4. **Email Notifications**: Send confirmation emails on payment success
5. **Admin Dashboard**: Add payment management interface
6. **Analytics**: Track payment success rates, average amounts, etc.

## Files Created/Modified

### Backend
- `server/models/Payment.js` - Payment database model
- `server/services/btcpay.js` - BTCPay API integration service
- `server/routes/payments-btcpay.js` - Payment API routes
- `server/index.js` - Added BTCPay routes

### Frontend
- `client/src/components/Checkout/Checkout.js` - Checkout page
- `client/src/components/Checkout/Checkout.css` - Checkout styles
- `client/src/components/Checkout/PaymentDetail.js` - Payment detail page with polling
- `client/src/components/Checkout/PaymentDetail.css` - Payment detail styles
- `client/src/components/Checkout/OnRampWidget.js` - On-ramp widget component
- `client/src/components/Checkout/OnRampWidget.css` - On-ramp widget styles
- `client/src/App.js` - Added checkout routes

### Configuration
- `server/env.example` - Added BTCPay environment variables

