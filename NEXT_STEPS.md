# Next Steps After Adding Railway Variables

## Step 1: Check Railway Deployment Status

1. **Go to Railway dashboard** → Your service (`shipcanaryllc-wq`)
2. **Check the Deployments tab**:
   - Look for a green checkmark ✅ = Success
   - If red ❌ = Check logs for errors
3. **Check the Logs tab**:
   - Should see: "✅ MongoDB connected successfully"
   - Should see: "Server running on port..."
   - No red error messages

## Step 2: Get Your Railway URL

1. **Go to Settings tab** in Railway
2. **Scroll to "Public Domain"** section
3. **Click "Generate Domain"** if you don't see a URL yet
4. **Copy the URL** (e.g., `https://shipcanary-production.up.railway.app`)
   - ⚠️ **IMPORTANT**: Copy the full URL without `/api` at the end

## Step 3: Update Vercel with Railway URL

1. **Go to Vercel dashboard** → Your project
2. **Go to Settings** → **Environment Variables**
3. **Add or Update**:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://your-railway-url.up.railway.app/api`
     - ⚠️ **IMPORTANT**: Add `/api` at the end!
   - **Environment**: Select "Production" (and "Preview" if you want)
4. **Click "Save"**

## Step 4: Redeploy Vercel

1. **Go to Deployments tab** in Vercel
2. **Click the "..." menu** on the latest deployment
3. **Click "Redeploy"**
4. **Wait for deployment to complete** (usually 1-2 minutes)

## Step 5: Update Railway FRONTEND_URL (if needed)

1. **Go back to Railway** → Your service → **Variables**
2. **Check if `FRONTEND_URL` matches your exact Vercel URL**
3. **Update if needed** (Railway will auto-redeploy)

## Step 6: Test Everything

1. **Open your Vercel site** (e.g., `https://shipcanaryllc-wq-glvf.vercel.app`)
2. **Open browser console** (F12 → Console tab)
3. **Try to login**:
   - Should NOT see "Network Error"
   - Should connect to Railway backend
   - Check Network tab → Should see requests to Railway URL
4. **Test registration/login flow**

## Troubleshooting

### If Railway deployment failed:
- Check **Logs tab** for errors
- Common issues:
  - MongoDB connection failed → Check MongoDB Atlas IP whitelist
  - Missing environment variable → Double-check all variables are added

### If Vercel still shows Network Error:
- Verify `REACT_APP_API_URL` includes `/api` at the end
- Check Railway URL is correct
- Verify Railway deployment is successful (green checkmark)
- Check browser console for specific error messages

### If CORS errors:
- Verify `FRONTEND_URL` in Railway matches your Vercel URL exactly
- Check Railway logs for CORS errors
- Make sure both URLs use `https://`






