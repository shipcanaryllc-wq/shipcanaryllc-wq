# ShipCanary Deployment Guide

This guide will help you deploy ShipCanary to shipcanary.com.

## Architecture Overview

- **Frontend**: React app (deploy to Vercel)
- **Backend**: Node.js/Express API (deploy to Railway or Render)
- **Database**: MongoDB Atlas (already configured)
- **Domain**: shipcanary.com

---

## Step 1: Deploy Backend API

### Option A: Railway (Recommended - Easy & Free Tier Available)

1. **Sign up at [Railway.app](https://railway.app)**

2. **Create a new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select the ShipCanary repository

3. **Configure the service:**
   - Railway will detect it's a Node.js app
   - Set the root directory to `/server`
   - Set the start command to: `node index.js`

4. **Add environment variables:**
   Go to Variables tab and add:
   ```
   PORT=5001
   NODE_ENV=production
   MONGODB_URI=your-mongodb-atlas-connection-string
   JWT_SECRET=your-super-secret-jwt-key-change-this
   SHIPPFAST_API_TOKEN=your-shippfast-api-token
   SHIPPFAST_BASE_URL=https://shippfast.net/api/v1
   FRONTEND_URL=https://shipcanary.com
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   BTCPAY_URL=your-btcpay-url (if using)
   BTCPAY_API_KEY=your-btcpay-api-key (if using)
   BTCPAY_STORE_ID=your-btcpay-store-id (if using)
   BTCPAY_WEBHOOK_SECRET=your-btcpay-webhook-secret (if using)
   ```

5. **Deploy:**
   - Railway will automatically deploy
   - Note the generated URL (e.g., `https://shipcanary-production.up.railway.app`)

6. **Get your backend URL:**
   - Copy the Railway deployment URL
   - This will be your `REACT_APP_API_URL` for the frontend

### Option B: Render (Alternative)

1. **Sign up at [Render.com](https://render.com)**

2. **Create a new Web Service:**
   - Connect your GitHub repo
   - Set:
     - **Name**: shipcanary-api
     - **Root Directory**: server
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `node index.js`

3. **Add environment variables** (same as Railway above)

4. **Deploy and note the URL**

---

## Step 2: Update Backend CORS for Production

Update `server/index.js` to allow your domain:

```javascript
app.use(cors({
  origin: [
    'https://shipcanary.com',
    'https://www.shipcanary.com',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  // ... rest of config
}));
```

Also update session cookie:
```javascript
cookie: { 
  secure: true, // HTTPS only
  sameSite: 'none' // For cross-origin
}
```

---

## Step 3: Deploy Frontend to Vercel

1. **Sign up at [Vercel.com](https://vercel.com)**

2. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

3. **Deploy from command line:**
   ```bash
   cd client
   vercel
   ```
   - Follow the prompts
   - Set root directory to `client`
   - Build command: `npm run build`
   - Output directory: `build`

4. **Or deploy via GitHub:**
   - Go to Vercel dashboard
   - Click "Add New Project"
   - Import your GitHub repo
   - Configure:
     - **Framework Preset**: Create React App
     - **Root Directory**: `client`
     - **Build Command**: `npm run build`
     - **Output Directory**: `build`

5. **Add environment variables in Vercel:**
   Go to Project Settings > Environment Variables:
   ```
   REACT_APP_API_URL=https://your-railway-backend-url.up.railway.app/api
   REACT_APP_MAPBOX_ACCESS_TOKEN=your-mapbox-token
   ```

6. **Redeploy** after adding environment variables

---

## Step 4: Connect Domain (shipcanary.com)

### For Vercel (Frontend):

1. **In Vercel dashboard:**
   - Go to your project
   - Click "Settings" > "Domains"
   - Add `shipcanary.com` and `www.shipcanary.com`

2. **Update DNS records** (at your domain registrar):
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
   
   Or use Vercel's nameservers (recommended):
   - Vercel will provide nameservers
   - Update at your domain registrar

### For Railway (Backend):

1. **Add custom domain:**
   - In Railway project, go to Settings > Networking
   - Add custom domain: `api.shipcanary.com` (optional, or use Railway URL)

2. **Update DNS:**
   ```
   Type: CNAME
   Name: api
   Value: your-railway-url.up.railway.app
   ```

---

## Step 5: Update Frontend API URL

After getting your backend URL, update Vercel environment variables:

```
REACT_APP_API_URL=https://api.shipcanary.com/api
```

Or if using Railway URL directly:
```
REACT_APP_API_URL=https://shipcanary-production.up.railway.app/api
```

---

## Step 6: Update MongoDB Atlas Whitelist

1. **Go to MongoDB Atlas dashboard**
2. **Network Access** > **Add IP Address**
3. **Add:**
   - Railway IPs (or allow all: `0.0.0.0/0` for simplicity)
   - Vercel IPs (or allow all)

---

## Step 7: Update Google OAuth (if using)

1. **Go to [Google Cloud Console](https://console.cloud.google.com)**
2. **APIs & Services** > **Credentials**
3. **Update OAuth 2.0 Client:**
   - Add authorized redirect URI: `https://shipcanary.com/api/auth/google/callback`
   - Add authorized JavaScript origins: `https://shipcanary.com`

---

## Step 8: Final Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Environment variables set in both platforms
- [ ] Domain connected and DNS updated
- [ ] MongoDB Atlas whitelist updated
- [ ] Google OAuth redirect URIs updated
- [ ] Test login/registration
- [ ] Test label creation
- [ ] Test payment flow (if applicable)

---

## Troubleshooting

### CORS Errors
- Ensure backend CORS includes your frontend domain
- Check that `FRONTEND_URL` env var is set correctly

### API Connection Issues
- Verify `REACT_APP_API_URL` is set in Vercel
- Check backend is running (visit `/api/health`)
- Check browser console for errors

### Database Connection
- Verify MongoDB connection string is correct
- Check IP whitelist in MongoDB Atlas
- Ensure connection string includes `?retryWrites=true&w=majority`

### Build Failures
- Check Node.js version (should be 18+)
- Ensure all dependencies are in package.json
- Check build logs in Vercel/Railway

---

## Production Optimizations

1. **Enable HTTPS everywhere** (Vercel/Railway do this automatically)
2. **Set secure cookies** (already configured above)
3. **Enable Helmet security headers** (already in code)
4. **Monitor errors** (use Sentry or similar)
5. **Set up logging** (Railway/Render have built-in logs)

---

## Support

If you encounter issues:
1. Check deployment logs in Vercel/Railway
2. Check browser console for frontend errors
3. Check backend logs for API errors
4. Verify all environment variables are set correctly












