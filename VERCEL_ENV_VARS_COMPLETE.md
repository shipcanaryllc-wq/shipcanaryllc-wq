# Complete Vercel Environment Variables Guide

## Quick Copy-Paste for Vercel Dashboard

### Backend (API Function) Environment Variables

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these one by one:

#### Required Variables:

```
NODE_ENV=production

MONGODB_URI=mongodb+srv://<db_username>:<db_password>@cluster0.sackvan.mongodb.net/shipcanary?retryWrites=true&w=majority

JWT_SECRET=a14f83cb31f300f9fc6fe031177ee4b902f56f812f29e2df76d8b515eaacd6d2c0e9e75350857f546f34c6e136fff42ee7583017c6721c2b1910d1a6331c7c65

SHIPLABEL_API_KEY=your-shiplabel-api-key-here

FRONTEND_URL=https://www.shipcanary.com
```

#### Optional Variables (if using):

```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

BTCPAY_URL=https://btcpay.yourserver.com
BTCPAY_API_KEY=your-btcpay-api-key
BTCPAY_STORE_ID=your-btcpay-store-id
BTCPAY_WEBHOOK_SECRET=your-btcpay-webhook-secret

SHIPPFAST_API_TOKEN=your-shippfast-api-token
SHIPPFAST_BASE_URL=https://shippfast.net/api/v1

ALLOWED_ORIGINS=https://preview.example.com,https://staging.example.com
```

---

### Frontend Environment Variables

#### Required Variables:

```
REACT_APP_API_URL=https://www.shipcanary.com/api

REACT_APP_MAPBOX_ACCESS_TOKEN=pk.eyJ1Ijoic2hpcGNhbmFyeSIsImEiOiJjbWlqaDN3bWswZ3k2M2VweWRwZG83eDZwIn0.k1MbFlbaxMrkkq4KIoasCg
```

#### Optional Variables:

```
REACT_APP_GOOGLE_PLACES_API_KEY=your-google-places-api-key
REACT_APP_ONRAMP_PROVIDER=moonpay
REACT_APP_TUNNEL_TEST_MODE=false
```

---

## Important Notes

1. **Environment Scope**: Set variables for **Production**, **Preview**, and **Development** environments
2. **Redeploy Required**: After adding/changing env vars, you MUST redeploy for changes to take effect
3. **Sensitive Data**: Mark sensitive variables as "Sensitive" in Vercel to hide values
4. **MongoDB URI**: Replace `<db_username>` and `<db_password>` with your actual MongoDB Atlas credentials

---

## Verification

After setting variables and redeploying:

1. Test API health:
   ```bash
   curl https://www.shipcanary.com/api/health
   ```
   Should return: `{"status":"ok","timestamp":"...","mongodb":"connected"}`

2. Check browser console:
   - No errors about missing env vars
   - API calls succeed
   - No CORS errors




