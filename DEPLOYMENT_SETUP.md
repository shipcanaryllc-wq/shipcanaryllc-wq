# ShipCanary Deployment Guide

## Overview
This guide covers deploying ShipCanary to:
- **Frontend**: Vercel
- **Backend**: Railway

## Phase 1: GitHub Setup

### Manual Steps (GitHub CLI not available)

1. **Create GitHub Repository**:
   - Go to https://github.com/new
   - Repository name: `shipcanary` (or your preferred name)
   - Choose Private or Public
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)

2. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/shipcanary.git
   git branch -M main
   git push -u origin main
   ```

## Phase 2: Railway Backend Deployment

### Step 1: Create Railway Project
1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your `shipcanary` repository
6. Railway will auto-detect the project

### Step 2: Configure Railway Service
1. Railway should detect `railway.json` automatically
2. **Set Root Directory**: In Railway dashboard → Settings → Root Directory → Set to `server`
3. **Set Start Command**: Should be `node index.js` (already in railway.json)

### Step 3: Set Environment Variables in Railway
Go to Railway dashboard → Your Service → Variables tab → Add these:

**Required Variables:**
```
PORT=5001
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SHIPLABEL_API_KEY=your-shiplabel-api-key
FRONTEND_URL=https://your-vercel-app.vercel.app
```

**Optional Variables (if using):**
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
BTCPAY_URL=https://btcpay.yourserver.com
BTCPAY_API_KEY=your-btcpay-api-key
BTCPAY_STORE_ID=your-btcpay-store-id
BTCPAY_WEBHOOK_SECRET=your-btcpay-webhook-secret
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=shipcanary-labels
SHIPPFAST_API_TOKEN=your-shippfast-api-token
SHIPPFAST_BASE_URL=https://shippfast.net/api/v1
```

### Step 4: Deploy
1. Railway will automatically deploy when you push to GitHub
2. Or click "Deploy" button in Railway dashboard
3. Wait for deployment to complete
4. **Copy the Railway URL** (e.g., `https://shipcanary-production.up.railway.app`)

## Phase 3: Vercel Frontend Deployment

### Step 1: Create Vercel Project
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New Project"
4. Import your `shipcanary` repository
5. Vercel will auto-detect Create React App

### Step 2: Configure Vercel Project
1. **Framework Preset**: Create React App (auto-detected)
2. **Root Directory**: `client`
3. **Build Command**: `npm run build` (auto-detected)
4. **Output Directory**: `build` (auto-detected)
5. **Install Command**: `npm install` (auto-detected)

### Step 3: Set Environment Variables in Vercel
Go to Vercel dashboard → Your Project → Settings → Environment Variables → Add:

**Required Variables:**
```
REACT_APP_API_URL=https://your-railway-app.up.railway.app/api
REACT_APP_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

**Optional:**
```
REACT_APP_TUNNEL_TEST_MODE=false
```

### Step 4: Deploy
1. Click "Deploy"
2. Wait for build to complete
3. **Copy the Vercel URL** (e.g., `https://shipcanary.vercel.app`)

### Step 5: Update Railway FRONTEND_URL
1. Go back to Railway dashboard
2. Update `FRONTEND_URL` variable to your Vercel URL
3. Redeploy Railway service (or it will auto-redeploy)

## Phase 4: Post-Deployment Configuration

### Update CORS Origins
The backend CORS is configured to allow:
- All `*.vercel.app` domains (automatic)
- Custom domain set via `FRONTEND_URL` env var

If you add a custom domain to Vercel:
1. Add it to Railway `FRONTEND_URL` env var
2. Or update `server/index.js` CORS allowedOrigins array

### Update Google OAuth Callback
If using Google OAuth:
1. Go to Google Cloud Console
2. Update OAuth callback URL to: `https://your-railway-app.up.railway.app/api/auth/google/callback`
3. Update authorized JavaScript origins to include your Vercel URL

## Phase 5: Verification Checklist

### Backend Health Check
```bash
curl https://your-railway-app.up.railway.app/api/auth/me
# Should return: {"message":"No token provided"} (this is expected)
```

### Frontend Check
1. Open your Vercel URL in browser
2. Check browser console for errors
3. Try login/register flow
4. Verify API calls go to Railway backend (check Network tab)

### Test Flow
1. ✅ Register new account
2. ✅ Login
3. ✅ View dashboard
4. ✅ Create shipping label
5. ✅ View orders history
6. ✅ Download label PDF

## Troubleshooting

### CORS Errors
- Verify `FRONTEND_URL` in Railway matches your Vercel URL exactly
- Check that Railway URL is accessible (not paused)
- Verify CORS allows `*.vercel.app` domains

### API Connection Errors
- Verify `REACT_APP_API_URL` in Vercel points to Railway URL with `/api` suffix
- Check Railway logs for errors
- Verify MongoDB connection string is correct

### Build Failures
- Check Vercel build logs
- Verify all environment variables are set
- Ensure `client/package.json` has correct build script

## Environment Variables Summary

### Railway (Backend)
- `PORT` (auto-set by Railway)
- `NODE_ENV=production`
- `MONGODB_URI`
- `JWT_SECRET`
- `SHIPLABEL_API_KEY`
- `FRONTEND_URL` (your Vercel URL)
- `GOOGLE_CLIENT_ID` (optional)
- `GOOGLE_CLIENT_SECRET` (optional)
- `BTCPAY_*` variables (optional)
- `AWS_*` variables (optional)

### Vercel (Frontend)
- `REACT_APP_API_URL` (your Railway URL + `/api`)
- `REACT_APP_MAPBOX_ACCESS_TOKEN`
- `REACT_APP_TUNNEL_TEST_MODE` (optional)

## Local Development Still Works

After deployment, local development remains unchanged:
- Frontend: `npm run dev` → connects to `http://localhost:5001/api` (default)
- Backend: `cd server && npm start` → runs on `http://localhost:5001`
- No `.env` files are committed (protected by `.gitignore`)

## Files Changed for Deployment

1. **`client/src/config/api.js`** - Centralized API URL config
2. **All component files** - Updated to use centralized API config
3. **`server/index.js`** - Enhanced CORS to support Vercel domains
4. **`vercel.json`** - Updated build configuration
5. **`.gitignore`** - Enhanced to protect secrets

## Next Steps

1. Set up custom domain (optional)
2. Configure MongoDB Atlas IP whitelist to allow Railway IPs
3. Set up monitoring/logging
4. Configure CI/CD for automatic deployments






