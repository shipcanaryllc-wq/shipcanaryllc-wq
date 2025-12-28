# Railway Backend Deployment Guide

## Step-by-Step Instructions

### Step 1: Configure Service Settings

1. **Click on your service** (`shipcanaryllc-wq`) in Railway dashboard
2. Go to **Settings** tab
3. Scroll to **"Root Directory"**
4. Set it to: `server`
5. Click **Save**

### Step 2: Add Environment Variables

Go to **Variables** tab and add these one by one:

#### Required Variables:

**1. NODE_ENV**
```
Key: NODE_ENV
Value: production
```

**2. MONGODB_URI**
```
Key: MONGODB_URI
Value: mongodb+srv://<db_username>:<db_password>@cluster0.sackvan.mongodb.net/shipcanary?retryWrites=true&w=majority
```
⚠️ Replace `<db_username>` and `<db_password>` with your MongoDB Atlas credentials

**3. JWT_SECRET**
```
Key: JWT_SECRET
Value: a14f83cb31f300f9fc6fe031177ee4b902f56f812f29e2df76d8b515eaacd6d2c0e9e75350857f546f34c6e136fff42ee7583017c6721c2b1910d1a6331c7c65
```

**4. SHIPLABEL_API_KEY**
```
Key: SHIPLABEL_API_KEY
Value: [Your ShipLabel API key from ShipLabel.net account]
```

**5. FRONTEND_URL**
```
Key: FRONTEND_URL
Value: https://shipcanaryllc-wq-glvf.vercel.app
```
(Update this to your actual Vercel URL if different)

#### Optional Variables (if you use these):

**Google OAuth** (if using Google login):
```
Key: GOOGLE_CLIENT_ID
Value: [Your Google OAuth Client ID]

Key: GOOGLE_CLIENT_SECRET
Value: [Your Google OAuth Client Secret]
```

**BTCPay** (if using Bitcoin payments):
```
Key: BTCPAY_URL
Value: [Your BTCPay server URL]

Key: BTCPAY_API_KEY
Value: [Your BTCPay API key]

Key: BTCPAY_STORE_ID
Value: [Your BTCPay Store ID]

Key: BTCPAY_WEBHOOK_SECRET
Value: [Your BTCPay webhook secret]
```

**AWS S3** (if storing labels in S3):
```
Key: AWS_ACCESS_KEY_ID
Value: [Your AWS access key]

Key: AWS_SECRET_ACCESS_KEY
Value: [Your AWS secret key]

Key: AWS_REGION
Value: us-east-1

Key: AWS_S3_BUCKET
Value: shipcanary-labels
```

### Step 3: Deploy

1. After adding variables, Railway will **auto-deploy**
2. Go to **Deployments** tab to watch progress
3. Wait for deployment to complete (usually 1-2 minutes)
4. Check **Logs** tab for any errors

### Step 4: Get Your Railway URL

1. Go to **Settings** tab
2. Scroll to **"Public Domain"** or **"Generate Domain"**
3. Click **"Generate Domain"** if needed
4. **Copy the URL** (e.g., `https://shipcanary-production.up.railway.app`)

### Step 5: Update Vercel with Railway URL

1. Go to **Vercel** dashboard → Your project
2. Go to **Settings** → **Environment Variables**
3. Add or update:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://your-railway-url.up.railway.app/api`
     - ⚠️ **Important**: Include `/api` at the end!
4. Select **Production** environment
5. Click **Save**
6. Go to **Deployments** tab
7. Click **"..."** on latest deployment → **"Redeploy"**

### Step 6: Update Railway FRONTEND_URL

1. Go back to **Railway** → Your service → **Variables**
2. Update `FRONTEND_URL` to match your exact Vercel URL
3. Railway will auto-redeploy

### Step 7: Verify Deployment

1. **Test Railway backend**:
   ```bash
   curl https://your-railway-url.up.railway.app/api/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Test Vercel frontend**:
   - Open your Vercel URL
   - Try logging in
   - Check browser console for errors
   - Should connect to Railway backend (check Network tab)

## Troubleshooting

### MongoDB Connection Issues
- Check MongoDB Atlas → Network Access → Add Railway IP (or allow all IPs: `0.0.0.0/0`)
- Verify username/password in connection string
- Check database name matches (`shipcanary`)

### CORS Errors
- Verify `FRONTEND_URL` in Railway matches your Vercel URL exactly
- Check Railway logs for CORS errors
- Ensure Vercel URL includes `https://`

### Build Failures
- Check Railway logs for errors
- Verify Root Directory is set to `server`
- Check that all required env vars are set

### API Not Working
- Verify `REACT_APP_API_URL` in Vercel includes `/api` suffix
- Check Railway deployment is successful (green status)
- Check Railway logs for runtime errors

## Quick Checklist

- [ ] Root Directory set to `server`
- [ ] All required environment variables added
- [ ] Railway deployment successful
- [ ] Railway URL copied
- [ ] `REACT_APP_API_URL` set in Vercel
- [ ] Vercel redeployed
- [ ] `FRONTEND_URL` updated in Railway
- [ ] Tested login flow



