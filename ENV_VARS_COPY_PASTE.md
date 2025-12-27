# 🔐 Environment Variables - Copy/Paste Ready

## Vercel Dashboard → Settings → Environment Variables

### Add these for **Production**, **Preview**, and **Development**:

---

## 📱 FRONTEND (REACT_APP_*)

```bash
REACT_APP_API_URL=https://shipcanary.com/api
REACT_APP_MAPBOX_ACCESS_TOKEN=pk.eyJ1Ijoic2hpcGNhbmFyeSIsImEiOiJjbWlqaDN3bWswZ3k2M2VweWRwZG83eDZwIn0.k1MbFlbaxMrkkq4KIoasCg
```

---

## 🔧 BACKEND (API Function)

```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://shipcanary%40admin:shipcanary@cluster0.sackvan.mongodb.net/shipcanary?retryWrites=true&w=majority
JWT_SECRET=a14f83cb31f300f9fc6fe031177ee4b902f56f812f29e2df76d8b515eaacd6d2c0e9e75350857f546f34c6e136fff42ee7583017c6721c2b1910d1a6331c7c65
SHIPLABEL_API_KEY=1657|wgVyiFEXl9yMdDnf5lVi8f4l1clywZOwGv5tNvvr5045e794
FRONTEND_URL=https://shipcanary.com
ALLOWED_ORIGINS=https://shipcanary.com,https://www.shipcanary.com
BACKEND_URL=https://shipcanary.com
VERCEL_URL=https://shipcanary.com
```

---

## 📋 Quick Setup Steps

1. **Go to Vercel Dashboard**
   - Navigate to your project
   - Click **Settings** → **Environment Variables**

2. **Add Frontend Variables**
   - Click **Add New**
   - Paste each `REACT_APP_*` variable
   - Select: **Production**, **Preview**, **Development**

3. **Add Backend Variables**
   - Click **Add New**
   - Paste each backend variable
   - Select: **Production**, **Preview**, **Development**

4. **Save and Redeploy**
   - Click **Save** after adding all variables
   - Go to **Deployments** → Click **"..."** → **Redeploy**

---

## ✅ Verification

After redeploy, check:
- ✅ Build succeeds
- ✅ `/api/health` returns 200
- ✅ Registration/login works
- ✅ No CORS errors in console


