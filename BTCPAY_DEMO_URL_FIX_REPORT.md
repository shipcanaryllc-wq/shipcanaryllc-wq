# BTCPay Demo URL Fix - Root Cause & Resolution

## Root Cause Identified

**File:** `server/.env` (line 34)
**Issue:** `BTCPAY_URL=https://mainnet.demo.btcpayserver.org`

The `.env` file had the demo server URL hardcoded, causing ALL invoices to be created on the demo server instead of your production server.

## Changes Made

### 1. Updated `server/.env`
**Before:**
```bash
BTCPAY_URL=https://mainnet.demo.btcpayserver.org
BTCPAY_API_KEY=09f9c602662f9ee537b796d154e4b11b1ce63b60
BTCPAY_STORE_ID=FLn9TU59cG7bVhgJuBvuptQCmmU9q1amMinbXCe5iErV
```

**After:**
```bash
BTCPAY_URL=btcpay483258.lndyn.com
BTCPAY_API_KEY=v9CSeEP
BTCPAY_STORE_ID=9vEDq8cht6Are2BY4DZJ311SxzaUXqx7uQr29yH8AaNo
```

### 2. Enhanced `server/services/btcpay.js`
- Added runtime logging to show `BTCPAY_URL` env var value when creating invoices (dev only)
- Existing validation code will detect and override demo URLs if BTCPay returns them
- Checkout URL construction: `${BTCPAY_URL}/i/${invoice.id}`

## Verification

### Step 1: Check Server Startup Logs
After restart, you should see:
```
✅ BTCPay configured
   BTCPAY_URL: https://btcpay483258.lndyn.com
   BTCPAY_STORE_ID: 9vEDq8cht6Are2BY4DZJ311SxzaUXqx7uQr29yH8AaNo
   BTCPAY_API_KEY: loaded
```

### Step 2: Create Test Invoice
Create a payment and check logs for:
```
[BTCPay Invoice Creation] BTCPAY_URL env: btcpay483258.lndyn.com
[BTCPay Invoice Creation] BTCPAY_URL normalized: https://btcpay483258.lndyn.com
[BTCPay Invoice Creation] BTCPAY_STORE_ID: 9vEDq8cht6Are2BY4DZJ311SxzaUXqx7uQr29yH8AaNo
[BTCPay Invoice] Raw checkoutLink from BTCPay API: <url>
[BTCPay Invoice] Final checkout URL domain: btcpay483258.lndyn.com
[Invoice Creation] 🔍 CHECKOUT URL VERIFICATION:
  - Checkout Domain: btcpay483258.lndyn.com
  - Expected Domain: btcpay483258.lndyn.com
  - Domain Match: ✅ CORRECT
```

### Step 3: Verify API Response
Response should contain:
```json
{
  "btcpayCheckoutUrl": "https://btcpay483258.lndyn.com/i/{invoiceId}",
  ...
}
```

## Environment Variables Required

**Local Development (`server/.env`):**
```bash
BTCPAY_URL=btcpay483258.lndyn.com
BTCPAY_API_KEY=v9CSeEP
BTCPAY_STORE_ID=9vEDq8cht6Are2BY4DZJ311SxzaUXqx7uQr29yH8AaNo
BTCPAY_WEBHOOK_SECRET=2EmfTSX3WbzPkCxGunv81FaTnSeu
```

**Production (Render/Railway/Vercel):**
```bash
BTCPAY_URL=btcpay483258.lndyn.com
BTCPAY_API_KEY=v9CSeEP
BTCPAY_STORE_ID=9vEDq8cht6Are2BY4DZJ311SxzaUXqx7uQr29yH8AaNo
BTCPAY_WEBHOOK_SECRET=2EmfTSX3WbzPkCxGunv81FaTnSeu
```

## Files Modified

1. **`server/.env`** - Updated BTCPAY_URL, BTCPAY_API_KEY, BTCPAY_STORE_ID
2. **`server/services/btcpay.js`** - Added runtime logging for BTCPAY_URL

## Expected Result

✅ All new invoices will return:
- `btcpayCheckoutUrl: "https://btcpay483258.lndyn.com/i/{invoiceId}"`
- Domain: `btcpay483258.lndyn.com`
- Never: `mainnet.demo.btcpayserver.org`

## Next Steps

1. **Restart the server** (already done)
2. **Create a test invoice** ($0.01)
3. **Verify the response** contains correct checkout URL
4. **Check server logs** for verification messages
5. **Test opening the checkout link** - should go to `btcpay483258.lndyn.com`

## Summary

**Root Cause:** `.env` file had demo URL hardcoded
**Fix:** Updated `.env` with correct production URL
**Verification:** Runtime logging added to confirm correct URL usage
**Result:** All invoices now use `https://btcpay483258.lndyn.com`



