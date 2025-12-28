# Final Steps - Deploy and Test

## Step 1: Redeploy Vercel

1. **Go to Vercel dashboard** → Your project
2. **Click "Deployments" tab**
3. **Find the latest deployment**
4. **Click the "..." menu** (three dots) on the right
5. **Click "Redeploy"**
6. **Wait for deployment to complete** (usually 2-3 minutes)
   - You'll see build logs in real-time
   - Look for "Build Completed" ✅

## Step 2: Verify Deployment

1. **Check build logs** for any errors:
   - Should see "Build Completed" ✅
   - No red error messages
   - Frontend builds successfully
   - Backend API function builds successfully

2. **Get your Vercel URL**:
   - Should be: `https://shipcanaryllc-wq-glvf.vercel.app`
   - Or check "Domains" section in Settings

## Step 3: Test Your Site

1. **Open your Vercel URL** in browser
2. **Open browser console** (F12 → Console tab)
3. **Check for errors**:
   - Should NOT see "Network Error"
   - Should NOT see CORS errors
   - API calls should go to your Vercel domain + `/api`

4. **Test login**:
   - Try registering a new account
   - Or try logging in with existing credentials
   - Should connect to backend successfully

5. **Check Network tab** (F12 → Network):
   - Look for API calls to `/api/auth/login` or `/api/auth/me`
   - Should return 200 OK (not 404 or CORS errors)
   - Requests should go to: `https://shipcanaryllc-wq-glvf.vercel.app/api/...`

## Step 4: Verify Backend API

Test the backend health endpoint:
```bash
curl https://shipcanaryllc-wq-glvf.vercel.app/api/health
```

Should return:
```json
{"status":"ok","timestamp":"...","mongodb":"connected"}
```

## Troubleshooting

### If deployment fails:
- Check build logs for errors
- Verify all environment variables are saved
- Check that `REACT_APP_API_URL` includes `/api` at the end

### If you see "Network Error":
- Verify `REACT_APP_API_URL` is set correctly in Vercel
- Check browser console for specific error
- Verify backend deployment succeeded

### If API returns 404:
- Check that `api/index.js` file exists
- Verify `vercel.json` routes are correct
- Check deployment logs for backend function errors

### If MongoDB connection fails:
- Verify `MONGODB_URI` is correct in Vercel
- Check MongoDB Atlas → Network Access → Allow all IPs (0.0.0.0/0)
- Check MongoDB Atlas → Database Access → User permissions

## Success Checklist

- [ ] Vercel deployment successful (green checkmark)
- [ ] No errors in build logs
- [ ] Site loads without "Network Error"
- [ ] Can register/login successfully
- [ ] API calls work (check Network tab)
- [ ] Backend health endpoint returns OK



