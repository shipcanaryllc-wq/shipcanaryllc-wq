# 🔧 Vercel Root Directory Configuration Fix

## Problem
Vercel build fails with: `Error: Command "cd client && npm install && npm run build" exited with 1`

## Root Cause
Vercel's **Root Directory** setting conflicts with the `buildCommand` in `vercel.json`.

## Repository Structure Verified ✅

```
ShipCanary/
├── client/          ← Frontend (Create React App)
│   ├── package.json (uses react-scripts)
│   └── src/
├── server/          ← Backend
├── api/             ← Vercel serverless function
└── vercel.json      ← Vercel config
```

**Frontend Framework**: Create React App (react-scripts)
**Frontend Folder**: `client/`
**Build Output**: `client/build/`

---

## Solution: Choose ONE Configuration

### Option 1: Root Directory = EMPTY (Recommended) ✅

This matches your current `vercel.json` configuration.

**Vercel Settings:**
- **Root Directory**: `(empty/blank)` ← **CLEAR THIS FIELD**
- **Framework Preset**: `Create React App` (auto-detected)
- **Build Command**: `cd client && npm install && npm run build` (from vercel.json)
- **Output Directory**: `client/build` (from vercel.json)
- **Install Command**: `(leave empty or auto-detect)`

**Why this works:**
- Vercel sees the whole repo (including `client/` and `api/`)
- `vercel.json` handles the build configuration
- Both frontend and API function can be deployed

---

### Option 2: Root Directory = `client` (Alternative)

If you prefer to set Root Directory to `client`, update `vercel.json`:

**Vercel Settings:**
- **Root Directory**: `client`
- **Framework Preset**: `Create React App`
- **Build Command**: `npm install && npm run build` ← **NO `cd client`**
- **Output Directory**: `build` ← **NOT `client/build`**
- **Install Command**: `npm install`

**⚠️ WARNING**: This option will break API function deployment because Vercel won't see the `api/` folder.

---

## Recommended Action: Use Option 1

### Step-by-Step Fix:

1. **Go to Vercel Dashboard**
   - Navigate to: https://vercel.com/dashboard
   - Click on your project (`shipcanaryllc-wq-glvf`)

2. **Open Settings**
   - Click **"Settings"** tab
   - Click **"Build and Deployment"** in left sidebar

3. **Clear Root Directory**
   - Find **"Root Directory"** field
   - **DELETE** any value (make it empty/blank)
   - Click **"Save"**

4. **Verify Build Command**
   - **Build Command**: Should be `cd client && npm install && npm run build`
   - If not, Vercel should auto-detect from `vercel.json`

5. **Verify Output Directory**
   - **Output Directory**: Should be `client/build`
   - If not, Vercel should auto-detect from `vercel.json`

6. **Redeploy**
   - Go to **"Deployments"** tab
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**

---

## Verification

After fixing, the build should:
- ✅ Successfully run `cd client && npm install && npm run build`
- ✅ Find `client/package.json`
- ✅ Build frontend to `client/build/`
- ✅ Deploy API function from `api/index.js`

---

## Current vercel.json (Correct for Option 1)

```json
{
  "version": 2,
  "buildCommand": "cd client && npm install && npm run build",
  "outputDirectory": "client/build",
  "framework": "create-react-app",
  "functions": {
    "api/index.js": {
      "includeFiles": "server/**"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.js"
    }
  ]
}
```

This configuration requires **Root Directory = EMPTY**.

---

## Summary

**EXACT Vercel Settings to Use:**

- ✅ **Root Directory**: `(empty/blank)` ← **MOST IMPORTANT**
- ✅ **Build Command**: `cd client && npm install && npm run build`
- ✅ **Output Directory**: `client/build`
- ✅ **Framework**: `Create React App` (auto-detected)

**Repository**: ✅ Connected to `shipcanaryllc-wq/shipcanaryllc-wq` on GitHub
**Frontend Folder**: ✅ `client/` exists and is in git
**Build Tool**: ✅ `react-scripts` (Create React App)




