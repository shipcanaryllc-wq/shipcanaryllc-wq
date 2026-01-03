# BTCPay Store Migration Summary

## Changes Made

### 1. Updated `server/services/btcpay.js`
- **Normalized BTCPAY_URL**: Automatically adds `https://` prefix if missing
- **Added debug logging**: Logs invoice ID, checkout link, and BTC address when `NODE_ENV !== 'production'` or `DEBUG=true`
- **Webhook secret handling**: Allows empty `BTCPAY_WEBHOOK_SECRET` (optional)

### 2. Updated `server/index.js`
- **Added startup validation**: Logs BTCPay configuration status on server startup
- **Non-blocking**: Warns if BTCPay is not configured but doesn't exit (payments will fail gracefully)

### 3. Updated `server/env.example`
- **Updated with new store credentials**: Example values reflect the new BTCPay store

## Environment Variables Required

Add these to your `server/.env` file:

```bash
# BTCPay Server Configuration (Primary Payment Gateway)
BTCPAY_URL=btcpay483258.lndyn.com
BTCPAY_API_KEY=v9CSeEP
BTCPAY_STORE_ID=9vEDq8cht6Are2BY4DZJ311SxzaUXqx7uQr29yH8AaNo
BTCPAY_WEBHOOK_SECRET=
```

**Note**: 
- `BTCPAY_URL` can be with or without `https://` prefix (will be auto-added)
- `BTCPAY_WEBHOOK_SECRET` can be left empty if webhooks are not configured yet

## Deployment Checklist

### Local Development
- [ ] Update `server/.env` with the new BTCPay credentials above
- [ ] Restart the server
- [ ] Verify startup logs show: `✅ BTCPay configured`
- [ ] Test creating a payment/invoice
- [ ] Check debug logs show invoice ID, checkout link, and address

### Production (Render/Railway/Vercel)
- [ ] Add `BTCPAY_URL=btcpay483258.lndyn.com` to environment variables
- [ ] Add `BTCPAY_API_KEY=v9CSeEP` to environment variables
- [ ] Add `BTCPAY_STORE_ID=9vEDq8cht6Are2BY4DZJ311SxzaUXqx7uQr29yH8AaNo` to environment variables
- [ ] Add `BTCPAY_WEBHOOK_SECRET=` (leave empty or add if you have a webhook secret)
- [ ] Redeploy the backend
- [ ] Verify startup logs show BTCPay is configured
- [ ] Test payment creation end-to-end

## Testing

1. **Create a test payment**:
   - Navigate to "Add Balance" page
   - Enter an amount (e.g., $10)
   - Click "Add Balance"
   - Should redirect to Bitcoin Payment Portal

2. **Verify invoice creation**:
   - Check server logs for `[BTCPay Debug] Invoice created successfully:`
   - Verify invoice ID, checkout link, and BTC address are logged

3. **Verify checkout link**:
   - The checkout link should point to your new BTCPay store
   - Format: `https://btcpay483258.lndyn.com/i/{invoiceId}`

## What Was NOT Changed

- ✅ UI styling (no changes)
- ✅ Authentication logic (no changes)
- ✅ Shipping label creation (no changes)
- ✅ Database schema (no changes)
- ✅ Balance logic (no changes)
- ✅ Routes (no changes, except debug logging)

## Files Modified

1. `server/services/btcpay.js` - Added URL normalization and debug logging
2. `server/index.js` - Added startup validation
3. `server/env.example` - Updated example values

## Debug Mode

To enable debug logging in production, set:
```bash
DEBUG=true
```

This will log invoice creation details including:
- Invoice ID
- Checkout Link
- BTC Address
- Store ID
- BTCPay URL



