# Vercel Environment Variables - Copy & Paste

## How to Add:
1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Click **"Create new"**
3. Copy each variable below (Key and Value)
4. Set environment: **Production**, **Preview**, **Development** (select all)
5. Click **"Save"**
6. Repeat for each variable
7. **Redeploy** after adding all variables

---

## BACKEND VARIABLES (API Function)

### 1. NODE_ENV
**Key:** `NODE_ENV`  
**Value:** `production`

### 2. MONGODB_URI
**Key:** `MONGODB_URI`  
**Value:** `mongodb+srv://shipcanary%40admin:shipcanary@cluster0.sackvan.mongodb.net/shipcanary?retryWrites=true&w=majority`

### 3. JWT_SECRET
**Key:** `JWT_SECRET`  
**Value:** `a14f83cb31f300f9fc6fe031177ee4b902f56f812f29e2df76d8b515eaacd6d2c0e9e75350857f546f34c6e136fff42ee7583017c6721c2b1910d1a6331c7c65`

### 4. SHIPLABEL_API_KEY
**Key:** `SHIPLABEL_API_KEY`  
**Value:** `1657|wgVyiFEXl9yMdDnf5lVi8f4l1clywZOwGv5tNvvr5045e794`

### 5. FRONTEND_URL
**Key:** `FRONTEND_URL`  
**Value:** `https://www.shipcanary.com`

---

## FRONTEND VARIABLES (React App)

### 6. REACT_APP_API_URL
**Key:** `REACT_APP_API_URL`  
**Value:** `https://www.shipcanary.com/api`

### 7. REACT_APP_MAPBOX_ACCESS_TOKEN
**Key:** `REACT_APP_MAPBOX_ACCESS_TOKEN`  
**Value:** `pk.eyJ1Ijoic2hpcGNhbmFyeSIsImEiOiJjbWlqaDN3bWswZ3k2M2VweWRwZG83eDZwIn0.k1MbFlbaxMrkkq4KIoasCg`

---

## Quick Copy (All at Once)

If Vercel supports bulk import, you can use this format:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://shipcanary%40admin:shipcanary@cluster0.sackvan.mongodb.net/shipcanary?retryWrites=true&w=majority
JWT_SECRET=a14f83cb31f300f9fc6fe031177ee4b902f56f812f29e2df76d8b515eaacd6d2c0e9e75350857f546f34c6e136fff42ee7583017c6721c2b1910d1a6331c7c65
SHIPLABEL_API_KEY=1657|wgVyiFEXl9yMdDnf5lVi8f4l1clywZOwGv5tNvvr5045e794
FRONTEND_URL=https://www.shipcanary.com
REACT_APP_API_URL=https://www.shipcanary.com/api
REACT_APP_MAPBOX_ACCESS_TOKEN=pk.eyJ1Ijoic2hpcGNhbmFyeSIsImEiOiJjbWlqaDN3bWswZ3k2M2VweWRwZG83eDZwIn0.k1MbFlbaxMrkkq4KIoasCg
```

---

## After Adding Variables:

1. ✅ Go to **Deployments** tab
2. ✅ Click **"..."** on latest deployment
3. ✅ Click **"Redeploy"**
4. ✅ Wait for deployment to complete (~2-3 minutes)
5. ✅ Test: `curl https://www.shipcanary.com/api/health`

---

## Verification Checklist:

- [ ] All 7 variables added
- [ ] Environment scope: Production, Preview, Development (all selected)
- [ ] Redeployed after adding variables
- [ ] API health check returns JSON (not error)
- [ ] Browser console shows no CORS errors
- [ ] Registration/login works






