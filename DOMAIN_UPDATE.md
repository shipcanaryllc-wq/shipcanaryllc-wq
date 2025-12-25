# Update Environment Variables for shipcanary.com Domain

## Step 1: Update Vercel Environment Variables

Go to **Vercel** → Your Project → **Settings** → **Environment Variables**

### Update These Variables:

**1. FRONTEND_URL**
- Current: `https://shipcanaryllc-wq-glvf.vercel.app`
- **Change to**: `https://shipcanary.com`

**2. REACT_APP_API_URL**
- Current: `https://shipcanaryllc-wq-glvf.vercel.app/api`
- **Change to**: `https://shipcanary.com/api`

### Keep These The Same:
- All other variables stay the same (MONGODB_URI, JWT_SECRET, SHIPLABEL_API_KEY, etc.)

## Step 2: Update Google OAuth (if using Google login)

1. Go to **Google Cloud Console**: https://console.cloud.google.com
2. Go to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID
4. Update **Authorized JavaScript origins**:
   - Add: `https://shipcanary.com`
   - Remove old Vercel URL if needed
5. Update **Authorized redirect URIs**:
   - Add: `https://shipcanary.com/api/auth/google/callback`
   - Remove old callback URL if needed
6. **Save** changes

## Step 3: Redeploy Vercel

1. Go to **Vercel** → **Deployments** tab
2. Click **"..."** on latest deployment → **"Redeploy"**
3. Wait for deployment to complete

## Step 4: Verify Domain Setup

1. **Check DNS** (if you haven't already):
   - Make sure `shipcanary.com` DNS points to Vercel
   - In Vercel → **Settings** → **Domains**, verify domain is connected

2. **Test the site**:
   - Open: `https://shipcanary.com`
   - Try logging in
   - Check browser console for errors
   - API calls should go to `https://shipcanary.com/api`

## Step 5: Update MongoDB Atlas (if needed)

If you have IP whitelist restrictions:
1. Go to **MongoDB Atlas** → **Network Access**
2. Make sure Vercel IPs are allowed (or allow all: `0.0.0.0/0`)

## Quick Checklist

- [ ] Updated `FRONTEND_URL` to `https://shipcanary.com` in Vercel
- [ ] Updated `REACT_APP_API_URL` to `https://shipcanary.com/api` in Vercel
- [ ] Updated Google OAuth redirect URIs (if using Google login)
- [ ] Redeployed Vercel
- [ ] Verified domain is connected in Vercel
- [ ] Tested site at shipcanary.com
- [ ] API calls work correctly

