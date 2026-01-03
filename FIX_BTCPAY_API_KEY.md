# Fix BTCPay API Key Authentication Error

## Problem
The API key `v9CSeEP` is being rejected by BTCPay Server with error:
```
"Authentication is required for accessing this endpoint"
```

## Solution: Generate a New API Key

### Step 1: Log into BTCPay Server
1. Go to: `https://btcpay483258.lndyn.com`
2. Log in with your account

### Step 2: Generate New API Key
1. Go to **Account** → **Manage Account** → **API Keys**
2. Click **"Create API Key"** (or **"Add API Key"**)
3. Fill in:
   - **Label**: `ShipCanary API Key` (or any name)
   - **Permissions**: Select these permissions:
     - ✅ `btcpay.store.canviewinvoices` (View invoices)
     - ✅ `btcpay.store.cancreateinvoice` (Create invoices)
     - ✅ `btcpay.store.canmodifyinvoices` (Modify invoices - optional but recommended)
   - **Store**: Select your store: `9vEDq8cht6Are2BY4DZJ311SxzaUXqx7uQr29yH8AaNo`
4. Click **"Generate API Key"** or **"Create"**

### Step 3: Copy the API Key
**⚠️ IMPORTANT**: Copy the API key immediately - you won't be able to see it again!
- The API key will be a long string (usually 40+ characters)
- It might look like: `your-long-api-key-string-here-1234567890abcdef`
- **Save this somewhere safe**

### Step 4: Update .env File
1. Open `server/.env`
2. Find the line: `BTCPAY_API_KEY=v9CSeEP`
3. Replace it with: `BTCPAY_API_KEY=<your-new-api-key>`
4. Save the file

### Step 5: Restart Server
Restart your backend server to load the new API key.

## Verify the Fix

After updating the API key, test it:

```bash
curl -X GET "https://btcpay483258.lndyn.com/api/v1/stores" \
  -H "Authorization: token YOUR_NEW_API_KEY" \
  -H "Content-Type: application/json"
```

If successful, you should see a JSON response with your stores (not an authentication error).

## Common Issues

1. **API key too short**: BTCPay API keys are usually 40+ characters long. If yours is short like `v9CSeEP`, it's likely incorrect.

2. **Wrong permissions**: Make sure you selected the store-specific permissions (`btcpay.store.*`) and not just account-level permissions.

3. **Wrong store**: Make sure the API key is associated with store ID `9vEDq8cht6Are2BY4DZJ311SxzaUXqx7uQr29yH8AaNo`.

4. **API key not copied correctly**: Make sure you copied the entire API key string, including any dashes or special characters.

## Need Help?

If you're still having issues:
1. Double-check the API key was copied correctly (no extra spaces)
2. Verify the store ID matches: `9vEDq8cht6Are2BY4DZJ311SxzaUXqx7uQr29yH8AaNo`
3. Check that the API key has the correct permissions
4. Try generating a new API key if the first one doesn't work

