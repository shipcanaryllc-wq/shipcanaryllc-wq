# Cloudinary Avatar Upload Setup

## Overview
Avatar uploads are handled by Cloudinary for persistent storage. The backend requires Cloudinary credentials to be configured.

## Environment Variables (Backend Only)

**⚠️ IMPORTANT: These variables are BACKEND ONLY and must NEVER be exposed to the client bundle.**

Add these three environment variables to your Render backend service:

1. `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
2. `CLOUDINARY_API_KEY` - Your Cloudinary API key
3. `CLOUDINARY_API_SECRET` - Your Cloudinary API secret (keep this secure!)

## Render Deployment Steps

1. Go to your Render dashboard: https://dashboard.render.com
2. Select your backend service
3. Navigate to **Environment** tab
4. Click **Add Environment Variable** and add each of the three variables:
   - Key: `CLOUDINARY_CLOUD_NAME`, Value: `dgkjzehlv`
   - Key: `CLOUDINARY_API_KEY`, Value: `932994186283122`
   - Key: `CLOUDINARY_API_SECRET`, Value: `k1xhBr7hZ3nRYIfLG11AkfdXwxE`
5. Click **Save Changes**
6. Redeploy your service (Render will auto-redeploy when env vars change)

## Local Development

For local development, add these to `server/.env`:

```bash
CLOUDINARY_CLOUD_NAME=dgkjzehlv
CLOUDINARY_API_KEY=932994186283122
CLOUDINARY_API_SECRET=k1xhBr7hZ3nRYIfLG11AkfdXwxE
```

## API Endpoints

### POST /api/users/profile/avatar
- **Method:** POST
- **Auth:** Required (Bearer token)
- **Content-Type:** multipart/form-data
- **Field:** `avatar` (image file)
- **Success:** 200 with updated user object including `avatarUrl`
- **Error 503:** `AVATAR_UPLOAD_NOT_CONFIGURED` - Cloudinary not configured
- **Error 400:** Invalid file type or size
- **Error 500:** Cloudinary upload failed

### GET /api/users/me
- Returns user object including `avatarUrl` field

## Error Handling

If Cloudinary is not configured, the backend returns:
```json
{
  "error": "AVATAR_UPLOAD_NOT_CONFIGURED",
  "message": "Avatar upload service is not configured. Please contact support."
}
```

The frontend handles this gracefully and shows a user-friendly message.

## Security Notes

- ✅ Cloudinary credentials are stored server-side only
- ✅ API secret is never exposed to client
- ✅ Upload endpoint requires authentication
- ✅ File validation (type, size) enforced
- ✅ Images stored in `shipcanary/avatars` folder on Cloudinary


