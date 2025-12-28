# 🔐 Vercel Environment Variables - Copy/Paste Ready

## Frontend Only (Vercel Deployment)

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these variables for **Production**, **Preview**, and **Development**:

---

## Required Environment Variables

### 1. API Base URL (MOST IMPORTANT)
```bash
REACT_APP_API_URL=https://your-railway-backend.up.railway.app/api
```
**Note:** Replace `your-railway-backend.up.railway.app` with your actual Railway backend URL after deployment.

**For local development:** This will fallback to `http://localhost:5001/api` automatically.

---

### 2. Mapbox Access Token (for address autocomplete)
```bash
REACT_APP_MAPBOX_ACCESS_TOKEN=pk.eyJ1Ijoic2hpcGNhbmFyeSIsImEiOiJjbWlqaDN3bWswZ3k2M2VweWRwZG83eDZwIn0.k1MbFlbaxMrkkq4KIoasCg
```

---

## Optional Environment Variables (Only if using these features)

### 3. Google Places API Key (alternative to Mapbox)
```bash
REACT_APP_GOOGLE_PLACES_API_KEY=your-google-places-api-key
```

### 4. OnRamp Provider (for crypto purchase widget)
```bash
REACT_APP_ONRAMP_PROVIDER=moonpay
REACT_APP_ONRAMP_API_KEY=your-onramp-api-key
```

### 5. Tunnel Test Mode (for local development testing)
```bash
REACT_APP_TUNNEL_TEST_MODE=false
```

---

## Quick Setup Steps

1. **Go to Vercel Dashboard**
   - Navigate to: https://vercel.com/dashboard
   - Click on your project

2. **Open Environment Variables**
   - Click **Settings** → **Environment Variables**

3. **Add Each Variable**
   - Click **Add New**
   - Paste the **Key** (e.g., `REACT_APP_API_URL`)
   - Paste the **Value** (e.g., `https://your-railway-backend.up.railway.app/api`)
   - Select: **Production**, **Preview**, **Development** (check all three)
   - Click **Save**

4. **Repeat for All Variables**
   - Add `REACT_APP_MAPBOX_ACCESS_TOKEN`
   - Add any optional variables you need

5. **Redeploy**
   - Go to **Deployments** tab
   - Click **"..."** → **Redeploy**
   - Wait for build to complete

---

## Important Notes

### ⚠️ REACT_APP_API_URL Must Point to Railway

**Before Railway Deployment:**
- Set to: `https://your-railway-backend.up.railway.app/api` (placeholder)
- Or leave empty (will use localhost fallback in dev)

**After Railway Deployment:**
- Update to your actual Railway URL: `https://your-app-name.up.railway.app/api`
- Redeploy Vercel after updating

### 🔄 Environment Variable Format

**React requires `REACT_APP_` prefix** for all frontend environment variables.

**Example:**
- ✅ Correct: `REACT_APP_API_URL`
- ❌ Wrong: `API_URL` (won't work in React)

---

## Copy/Paste Format (One Line Each)

```bash
REACT_APP_API_URL=https://your-railway-backend.up.railway.app/api
REACT_APP_MAPBOX_ACCESS_TOKEN=pk.eyJ1Ijoic2hpcGNhbmFyeSIsImEiOiJjbWlqaDN3bWswZ3k2M2VweWRwZG83eDZwIn0.k1MbFlbaxMrkkq4KIoasCg
```

---

## Verification

After setting environment variables and redeploying:

1. **Check Build Logs:**
   - Should see environment variables being used
   - No errors about missing `REACT_APP_API_URL`

2. **Test Frontend:**
   - Open your Vercel deployment URL
   - Open Browser DevTools → Console
   - Try to register/login
   - Check Network tab - API calls should go to Railway URL

3. **Verify API Calls:**
   - Network requests should show: `https://your-railway-backend.up.railway.app/api/...`
   - Not: `http://localhost:5001/api/...` (unless in local dev)

---

## Summary

**Minimum Required:**
- `REACT_APP_API_URL` (point to Railway backend)

**Recommended:**
- `REACT_APP_MAPBOX_ACCESS_TOKEN` (for address autocomplete)

**Status:** Ready to set in Vercel Dashboard ✅



