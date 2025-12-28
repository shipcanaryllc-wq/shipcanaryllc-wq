# 🔧 Fix Vercel Build Command Override

## Problem

Vercel is still using OLD build command: `cd api && npm install && cd ../client && npm install && npm run build`

Even though `vercel.json` has: `cd client && npm ci && npm run build`

**Root Cause:** Vercel Dashboard override is taking precedence over `vercel.json`

---

## ✅ Solution: Clear Override in Vercel Dashboard

### Step-by-Step:

1. **Go to Vercel Dashboard**
   - Navigate to: https://vercel.com/dashboard
   - Click on your project (`shipcanaryllc-wq-glvf`)

2. **Open Build Settings**
   - Click **"Settings"** tab
   - Click **"Build and Deployment"** in left sidebar

3. **Find "Build Command" Section**
   - Look for the field showing: `cd api && npm install && cd ../client && npm install && npm run build`

4. **DISABLE Override (Most Important!)**
   - Find the **"Override"** toggle next to "Build Command"
   - Click it to **DISABLE** (turn it grey/off)
   - This tells Vercel to use `vercel.json` instead of dashboard settings

5. **Verify Other Settings**
   - **Output Directory:** Should be `client/build` (Override can stay enabled)
   - **Root Directory:** Should be **empty/blank**
   - **"Include files outside root directory":** Should be **ENABLED** (blue)

6. **Save**
   - Click **"Save"** button at bottom of Build Command section

7. **Redeploy**
   - Go to **"Deployments"** tab
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**
   - Wait for build (~2-3 minutes)

---

## Alternative: Manually Set Correct Command

If you prefer to keep Override enabled:

1. **Keep Override ENABLED** (blue)
2. **Change Build Command** to exactly:
   ```
   cd client && npm ci && npm run build
   ```
3. **Click "Save"**
4. **Redeploy**

---

## Why This Happens

Vercel has two sources of truth:
1. **Dashboard Settings** (takes precedence when Override is enabled)
2. **vercel.json** (used when Override is disabled)

When Override is enabled, Vercel ignores `vercel.json` and uses dashboard settings.

---

## Verification

After redeploy, check build logs:
- ✅ Should see: `cd client && npm ci && npm run build`
- ✅ Should NOT see: `cd api && npm install && cd ../client && npm install && npm run build`
- ✅ Build should complete successfully
- ✅ No "react-scripts: command not found" error

---

## Quick Checklist

- [ ] Go to Vercel Dashboard → Settings → Build and Deployment
- [ ] Find "Build Command" field
- [ ] **DISABLE "Override" toggle** (turn it grey)
- [ ] Click "Save"
- [ ] Redeploy
- [ ] Verify build uses command from `vercel.json`

---

## Summary

**Problem:** Vercel dashboard override is using old build command  
**Fix:** Disable "Override" toggle to let `vercel.json` control build  
**Action:** Disable override, save, redeploy

**The key is disabling the Override toggle!**



