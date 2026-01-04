# 🚀 Complete Deployment Guide - ShipCanary

## ✅ All Fixes Applied

### Phase 0: Repo Structure ✅
- **Frontend**: `client/` folder
- **Backend Entrypoint**: `api/index.js` (Vercel serverless function)
- **Backend Code**: `server/` folder (included via `includeFiles`)

### Phase 1: Client Lockfile ✅
- Regenerated `client/package-lock.json`
- Build tested and working
- Committed to git

### Phase 2: Backend Mongoose ✅
- `mongoose@^8.0.3` in `api/package.json` dependencies
- Verified locally: `node -e "require('mongoose')"` ✅
- `api/package-lock.json` committed

### Phase 3: CORS Configuration ✅
- Updated `api/index.js` CORS to always allow:
  - `http://localhost:3000` and `http://localhost:3001`
  - `https://shipcanary.com` and `https://www.shipcanary.com`
  - All `*.vercel.app` domains
  - `ALLOWED_ORIGINS` env var support
- Proper OPTIONS preflight handling

### Phase 4: Frontend API URL ✅
- Removed `api-not-configured` placeholder
- Uses `REACT_APP_API_URL` in production
- Falls back to `localhost:5001/api` in development

### Phase 5: Git Push ✅
- All changes committed and pushed to `main` branch

---

## 📋 Phase 6: Vercel Project Settings

### Go to Vercel Dashboard → Your Project → Settings → Build and Deployment

**Root Directory:**
- Set to: `client`
- OR leave blank if using `vercel.json` (recommended)

**Build Command:**
- **Override**: DISABLED (let `vercel.json` control it)
- OR if Override enabled: `cd client && npm ci && npm run build`

**Install Command:**
- **Override**: DISABLED (Vercel auto-installs)
- OR if Override enabled: `cd client && npm ci`

**Output Directory:**
- Set to: `build`
- OR leave blank (Vercel detects from `vercel.json`)

**Framework Preset:**
- `Create React App` (auto-detected)

**"Include files outside root directory":**
- **ENABLED** (blue) - Required for `api/` folder

---

## 🔐 Phase 7: Environment Variables

### Vercel Environment Variables (Frontend)

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these variables for **Production**, **Preview**, and **Development**:

```bash
REACT_APP_API_URL=https://shipcanary.com/api
```

**OR** if your backend is on a different domain:
```bash
REACT_APP_API_URL=https://your-backend-domain.com/api
```

**Other frontend env vars** (if needed):
```bash
REACT_APP_MAPBOX_ACCESS_TOKEN=your_mapbox_token
REACT_APP_GOOGLE_PLACES_API_KEY=your_google_places_key
REACT_APP_ONRAMP_PROVIDER=your_provider
REACT_APP_ONRAMP_API_KEY=your_onramp_key
REACT_APP_TUNNEL_TEST_MODE=false
```

---

### Vercel Environment Variables (Backend API Function)

The backend runs as a serverless function, so env vars are shared. Add these for **Production**, **Preview**, and **Development**:

```bash
# Database
MONGODB_URI=mongodb+srv://shipcanary@admin:shipcanary@cluster0.sackvan.mongodb.net/?appName=Cluster0

# Auth
JWT_SECRET=your_jwt_secret_here

# Frontend URL (for CORS)
FRONTEND_URL=https://shipcanary.com
ALLOWED_ORIGINS=https://shipcanary.com,https://www.shipcanary.com

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Backend URL (for OAuth callback)
BACKEND_URL=https://shipcanary.com
VERCEL_URL=https://shipcanary.com

# Shipping APIs
SHIPLABEL_API_KEY=your_shiplabel_api_key
SHIPLABEL_BASE_URL=https://api.shiplabel.com
SHIPPFAST_API_TOKEN=your_shippfast_token
SHIPPFAST_BASE_URL=https://api.shippfast.com

# Payment APIs
BTCPAY_URL=your_btcpay_url
BTCPAY_API_KEY=your_btcpay_api_key
BTCPAY_STORE_ID=your_btcpay_store_id
BTCPAY_WEBHOOK_SECRET=your_btcpay_webhook_secret

# Stripe (if used)
STRIPE_SECRET_KEY=your_stripe_secret_key

# AWS (if used)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# Node Environment
NODE_ENV=production
```

---

## ✅ Phase 8: Verification Checklist

### 1. Backend Health Check
```bash
curl https://shipcanary.com/api/health
```
**Expected:** `{"status":"ok","timestamp":"...","mongodb":"connected"}`

### 2. CORS Preflight Test
```bash
curl -X OPTIONS https://shipcanary.com/api/auth/register \
  -H "Origin: https://shipcanary.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```
**Expected:** `204 No Content` with `Access-Control-Allow-Origin` header

### 3. Frontend Registration/Login
1. Go to `https://shipcanary.com`
2. Open browser DevTools → Console
3. Try to register/login
4. **Check for:**
   - ✅ No CORS errors
   - ✅ API calls go to correct URL (`https://shipcanary.com/api/...`)
   - ✅ Registration/login succeeds
   - ✅ No "Cannot find module" errors

### 4. Vercel Function Logs
1. Go to Vercel Dashboard → Your Project → Functions
2. Click on `api/index.js`
3. Check "Logs" tab
4. **Verify:**
   - ✅ No "Cannot find module 'mongoose'" errors
   - ✅ MongoDB connection successful
   - ✅ CORS headers present in responses

### 5. Build Verification
1. Go to Vercel Dashboard → Deployments
2. Check latest deployment
3. **Verify:**
   - ✅ Build completed successfully
   - ✅ No "react-scripts: command not found" errors
   - ✅ No "npm ci lockfile mismatch" errors

---

## 🔧 Troubleshooting

### Issue: "Cannot find module 'mongoose'"
**Solution:**
- Verify `api/package.json` has `mongoose` in `dependencies`
- Check Vercel Function logs for npm install output
- Ensure `api/package-lock.json` is committed

### Issue: CORS errors
**Solution:**
- Verify `REACT_APP_API_URL` is set correctly in Vercel
- Check `ALLOWED_ORIGINS` includes your frontend domain
- Verify CORS middleware is applied before routes in `api/index.js`

### Issue: Build fails with "react-scripts: command not found"
**Solution:**
- Ensure `react-scripts` is in `client/package.json` `dependencies` (not `devDependencies`)
- Disable Build Command Override in Vercel dashboard
- Let `vercel.json` control the build

### Issue: "npm ci lockfile mismatch"
**Solution:**
- Regenerate `client/package-lock.json`: `cd client && rm package-lock.json && npm install`
- Commit and push the new lockfile
- Redeploy on Vercel

---

## 📝 Summary of Changes

### Files Modified:
1. **`api/index.js`**: Fixed CORS to always allow shipcanary.com domains
2. **`client/src/config/api.js`**: Removed api-not-configured placeholder
3. **`client/package-lock.json`**: Regenerated for Vercel compatibility

### Files Verified:
1. **`api/package.json`**: mongoose in dependencies ✅
2. **`vercel.json`**: Correct build configuration ✅

---

## 🎯 Next Steps

1. **Set Vercel Environment Variables** (see Phase 7)
2. **Update Vercel Build Settings** (see Phase 6)
3. **Redeploy** on Vercel
4. **Run Verification Checklist** (see Phase 8)
5. **Test Registration/Login** from production frontend

---

## 📞 Quick Reference

**Frontend URL:** `https://shipcanary.com`  
**Backend API:** `https://shipcanary.com/api`  
**Health Check:** `https://shipcanary.com/api/health`  
**GitHub Repo:** `shipcanaryllc-wq/shipcanaryllc-wq`

**Vercel Dashboard:** https://vercel.com/dashboard

---

**Status:** ✅ All fixes applied and pushed to GitHub  
**Ready for:** Vercel deployment with correct environment variables






