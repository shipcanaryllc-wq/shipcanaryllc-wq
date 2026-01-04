# 🔍 Debug API Function Failure

## Current Status

✅ **Frontend**: Working (loads correctly)  
❌ **API Function**: Crashing (`FUNCTION_INVOCATION_FAILED`)

## How to Check Function Logs

The API function is crashing. To see why:

1. **Go to Vercel Dashboard**
   - Navigate to: https://vercel.com/dashboard
   - Click on your project (`shipcanaryllc-wq-glvf`)

2. **View Function Logs**
   - Click **"Deployments"** tab
   - Click on the **latest deployment**
   - Click **"Functions"** tab
   - Click on `api/index.js`
   - Scroll down to see **"Logs"** section

3. **Look for Error Messages**
   - Common errors:
     - `MongoDB connection error` → Check `MONGODB_URI`
     - `Cannot find module` → Missing dependency
     - `SHIPLABEL_API_KEY missing` → Env var not set
     - `Timeout` → Function taking too long

## Common Issues & Fixes

### Issue 1: MongoDB Connection Failed

**Error:** `MongoDB connection error: ...`

**Fix:**
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist (allow all IPs: `0.0.0.0/0`)
- Verify username/password are correct
- Check MongoDB cluster is running

### Issue 2: Missing Environment Variable

**Error:** `SHIPLABEL_API_KEY missing` or similar

**Fix:**
- Go to Vercel → Settings → Environment Variables
- Verify all 7 variables are set
- Check environment scope (Production, Preview, Development)
- **Redeploy** after adding variables

### Issue 3: Module Not Found

**Error:** `Cannot find module '...'`

**Fix:**
- Check `api/package.json` has all dependencies
- Vercel should auto-install, but may need manual check

### Issue 4: Function Timeout

**Error:** `Function execution exceeded timeout`

**Fix:**
- MongoDB connection might be slow
- Check MongoDB Atlas connection string
- Verify network connectivity

## Quick Test

After checking logs and fixing issues:

1. **Redeploy** (if you changed env vars or code)
2. **Wait** for deployment to complete
3. **Test:**
   ```bash
   curl https://www.shipcanary.com/api/health
   ```
4. **Expected:** JSON response, not error

## Next Steps

1. ✅ Check Vercel function logs (see above)
2. ✅ Fix the error shown in logs
3. ✅ Redeploy if needed
4. ✅ Test again

The logs will tell you exactly what's wrong!






