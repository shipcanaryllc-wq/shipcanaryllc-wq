# 🔧 Final Deployment Fix - Complete Guide

## Current Problem

**Error:** `sh: line 1: react-scripts: command not found`  
**Build Command Error:** `Command "cd api && npm install && cd ../client && npm install && npm run build" exited with 127`

**Issue:** Vercel is using an OLD cached build command instead of the one in `vercel.json`

---

## ✅ Fixes Applied

### 1. Fixed `client/package.json`
- ✅ Moved `react-scripts` from `devDependencies` to `dependencies`
- ✅ Ensures Vercel installs it during production builds

### 2. Updated `vercel.json`
- ✅ Build Command: `cd client && npm ci && npm run build`
- ✅ Uses `npm ci` for reliable, reproducible installs

### 3. Added `api/package-lock.json`
- ✅ Ensures API dependencies are installed correctly

---

## 🎯 Vercel Settings to Verify

Go to **Vercel Dashboard → Your Project → Settings → Build and Deployment**

### Required Settings:

1. **Root Directory:** `(empty/blank)` ← **MOST IMPORTANT**

2. **Framework Preset:** `Create React App` (should auto-detect)

3. **Build Command:** `cd client && npm ci && npm run build`
   - ✅ Override toggle should be **ENABLED** (blue)
   - ✅ Should match exactly what's in `vercel.json`

4. **Output Directory:** `client/build`
   - ✅ Override toggle should be **ENABLED** (blue)

5. **Install Command:** `npm install` (or auto-detect)
   - Override toggle can be disabled

6. **"Include files outside the root directory in the Build Step"**
   - ✅ Should be **ENABLED** (blue) - This allows API function to work

---

## 🔄 If Build Command Doesn't Match

If Vercel still shows the OLD command (`cd api && npm install && cd ../client && npm install && npm run build`):

### Option 1: Clear Override and Let vercel.json Control It
1. Click the **"Override"** toggle next to Build Command to **DISABLE** it (grey)
2. Click **"Save"**
3. Vercel will now use the command from `vercel.json`
4. Redeploy

### Option 2: Manually Set Correct Command
1. Keep **"Override"** toggle **ENABLED** (blue)
2. Change Build Command to: `cd client && npm ci && npm run build`
3. Click **"Save"**
4. Redeploy

---

## ✅ Complete Checklist

### Before Redeploy:
- [ ] Root Directory is **empty/blank**
- [ ] Build Command is `cd client && npm ci && npm run build`
- [ ] Output Directory is `client/build`
- [ ] "Include files outside root directory" is **ENABLED**
- [ ] All 7 environment variables are set in Vercel
- [ ] `react-scripts` is in `client/package.json` dependencies (not devDependencies)

### After Redeploy:
- [ ] Build completes successfully (no errors)
- [ ] Status shows "Ready" ✅
- [ ] Test: `curl https://www.shipcanary.com/api/health` returns JSON
- [ ] Frontend loads: `https://www.shipcanary.com`
- [ ] Browser console shows no errors
- [ ] Registration form works
- [ ] Login form works

---

## 🚀 Step-by-Step Fix

1. **Go to Vercel Dashboard**
   - Navigate to: https://vercel.com/dashboard
   - Click on your project

2. **Open Build Settings**
   - Click **"Settings"** tab
   - Click **"Build and Deployment"**

3. **Verify Root Directory**
   - Should be **empty/blank**
   - If not, clear it and click **"Save"**

4. **Fix Build Command**
   - Find **"Build Command"** field
   - If it shows: `cd api && npm install && cd ../client && npm install && npm run build`
   - Change it to: `cd client && npm ci && npm run build`
   - Click **"Save"**

5. **Verify Output Directory**
   - Should be: `client/build`
   - Click **"Save"** if you changed anything

6. **Enable "Include files outside root directory"**
   - Toggle should be **ENABLED** (blue)
   - Click **"Save"**

7. **Redeploy**
   - Go to **"Deployments"** tab
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**
   - Wait for build to complete (~2-3 minutes)

---

## 🧪 Test After Deployment

### 1. Test API:
```bash
curl https://www.shipcanary.com/api/health
```
**Expected:** `{"status":"ok","timestamp":"...","mongodb":"connected"}`

### 2. Test Frontend:
- Open: `https://www.shipcanary.com`
- Open browser console (F12)
- Should see **NO errors**
- Try registration form
- Try login form

### 3. Verify Everything Works:
- ✅ Site loads
- ✅ No console errors
- ✅ Registration works
- ✅ Login works
- ✅ API calls succeed
- ✅ No CORS errors

---

## 🎉 Success Indicators

Your site is ready when:
- ✅ Build completes without errors
- ✅ API health endpoint returns JSON
- ✅ Frontend loads correctly
- ✅ Users can register
- ✅ Users can login
- ✅ No CORS errors in browser console

---

## 📝 Summary

**Problem:** Vercel using old build command, `react-scripts` not found  
**Root Cause:** Build command mismatch + `react-scripts` in wrong section  
**Fix:** Updated `vercel.json` + moved `react-scripts` to dependencies  
**Action:** Verify Vercel settings match `vercel.json`, then redeploy

**Next:** Follow the step-by-step fix above, then test!

