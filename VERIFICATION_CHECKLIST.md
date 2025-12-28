# ✅ Deployment Verification Checklist

## 🔍 Quick Status Check

Run these commands to verify deployment:

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
**Expected:** `204 No Content` with `Access-Control-Allow-Origin: https://shipcanary.com`

### 3. Frontend Test
1. Open: `https://shipcanary.com`
2. Open Browser DevTools → Console
3. Try to register/login
4. **Check for:**
   - ✅ No CORS errors
   - ✅ API calls go to `https://shipcanary.com/api/...`
   - ✅ Registration/login succeeds
   - ✅ No "Cannot find module" errors

---

## 📋 Configuration Checklist

### Code Configuration ✅
- [x] `api/index.js` - CORS allows shipcanary.com
- [x] `client/src/config/api.js` - Uses REACT_APP_API_URL
- [x] `api/package.json` - mongoose in dependencies
- [x] `client/package-lock.json` - Committed and up to date
- [x] `vercel.json` - Build command configured

### Vercel Environment Variables (Must Set)
- [ ] `REACT_APP_API_URL=https://shipcanary.com/api`
- [ ] `MONGODB_URI=mongodb+srv://...`
- [ ] `JWT_SECRET=...`
- [ ] `FRONTEND_URL=https://shipcanary.com`
- [ ] `ALLOWED_ORIGINS=https://shipcanary.com,https://www.shipcanary.com`
- [ ] `SHIPLABEL_API_KEY=...`

### Vercel Build Settings
- [ ] Root Directory: `client` (or blank)
- [ ] Build Command Override: **DISABLED**
- [ ] Output Directory: `build`
- [ ] Include files outside root: **ENABLED**

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot find module 'mongoose'"
**Check:**
- Vercel Function logs → Look for npm install output
- Verify `api/package.json` has mongoose in dependencies ✅
- Verify `api/package-lock.json` is committed ✅

### Issue: CORS errors
**Check:**
- Verify `REACT_APP_API_URL` is set correctly
- Verify `ALLOWED_ORIGINS` includes frontend domain
- Check browser console for exact CORS error

### Issue: Build fails
**Check:**
- Vercel Build Command Override should be **DISABLED**
- Verify `client/package-lock.json` is committed ✅
- Check build logs for specific error

### Issue: API returns 500
**Check:**
- Vercel Function logs → Look for error messages
- Verify all environment variables are set
- Check MongoDB connection string is correct

---

## 📊 Status Summary

**Code Status:** ✅ All fixes applied and pushed  
**Git Status:** ✅ All changes committed  
**Ready for:** Vercel deployment with env vars

**Next Step:** Set environment variables in Vercel and redeploy



