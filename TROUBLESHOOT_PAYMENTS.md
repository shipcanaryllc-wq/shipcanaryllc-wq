# Payment System Troubleshooting Guide

## Quick Checklist

### 1. Check BTCPay Configuration

**Required Environment Variables** (in `server/.env`):
```env
BTCPAY_URL=https://your-btcpay-server.com
BTCPAY_API_KEY=your-api-key
BTCPAY_STORE_ID=your-store-id
BTCPAY_WEBHOOK_SECRET=your-webhook-secret
```

**To verify:**
1. Open `server/.env`
2. Check that all 4 variables above are set (not empty)
3. Restart the server after adding them

### 2. Common Errors and Solutions

#### Error: "BTCPay configuration missing"
- **Cause**: Missing environment variables
- **Fix**: Add all BTCPay variables to `server/.env` and restart server

#### Error: "Failed to create payment"
- **Possible causes**:
  - BTCPay Server is unreachable
  - Invalid API key
  - Wrong Store ID
  - Network/firewall blocking connection
- **Fix**: 
  1. Verify BTCPay Server is running
  2. Check API key has correct permissions
  3. Test BTCPay URL in browser

#### Error: "Cannot GET /checkout/:paymentId"
- **Cause**: Route not found
- **Fix**: Make sure `App.js` has the route: `<Route path="/checkout/:paymentId" element={<PaymentDetail />} />`

#### Error: "Payment not found"
- **Cause**: Payment ID doesn't exist or belongs to different user
- **Fix**: Check that you're logged in and using the correct payment ID

### 3. Testing the Payment Flow

**Step 1: Test Payment Creation**
1. Go to Dashboard → Add Balance
2. Enter an amount (e.g., 10.00)
3. Click "Continue to Crypto Checkout"
4. **Expected**: Redirects to `/checkout/:paymentId`

**Step 2: Check Payment Page**
1. Should see payment status (PENDING)
2. Should see "Open BTCPay Checkout" button
3. Should see "Buy crypto with card" button

**Step 3: Test BTCPay Connection**
1. Click "Open BTCPay Checkout"
2. **Expected**: Opens BTCPay invoice page
3. **If error**: Check BTCPay configuration

### 4. Server Logs

Check server console for errors:
- Look for "BTCPay" related errors
- Look for "Payment" related errors
- Check MongoDB connection status

### 5. Browser Console

Open browser DevTools (F12) and check:
- Network tab: Look for failed API calls
- Console tab: Look for JavaScript errors
- Check if `/api/payments/create` returns 200 or error

### 6. Quick Test Commands

**Test if server is running:**
```bash
curl http://localhost:5001/api/health
```

**Test if payment route exists:**
```bash
curl -X POST http://localhost:5001/api/payments/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount": 10, "currency": "USD"}'
```

### 7. Still Having Issues?

**Please provide:**
1. Exact error message (copy/paste)
2. What you were doing when it happened
3. Browser console errors (F12 → Console tab)
4. Server console output
5. Whether BTCPay Server is set up

## Next Steps

If BTCPay is not set up yet:
1. See `BTCPAY_INTEGRATION.md` for setup instructions
2. Or use a test BTCPay instance: https://testnet.demo.btcpayserver.org/
3. For production, set up your own BTCPay Server or use BTCPay.org

