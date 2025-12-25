# BTCPay Server Setup Guide - Step by Step

This guide will walk you through setting up BTCPay Server for ShipCanary payments.

## Step 1: Choose Your BTCPay Server Option

You have three options:

### Option A: Use BTCPay.org (Easiest - Recommended for Testing)
- **URL**: https://btcpay.org/
- **Pros**: Free, no server management, quick setup
- **Cons**: Limited customization, shared infrastructure
- **Best for**: Testing, development, small projects

### Option B: Self-Host BTCPay Server
- **URL**: https://docs.btcpayserver.org/Docker/
- **Pros**: Full control, customizable
- **Cons**: Requires server management, technical setup
- **Best for**: Production, high volume

### Option C: Use a Hosted BTCPay Service
- Examples: BTCPayServer.com, various hosting providers
- **Pros**: Managed service, good support
- **Cons**: Monthly cost
- **Best for**: Production without server management

**For this guide, we'll assume you're using BTCPay.org or a self-hosted instance.**

---

## Step 2: Create a Store in BTCPay Server

1. **Log in to your BTCPay Server** (or create an account at https://btcpay.org/)
2. **Go to Stores** (in the top navigation)
3. **Click "Create Store"**
4. **Fill in the store details**:
   - Store Name: `ShipCanary` (or your preferred name)
   - Default Currency: `USD`
   - Other settings: Use defaults for now
5. **Click "Create"**
6. **Note your Store ID**: 
   - After creating, you'll see the store page
   - The Store ID is in the URL: `https://your-btcpay.com/stores/{STORE_ID}`
   - Or go to **Store Settings → General** - the Store ID is shown there
   - **Save this Store ID** - you'll need it for `BTCPAY_STORE_ID`

---

## Step 3: Generate API Key

1. **In your BTCPay Server**, go to **Account → Manage Account → API Keys**
2. **Click "Create API Key"**
3. **Fill in the details**:
   - Label: `ShipCanary API Key` (or any name you prefer)
   - **Permissions**: Select the following:
     - ✅ `btcpay.store.canviewinvoices` (View invoices)
     - ✅ `btcpay.store.cancreateinvoice` (Create invoices)
     - ✅ `btcpay.store.canmodifyinvoices` (Optional: Modify invoices)
   - **Store**: Select your ShipCanary store
4. **Click "Generate API Key"**
5. **IMPORTANT**: Copy the API key immediately - you won't be able to see it again!
   - It will look like: `your-long-api-key-string-here`
   - **Save this** - you'll need it for `BTCPAY_API_KEY`

---

## Step 4: Get Your BTCPay Server URL

1. **Note your BTCPay Server base URL**:
   - If using BTCPay.org: `https://your-store.btcpay.org`
   - If self-hosted: `https://your-domain.com` or `https://btcpay.yourdomain.com`
   - **Save this** - you'll need it for `BTCPAY_URL`
   - Make sure it doesn't have a trailing slash: `https://btcpay.example.com` ✅ (not `https://btcpay.example.com/` ❌)

---

## Step 5: Set Up Webhook

### For Production (Public URL):

1. **In BTCPay Server**, go to **Store Settings → Webhooks**
2. **Click "Create a new webhook"**
3. **Configure the webhook**:
   - **Payload URL**: `https://yourdomain.com/api/payments/btcpay-webhook`
     - Replace `yourdomain.com` with your actual domain
     - Example: `https://shipcanary.com/api/payments/btcpay-webhook`
   - **Events**: Select these events:
     - ✅ `InvoiceSettled` (Payment confirmed)
     - ✅ `InvoiceProcessing` (Payment received, waiting for confirmation)
     - ✅ `InvoiceExpired` (Invoice expired)
     - ✅ `InvoiceInvalid` (Payment failed)
   - **Secret**: 
     - BTCPay will generate a secret automatically
     - **Copy this secret** - you'll need it for `BTCPAY_WEBHOOK_SECRET`
     - It will look like: `your-webhook-secret-string`
4. **Click "Create webhook"**

### For Local Development (Using ngrok):

If you're testing locally, you need to expose your local server:

1. **Install ngrok** (if not already installed):
   ```bash
   # macOS
   brew install ngrok
   
   # Or download from https://ngrok.com/download
   ```

2. **Start your ShipCanary server**:
   ```bash
   cd server
   npm start
   ```

3. **In a new terminal, start ngrok**:
   ```bash
   ngrok http 5001
   ```

4. **Copy the HTTPS URL** from ngrok (e.g., `https://abc123.ngrok.io`)

5. **In BTCPay Server**, create webhook with URL:
   - `https://abc123.ngrok.io/api/payments/btcpay-webhook`
   - **Note**: ngrok URLs change each time you restart ngrok, so you'll need to update the webhook URL

---

## Step 6: Configure Environment Variables

1. **Open `server/.env`** (create it if it doesn't exist, based on `server/env.example`)

2. **Add or update these variables**:
   ```env
   # BTCPay Server Configuration
   BTCPAY_URL=https://your-btcpay-server.com
   BTCPAY_API_KEY=your-api-key-here
   BTCPAY_STORE_ID=your-store-id-here
   BTCPAY_WEBHOOK_SECRET=your-webhook-secret-here
   ```

3. **Replace the placeholders**:
   - `BTCPAY_URL`: Your BTCPay Server URL (from Step 4)
   - `BTCPAY_API_KEY`: Your API key (from Step 3)
   - `BTCPAY_STORE_ID`: Your Store ID (from Step 2)
   - `BTCPAY_WEBHOOK_SECRET`: Your webhook secret (from Step 5)

4. **Example** (don't use these exact values):
   ```env
   BTCPAY_URL=https://my-store.btcpay.org
   BTCPAY_API_KEY=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
   BTCPAY_STORE_ID=abc123def456ghi789jkl012
   BTCPAY_WEBHOOK_SECRET=secret123456789abcdefghijklmnopqrstuvwxyz
   ```

5. **Save the file**

---

## Step 7: Restart Your Server

After adding the environment variables, restart your server:

```bash
# Stop the current server (Ctrl+C if running in terminal)
# Then restart:
cd server
npm start
```

---

## Step 8: Test the Connection

### Test 1: Check Server Starts Without Errors

1. **Start your server**:
   ```bash
   cd server
   npm start
   ```

2. **Check for errors**:
   - Should see: `Server running on port 5001`
   - Should NOT see: "BTCPay configuration missing" errors

### Test 2: Test Payment Creation (Via Frontend)

1. **Start your frontend** (if not running):
   ```bash
   cd client
   npm start
   ```

2. **Go to**: http://localhost:3000/dashboard
3. **Click "Add Balance"**
4. **Enter an amount**: e.g., `10.00`
5. **Click "Continue to Crypto Checkout"**
6. **Expected result**:
   - Should redirect to `/checkout/:paymentId`
   - Should see payment status: `PENDING`
   - Should see "Open BTCPay Checkout" button

### Test 3: Test BTCPay Checkout Link

1. **On the payment page**, click **"Open BTCPay Checkout"**
2. **Expected result**:
   - Should open BTCPay invoice page in a new tab
   - Should see invoice details (amount, QR code, payment address)
   - If you see an error, check your `BTCPAY_URL` and `BTCPAY_API_KEY`

### Test 4: Test API Directly (Optional)

You can test the API directly with curl:

```bash
# Replace YOUR_TOKEN with a valid JWT token from your login
curl -X POST http://localhost:5001/api/payments/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount": 10, "currency": "USD"}'
```

**Expected response**:
```json
{
  "paymentId": "...",
  "btcpayInvoiceId": "...",
  "btcpayCheckoutUrl": "https://...",
  "amount": 10,
  "currency": "USD"
}
```

---

## Troubleshooting

### Error: "BTCPay configuration missing"
- **Fix**: Check that all 4 BTCPay variables are set in `server/.env`
- **Fix**: Make sure there are no typos in variable names
- **Fix**: Restart the server after adding variables

### Error: "BTCPay API error: Unauthorized"
- **Fix**: Check that `BTCPAY_API_KEY` is correct (no extra spaces)
- **Fix**: Verify API key has correct permissions
- **Fix**: Make sure API key is for the correct store

### Error: "BTCPay API error: Store not found"
- **Fix**: Check that `BTCPAY_STORE_ID` is correct
- **Fix**: Verify Store ID matches the store in BTCPay Server

### Error: "Invalid webhook signature"
- **Fix**: Check that `BTCPAY_WEBHOOK_SECRET` matches the secret in BTCPay Server
- **Fix**: Go to Store Settings → Webhooks and verify the secret

### Payment page shows error
- **Fix**: Check browser console (F12) for errors
- **Fix**: Check server console for errors
- **Fix**: Verify you're logged in

---

## Next Steps

Once BTCPay is set up and working:

1. ✅ Test creating a payment
2. ✅ Test the BTCPay checkout link opens
3. ⏭️ (Optional) Set up on-ramp widget (MoonPay/Ramp) for users without crypto
4. ⏭️ Test a real payment (use testnet Bitcoin for testing)
5. ⏭️ Verify webhook receives payment confirmations

---

## Quick Reference

**Required Environment Variables**:
```env
BTCPAY_URL=https://your-btcpay-server.com
BTCPAY_API_KEY=your-api-key
BTCPAY_STORE_ID=your-store-id
BTCPAY_WEBHOOK_SECRET=your-webhook-secret
```

**Required API Permissions**:
- `btcpay.store.canviewinvoices`
- `btcpay.store.cancreateinvoice`

**Webhook URL Format**:
- Production: `https://yourdomain.com/api/payments/btcpay-webhook`
- Local (ngrok): `https://abc123.ngrok.io/api/payments/btcpay-webhook`

**Webhook Events**:
- InvoiceSettled
- InvoiceProcessing
- InvoiceExpired
- InvoiceInvalid

---

## Need Help?

If you're stuck:
1. Check `TROUBLESHOOT_PAYMENTS.md` for common issues
2. Check BTCPay Server logs (if self-hosted)
3. Check ShipCanary server console for errors
4. Verify all environment variables are set correctly

