# 🔧 Final Mongoose Fix - Vercel Serverless Function

## Problem

Even though `mongoose` is in root `package.json` dependencies, Vercel serverless function still can't find it:
```
Cannot find module 'mongoose'
Require stack:
- /var/task/server/controllers/btcpayWebhookController.js
- /var/task/api/index.js
```

## Root Cause

Vercel might not be installing root dependencies automatically for serverless functions. The `buildCommand` only installs client dependencies (`cd client && npm ci`), but doesn't ensure root dependencies are installed for the API function.

## Solution Applied

### 1. Added `installCommand` to vercel.json ✅

**Before:**
```json
{
  "version": 2,
  "buildCommand": "cd client && npm ci && npm run build",
  ...
}
```

**After:**
```json
{
  "version": 2,
  "buildCommand": "cd client && npm ci && npm run build",
  "installCommand": "npm ci",
  ...
}
```

This ensures Vercel installs root dependencies (including mongoose) before building/deploying functions.

### 2. Verified mongoose is in root package.json ✅

```json
{
  "dependencies": {
    "mongoose": "^9.0.2",
    ...
  }
}
```

### 3. Verified mongoose is in package-lock.json ✅

✅ Confirmed mongoose is locked in root `package-lock.json`

---

## Files Changed

1. **`vercel.json`** - Added `installCommand: "npm ci"` to ensure root dependencies are installed

---

## Why This Should Work

1. **Root Directory is empty** → Vercel uses repo root
2. **installCommand: "npm ci"** → Vercel installs from root `package.json` before deploying
3. **mongoose in root dependencies** → Will be installed
4. **includeFiles: "server/**"** → Server files bundled with function

---

## Next Steps

1. **Redeploy on Vercel**
   - Go to Deployments → Click "..." → Redeploy
   - Wait for build to complete

2. **Verify Installation**
   - Check build logs for `npm ci` output
   - Should see mongoose being installed

3. **Test API**
   ```bash
   curl https://shipcanary.com/api/health
   ```
   Expected: `{"status":"ok","mongodb":"connected"}`

---

## If Still Failing

If mongoose still can't be found after redeploy:

1. **Check Vercel Build Logs:**
   - Look for `npm ci` output
   - Verify mongoose is listed in installed packages

2. **Verify Root Directory Setting:**
   - Vercel Dashboard → Settings → General
   - Root Directory should be **empty** or **/** (not `client` or `api`)

3. **Check Function Logs:**
   - Functions → `api/index.js` → Logs
   - Look for exact error message

4. **Alternative Fix (if needed):**
   - Copy all dependencies from root `package.json` to `api/package.json`
   - This ensures API function has its own dependency list

---

## Summary

**Fix:** Added `installCommand: "npm ci"` to `vercel.json` to ensure root dependencies are installed.

**Status:** ✅ Committed and pushed to GitHub.

**Next:** Redeploy on Vercel and verify mongoose is found.






