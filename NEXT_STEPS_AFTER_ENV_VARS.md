# ✅ Next Steps After Adding Environment Variables

## Step 1: Redeploy (REQUIRED)

Environment variables are baked into the build at build time. You MUST redeploy after adding them.

### How to Redeploy:

1. **Go to Vercel Dashboard**
   - Navigate to: https://vercel.com/dashboard
   - Click on your project (`shipcanaryllc-wq-glvf`)

2. **Redeploy**
   - Click **"Deployments"** tab
   - Find the latest deployment
   - Click **"..."** (three dots) on the right
   - Click **"Redeploy"**
   - Confirm redeploy

3. **Wait for Build**
   - Watch the build progress
   - Should complete in ~2-3 minutes
   - Status should show "Ready" ✅

---

## Step 2: Verify API is Working

After redeploy completes, test the API:

### Test Health Endpoint:
```bash
curl https://www.shipcanary.com/api/health
```

**Expected Response:**
```json
{"status":"ok","timestamp":"2025-12-25T...","mongodb":"connected"}
```

**If you see this:** ✅ API is working!

**If you see error:** Check Vercel function logs (see Step 3)

---

## Step 3: Check Function Logs (if API fails)

If the API still returns errors:

1. **Go to Vercel Dashboard**
   - Click **"Deployments"** tab
   - Click on the latest deployment
   - Click **"Functions"** tab
   - Click on `api/index.js`

2. **Check Logs**
   - Look for error messages
   - Common issues:
     - MongoDB connection failed → Check `MONGODB_URI`
     - Missing env var → Check all 7 variables are set
     - Module not found → Check `api/package.json` dependencies

---

## Step 4: Test Frontend

1. **Open your site**
   - Go to: https://www.shipcanary.com

2. **Open Browser Console** (F12)
   - Check for errors
   - Should NOT see: `"REACT_APP_API_URL is not set!"`
   - Should NOT see CORS errors

3. **Test Registration**
   - Try creating an account
   - Should work without errors

4. **Test Login**
   - Try logging in
   - Should work without errors

---

## Step 5: Verify Everything Works

### ✅ Checklist:

- [ ] Redeployed after adding env vars
- [ ] API health endpoint returns JSON (not error)
- [ ] Browser console shows no errors
- [ ] Registration form loads
- [ ] Login form loads
- [ ] No CORS errors in browser console
- [ ] Network tab shows requests to `https://www.shipcanary.com/api/...`

---

## Troubleshooting

### Issue: API still returns `FUNCTION_INVOCATION_FAILED`

**Solution:**
1. Check Vercel function logs (Step 3)
2. Verify all 7 environment variables are set correctly
3. Check MongoDB connection string is correct
4. Ensure `NODE_ENV=production` is set

### Issue: Frontend shows "REACT_APP_API_URL is not set!"

**Solution:**
1. Verify `REACT_APP_API_URL` is set in Vercel
2. **Redeploy** (env vars are baked into build)
3. Clear browser cache

### Issue: CORS errors

**Solution:**
1. CORS fix is already deployed
2. Verify `FRONTEND_URL=https://www.shipcanary.com` is set
3. Check browser console for exact error message

---

## Success Indicators

✅ **Everything is working if:**
- API health returns JSON
- Frontend loads without console errors
- Registration/login works
- No CORS errors
- Network requests succeed

🎉 **You're done!** Your app should be fully functional.



