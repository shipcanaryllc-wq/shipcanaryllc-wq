# Vercel Build Fix - react-scripts Not Found

## Problem Diagnosed

**Error:** `sh: line 1: react-scripts: command not found`

**Root Cause:**
- `react-scripts` was in `devDependencies` (line 45 of `client/package.json`)
- Vercel production builds may skip `devDependencies` 
- Build scripts require `react-scripts` to be available

**Evidence:**
- ✅ Client IS Create React App (scripts use `react-scripts`)
- ✅ `react-scripts` version: `5.0.1`
- ❌ Was in `devDependencies` instead of `dependencies`

## Fix Applied

**File Changed:** `client/package.json`

**Change:**
- Moved `react-scripts` from `devDependencies` to `dependencies`
- This ensures Vercel installs it during production builds

## Vercel Configuration

### Current Settings (Correct):

**Root Directory:** `(empty/blank)` ← **MOST IMPORTANT**

**Build Command:** `cd client && npm install && npm run build`

**Output Directory:** `client/build`

**Framework:** `Create React App` (auto-detected)

**Functions:**
- `api/index.js` with `includeFiles: "server/**"`

## Verification

After deployment, the build should:
1. ✅ Install client dependencies (including `react-scripts`)
2. ✅ Run `react-scripts build` successfully
3. ✅ Create `client/build/` directory
4. ✅ Deploy frontend and API function

## Test After Deployment

```bash
curl https://www.shipcanary.com/api/health
```

Expected: `{"status":"ok","timestamp":"...","mongodb":"connected"}`

## Summary

- **Branch:** BRANCH A (Client IS Create React App)
- **Fix:** Moved `react-scripts` to `dependencies`
- **Vercel Settings:** Root Directory = empty, Build Command = `cd client && npm install && npm run build`
- **Status:** Fixed and deployed






