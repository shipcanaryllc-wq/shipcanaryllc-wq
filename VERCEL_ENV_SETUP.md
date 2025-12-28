# 🔧 Vercel Environment Variables Setup Guide

## Problem Fixed
- ✅ Removed `api-not-configured.vercel.app` placeholder
- ✅ Centralized API base URL configuration
- ✅ Fixed CORS to allow `shipcanary.com` domains
- ✅ Updated Login/Register to use centralized API config

## TASK A: Frontend API Base URL (Vercel)

### Step 1: Add Environment Variable in Vercel

1. **Go to Vercel Dashboard**
   - Navigate to: https://vercel.com/dashboard
   - Click on your project (`shipcanary` or similar)

2. **Open Settings**
   - Click **"Settings"** tab
   - Click **"Environment Variables"** in left sidebar

3. **Add Required Variable**
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://www.shipcanary.com/api` (or your backend API URL)
   - **Environment**: Select **Production**, **Preview**, and **Development**
   - Click **"Save"**

### Step 2: Redeploy

**IMPORTANT**: Create React App bakes environment variables into the build at build time. You MUST redeploy after adding/changing env vars.

1. Go to **"Deployments"** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. OR push a new commit (auto-redeploys)

### Step 3: Verify

After redeploy, check browser console (F12):
- ✅ Should NOT see: `"REACT_APP_API_URL is not set!"`
- ✅ Network tab should show requests to: `https://www.shipcanary.com/api/...`
- ❌ Should NOT see: `api-not-configured.vercel.app`

---

## TASK B: Backend CORS (Vercel Serverless Function)

### Step 1: Verify CORS Configuration

The CORS is already configured in `api/index.js` to allow:
- ✅ `https://shipcanary.com`
- ✅ `https://www.shipcanary.com`
- ✅ `http://localhost:3000` (development only)
- ✅ `http://localhost:3001` (development only)

### Step 2: Set Backend Environment Variables (if using separate backend)

If your backend is hosted separately (Railway, etc.), ensure these are set:

**Required Variables:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=https://www.shipcanary.com
NODE_ENV=production
```

**Optional (if using):**
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SHIPLABEL_API_KEY=your-shiplabel-api-key
```

---

## TASK C: Local Development Setup

### Create `.env.local` (Git-ignored)

In `client/` directory, create `.env.local`:

```bash
# client/.env.local
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_MAPBOX_ACCESS_TOKEN=your-mapbox-token-here
```

**Note**: `.env.local` is already in `.gitignore` - safe for local secrets.

### Verify Local Development

1. Start backend: `cd server && npm start` (runs on port 5001)
2. Start frontend: `cd client && npm start` (runs on port 3000)
3. Check browser console - should use `http://localhost:5001/api`

---

## Files Changed

### Frontend Changes:

1. **`client/src/config/api.js`**
   - ✅ Removed `api-not-configured.vercel.app` placeholder
   - ✅ Throws error if `REACT_APP_API_URL` not set in production
   - ✅ Uses localhost fallback only in development

2. **`client/src/components/Auth/Login.js`**
   - ✅ Now imports and uses `API_BASE_URL` from config
   - ✅ Removed hardcoded fallback

3. **`client/src/components/Auth/Register.js`**
   - ✅ Now imports and uses `API_BASE_URL` from config
   - ✅ Removed hardcoded fallback

### Backend Changes:

1. **`api/index.js`** (Vercel serverless function)
   - ✅ Updated CORS to explicitly allow `shipcanary.com` domains
   - ✅ Improved error messages for debugging

2. **`server/index.js`** (if using separate backend)
   - ✅ Updated CORS to match API function configuration

---

## Verification Checklist

After deploying:

### ✅ Frontend (Vercel)
- [ ] Open `https://www.shipcanary.com`
- [ ] Open browser console (F12)
- [ ] No error: `"REACT_APP_API_URL is not set!"`
- [ ] Network tab shows requests to `https://www.shipcanary.com/api/...`
- [ ] Registration form loads
- [ ] Login form loads

### ✅ Backend API
- [ ] Test health endpoint: `curl https://www.shipcanary.com/api/health`
- [ ] Should return JSON: `{"status":"ok",...}`
- [ ] No CORS errors in browser console
- [ ] Registration works
- [ ] Login works

### ✅ CORS
- [ ] No `Access-Control-Allow-Origin` errors
- [ ] Preflight OPTIONS requests succeed
- [ ] Authorization headers work

---

## Troubleshooting

### Issue: Still seeing `api-not-configured.vercel.app`

**Solution**: 
1. Verify `REACT_APP_API_URL` is set in Vercel
2. **Redeploy** (env vars are baked into build)
3. Clear browser cache

### Issue: CORS errors

**Solution**:
1. Check backend logs for CORS rejection messages
2. Verify `FRONTEND_URL` matches your domain
3. Ensure `NODE_ENV=production` is set in backend

### Issue: Local development broken

**Solution**:
1. Create `client/.env.local` with `REACT_APP_API_URL=http://localhost:5001/api`
2. Restart React dev server (`npm start`)

---

## Summary

**Vercel Environment Variables:**
```
REACT_APP_API_URL=https://www.shipcanary.com/api
```

**Backend Environment Variables (if separate):**
```
FRONTEND_URL=https://www.shipcanary.com
NODE_ENV=production
MONGODB_URI=...
JWT_SECRET=...
```

**After setting variables:**
1. ✅ Redeploy Vercel frontend
2. ✅ Restart backend (if separate)
3. ✅ Test registration/login
4. ✅ Verify no CORS errors



