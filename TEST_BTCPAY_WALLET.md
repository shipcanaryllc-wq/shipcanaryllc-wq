# How to Test BTCPay Wallet Configuration

## Quick Test Methods

### Method 1: Check Server Startup Logs

When the server starts, look for:

```
✅ BTCPay configured
   BTCPAY_URL: https://btcpay483258.lndyn.com
   BTCPAY_STORE_ID: 9vEDq8cht6Are2BY4DZJ311SxzaUXqx7uQr29yH8AaNo
   BTCPAY_API_KEY: loaded
```

If you see this, BTCPay is configured correctly.

### Method 2: Use the Test Endpoint

**Via Browser/Postman:**
1. Login to get your auth token
2. Visit: `http://localhost:5001/api/test/btcpay-config`
3. Include header: `Authorization: Bearer YOUR_TOKEN`

**Via cURL:**
```bash
# First, login to get token
TOKEN=$(curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}' \
  | jq -r '.token')

# Then test BTCPay config
curl http://localhost:5001/api/test/btcpay-config \
  -H "Authorization: Bearer $TOKEN"
```

### Method 3: Create a Real Invoice (Recommended)

**Via Frontend:**
1. Go to "Add Balance" page
2. Enter amount: $0.01 (minimum test)
3. Click "Add Balance"
4. Check server logs for detailed output

**Via API:**
```bash
TOKEN=$(curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}' \
  | jq -r '.token')

curl -X POST http://localhost:5001/api/payments/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":0.01,"currency":"USD"}'
```

## What to Look For in Logs

### ✅ Success Indicators

When an invoice is created, you should see:

```
[BTCPay Debug] Invoice created successfully:
  - Invoice ID: <invoice-id>
  - Store ID: 9vEDq8cht6Are2BY4DZJ311SxzaUXqx7uQr29yH8AaNo (configured)
  - Invoice Store ID: 9vEDq8cht6Are2BY4DZJ311SxzaUXqx7uQr29yH8AaNo (from BTCPay)
  - Checkout Link: https://btcpay483258.lndyn.com/i/<invoice-id>
  - BTC Address: bc1q... (derived from store xpub)
  - BTCPay URL: https://btcpay483258.lndyn.com
  - Derivation Source: Store 9vEDq8cht6Are2BY4DZJ311SxzaUXqx7uQr29yH8AaNo configured wallet
  - Address Origin: BTCPay Server HD wallet (xpub-based)
```

### ⚠️ Warning Signs

**Store ID Mismatch:**
```
[BTCPay Security] ⚠️  CRITICAL: Invoice store ID mismatch!
  Expected Store ID: 9vEDq8cht6Are2BY4DZJ311SxzaUXqx7uQr29yH8AaNo
  Invoice Store ID: <different-id>
```
→ This should NEVER happen. If you see this, BTCPay returned an invoice from a different store.

**Invalid Address Format:**
```
[BTCPay Security] ⚠️  Invalid BTC address format in invoice response
  Address: <invalid-address>
```
→ Address format is wrong (should be bc1... or 1... or 3...)

**No Address:**
```
[BTCPay Security] ⚠️  No BTC address in invoice response
```
→ This is OK - BTCPay may generate the address later. Check again after a few seconds.

## Verification Checklist

- [ ] Server startup shows "✅ BTCPay configured"
- [ ] Test endpoint returns `"success": true`
- [ ] Invoice creation logs show correct Store ID
- [ ] Invoice Store ID matches configured Store ID
- [ ] BTC Address is present and valid format
- [ ] Checkout URL points to `btcpay483258.lndyn.com`
- [ ] Logs show "Derivation Source: Store {STORE_ID} configured wallet"
- [ ] Logs show "Address Origin: BTCPay Server HD wallet (xpub-based)"

## Testing Address Uniqueness

To verify HD wallet is generating unique addresses:

1. Create 3 test invoices ($0.01 each)
2. Check logs for BTC addresses
3. Verify all 3 addresses are different
4. All should be valid BTC address format

```bash
# Create 3 invoices
for i in {1..3}; do
  curl -X POST http://localhost:5001/api/payments/create \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"amount":0.01,"currency":"USD"}' \
    | jq '.btcpayInvoiceId'
done

# Then check server logs for addresses
```

## Common Issues

### Issue: "BTCPay Server is not configured"
**Fix:** Check `server/.env` has:
- `BTCPAY_URL=btcpay483258.lndyn.com`
- `BTCPAY_API_KEY=v9CSeEP`
- `BTCPAY_STORE_ID=9vEDq8cht6Are2BY4DZJ311SxzaUXqx7uQr29yH8AaNo`

### Issue: "BTCPay API error: 401 Unauthorized"
**Fix:** API key is wrong or doesn't have permission for the store

### Issue: "BTCPay API error: 404 Not Found"
**Fix:** Store ID is incorrect

### Issue: No debug logs appearing
**Fix:** Set `DEBUG=true` in `server/.env` or ensure `NODE_ENV !== 'production'`

## Expected Behavior

✅ **Correct:**
- Each invoice gets a unique BTC address
- Addresses are valid BTC format (bc1..., 1..., or 3...)
- All addresses come from the same store's xpub wallet
- Store ID matches in all logs

❌ **Incorrect:**
- Same address reused across invoices
- Invalid address formats
- Store ID mismatches
- Addresses from different stores

## Next Steps After Verification

1. ✅ Configuration verified
2. ✅ Addresses derive from store xpub
3. ✅ No legacy/demo configs found
4. ✅ Ready for production use

If all checks pass, your BTCPay wallet configuration is working correctly!



