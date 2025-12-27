# CORS Fix Summary

## Problem
Browser error: `Access to XMLHttpRequest at 'https://www.shipcanary.com/api/auth/register' from origin 'https://shipcanaryllc-<something>.vercel.app' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present.`

## Root Cause
The CORS configuration in `api/index.js` was only allowing Vercel preview domains when `NODE_ENV === 'production'`, but Vercel preview deployments might not have `NODE_ENV` set to `production`. Additionally, the check used `origin.includes('.vercel.app')` which could match incorrectly.

## Solution

### Changes Made to `api/index.js`:

1. **Always allow Vercel preview domains** (not just in production):
   ```javascript
   // Allow ALL Vercel preview/production deployments (*.vercel.app)
   if (origin.endsWith('.vercel.app')) {
     return callback(null, true);
   }
   ```

2. **Added explicit OPTIONS preflight handler**:
   ```javascript
   app.use((req, res, next) => {
     if (req.method === 'OPTIONS') {
       res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
       res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
       res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
       res.header('Access-Control-Allow-Credentials', 'true');
       return res.sendStatus(204);
     }
     next();
   });
   ```

3. **Support ALLOWED_ORIGINS environment variable**:
   ```javascript
   if (process.env.ALLOWED_ORIGINS) {
     const envOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean);
     origins.push(...envOrigins);
   }
   ```

4. **Improved error logging**:
   ```javascript
   console.warn(`[CORS] Rejected origin: ${origin}`);
   ```

## Allowed Origins

The CORS configuration now allows:

### Development:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:3001`

### Production:
- `https://shipcanary.com`
- `https://www.shipcanary.com`
- `FRONTEND_URL` (if set in env vars)
- **ALL `*.vercel.app` domains** (preview and production deployments)

### Additional:
- Any origins specified in `ALLOWED_ORIGINS` env var (comma-separated)

## CORS Configuration Details

- **Methods**: `GET, POST, PUT, PATCH, DELETE, OPTIONS`
- **Headers**: `Content-Type, Authorization`
- **Credentials**: `true` (for JWT tokens)
- **Preflight**: Handled explicitly with 204 status

## Verification

### Test Preflight Request:
```bash
curl -X OPTIONS https://www.shipcanary.com/api/auth/register \
  -H "Origin: https://shipcanaryllc-wq-glvf.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  -v
```

**Expected Response:**
- Status: `204 No Content`
- Headers:
  - `Access-Control-Allow-Origin: https://shipcanaryllc-wq-glvf.vercel.app`
  - `Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type, Authorization`
  - `Access-Control-Allow-Credentials: true`

### Test Actual Request:
```bash
curl -X POST https://www.shipcanary.com/api/auth/register \
  -H "Origin: https://shipcanaryllc-wq-glvf.vercel.app" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}' \
  -v
```

**Expected Response:**
- Status: `200` or `400` (depending on validation)
- Header: `Access-Control-Allow-Origin: https://shipcanaryllc-wq-glvf.vercel.app`

## Deployment

1. **Backend (Vercel serverless function)**:
   - Changes are in `api/index.js`
   - Auto-deploys on git push
   - No environment variables required (but `ALLOWED_ORIGINS` can be added if needed)

2. **Redeploy**:
   - Vercel will auto-redeploy on push
   - Or manually redeploy from Vercel dashboard

## Browser Verification

After deployment, check browser console (F12):
- ✅ No CORS errors
- ✅ Registration/login requests succeed
- ✅ Network tab shows `Access-Control-Allow-Origin` header in response

## Files Changed

- `api/index.js` - Updated CORS configuration

## Why This Fixes the Issue

1. **Vercel preview domains are now always allowed** - The check `origin.endsWith('.vercel.app')` works regardless of `NODE_ENV`
2. **Explicit preflight handling** - Ensures OPTIONS requests are properly handled
3. **Better error logging** - Helps debug CORS issues in production


