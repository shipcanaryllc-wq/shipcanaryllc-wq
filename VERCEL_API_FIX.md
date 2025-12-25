# 🔧 Fix Vercel API Deployment

## Problem
API endpoints (`/api/*`) are returning HTML instead of JSON because Vercel can't find the API function.

## Root Cause
**Root Directory** is set to `client` in Vercel Settings, which means Vercel only sees files inside `client/` folder. The `api/` folder is at the repo root, so it's not visible.

## Solution: Clear Root Directory

Since we're using `builds` configuration in `vercel.json`, we don't need Root Directory set.

### Steps:

1. **Go to Vercel Dashboard**
   - Navigate to your project: https://vercel.com/dashboard
   - Click on your project

2. **Open Settings**
   - Click "Settings" tab
   - Click "Build and Deployment" in left sidebar

3. **Clear Root Directory**
   - Find "Root Directory" field
   - **DELETE** the value `client` (make it empty/blank)
   - Click "Save"

4. **Redeploy**
   - Go to "Deployments" tab
   - Click "..." on latest deployment
   - Click "Redeploy"
   - OR just push a new commit (auto-redeploys)

## Verify It Works

After redeploy, test:
```bash
curl https://www.shipcanary.com/api/health
```

Should return JSON:
```json
{"status":"ok","timestamp":"...","mongodb":"connected"}
```

NOT HTML!

## Why This Works

The `vercel.json` uses `builds` configuration:
- Frontend: `client/package.json` → builds from `client/` folder
- API: `api/index.js` → builds from repo root

When Root Directory is empty, Vercel sees the whole repo and can find both `client/` and `api/` folders.

