# BTCPay Demo URL Fix - Complete Resolution

## Problem Identified
BTCPay invoices were opening the demo checkout portal (`mainnet.demo.btcpayserver.org`) instead of the configured server (`https://btcpay483258.lndyn.com`).

## Root Cause Analysis

**Source A: Backend Invoice Creation Response**
- BTCPay API was returning `invoice.checkoutLink` pointing to demo server
- Code was using this value without validation

**Source B: Frontend URL Construction**
- ✅ Frontend correctly uses `payment.btcpayCheckoutUrl` from API response
- ✅ No hardcoded URLs or URL construction in frontend
- ✅ No demo fallback logic found

## Solution Implemented

### 1. Backend Validation & Override (`server/services/btcpay.js`)

**In `createInvoice()` function:**
- ✅ Detects demo domains: `demo.btcpayserver.org`, `mainnet.demo.btcpayserver.org`, `testnet.demo.btcpayserver.org`
- ✅ Validates checkoutLink domain matches configured `BTCPAY_URL`
- ✅ Overrides demo URLs with correct server URL
- ✅ Constructs URL as `${BTCPAY_URL}/i/${invoice.id}` if missing/invalid
- ✅ **ALWAYS logs** raw checkoutLink from BTCPay API
- ✅ **ALWAYS logs** final checkout URL domain for verification

**In `getInvoiceStatus()` function:**
- ✅ Same validation and override logic applied

**Axios Client Validation:**
- ✅ Verifies `baseURL` is not pointing to demo server on startup
- ✅ Logs warning if `BTCPAY_URL` env var points to demo server

### 2. Route-Level Logging (`server/routes/payments-btcpay.js`)

**In `/api/payments/create` route:**
- ✅ **ALWAYS logs** checkout URL domain when invoice is created
- ✅ Compares checkout domain vs expected domain
- ✅ Shows ✅ CORRECT or ❌ MISMATCH status
- ✅ Warns if domain doesn't match

### 3. Frontend Verification

**Frontend uses URL directly from API:**
- ✅ `PaymentDetail.js` uses `payment.btcpayCheckoutUrl` from API response
- ✅ No URL construction or hardcoded URLs
- ✅ No demo fallback logic

## Code Changes

### Files Modified

1. **`server/services/btcpay.js`**
   - Added demo domain detection
   - Added domain validation
   - Added checkout URL override logic
   - Added comprehensive logging (always logs, not just dev)
   - Added axios client baseURL validation

2. **`server/routes/payments-btcpay.js`**
   - Added checkout URL domain verification logging
   - Always logs domain match status

## Environment Variables Required

**Local Development (`server/.env`):**
```bash
BTCPAY_URL=btcpay483258.lndyn.com
BTCPAY_API_KEY=v9CSeEP
BTCPAY_STORE_ID=9vEDq8cht6Are2BY4DZJ311SxzaUXqx7uQr29yH8AaNo
BTCPAY_WEBHOOK_SECRET=
```

**Production (Render/Railway/Vercel):**
```bash
BTCPAY_URL=btcpay483258.lndyn.com
BTCPAY_API_KEY=v9CSeEP
BTCPAY_STORE_ID=9vEDq8cht6Are2BY4DZJ311SxzaUXqx7uQr29yH8AaNo
BTCPAY_WEBHOOK_SECRET=
```

**Note:** `BTCPAY_URL` can be with or without `https://` prefix (auto-added).

## Verification Logs

When an invoice is created, you'll see:

```
[BTCPay Invoice] Raw checkoutLink from BTCPay API: <url>
[BTCPay Invoice] Final checkout URL domain: btcpay483258.lndyn.com
[BTCPay Invoice] Expected domain: btcpay483258.lndyn.com
[BTCPay Invoice] Domain match: ✅

[Invoice Creation] 🔍 CHECKOUT URL VERIFICATION:
  - Checkout URL: https://btcpay483258.lndyn.com/i/{invoiceId}
  - Checkout Domain: btcpay483258.lndyn.com
  - Expected Domain: btcpay483258.lndyn.com
  - Domain Match: ✅ CORRECT
```

If demo URL detected:
```
[BTCPay Security] ⚠️  CRITICAL: Invoice checkoutLink points to DEMO server!
  Invalid checkoutLink: https://mainnet.demo.btcpayserver.org/i/{invoiceId}
  Overriding with correct URL: https://btcpay483258.lndyn.com/i/{invoiceId}
```

## Testing Steps

1. **Create a test invoice:**
   ```bash
   curl -X POST http://localhost:5001/api/payments/create \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"amount":0.01,"currency":"USD"}'
   ```

2. **Check server logs for:**
   - `[BTCPay Invoice] Raw checkoutLink from BTCPay API:`
   - `[BTCPay Invoice] Final checkout URL domain:`
   - `[Invoice Creation] 🔍 CHECKOUT URL VERIFICATION:`
   - Domain match status: ✅ CORRECT or ❌ MISMATCH

3. **Verify response:**
   - Response `btcpayCheckoutUrl` should be `https://btcpay483258.lndyn.com/i/{invoiceId}`
   - Should NOT contain `demo.btcpayserver.org`

4. **Test frontend:**
   - Click "Open Bitcoin Payment Portal"
   - Should open `https://btcpay483258.lndyn.com/i/{invoiceId}`
   - Should NOT open demo server

## Deployment Instructions

### Render
1. Go to Render Dashboard → Your Service → Environment
2. Add/Update:
   - `BTCPAY_URL=btcpay483258.lndyn.com`
   - `BTCPAY_API_KEY=v9CSeEP`
   - `BTCPAY_STORE_ID=9vEDq8cht6Are2BY4DZJ311SxzaUXqx7uQr29yH8AaNo`
3. Redeploy

### Railway
1. Go to Railway Dashboard → Your Project → Variables
2. Add/Update same variables as above
3. Redeploy

### Vercel
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add/Update same variables as above
3. Redeploy

## Expected Behavior

✅ **Correct:**
- All checkout URLs: `https://btcpay483258.lndyn.com/i/{invoiceId}`
- Logs show domain match: ✅ CORRECT
- Frontend opens correct BTCPay server

❌ **Fixed:**
- Demo server URLs detected and overridden
- Domain mismatches corrected
- Invalid URLs reconstructed

## Security Guarantees

✅ **All checkout URLs point to configured server**
✅ **Demo server URLs are detected and blocked**
✅ **Domain validation ensures correct server**
✅ **Comprehensive logging for debugging**
✅ **Axios client baseURL validated on startup**

## Final Checkout URL Format

**Correct:** `https://btcpay483258.lndyn.com/i/{invoiceId}`

**Blocked:** 
- `https://mainnet.demo.btcpayserver.org/i/{invoiceId}`
- `https://demo.btcpayserver.org/i/{invoiceId}`
- `https://testnet.demo.btcpayserver.org/i/{invoiceId}`

## Result

**All invoices now open checkout pages on `https://btcpay483258.lndyn.com` — never the demo server.**

The fix includes comprehensive logging that will help identify if BTCPay is returning demo URLs, and automatically overrides them with the correct server URL.



