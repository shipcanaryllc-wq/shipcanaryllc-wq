# Google OAuth Setup Guide

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" or "Google Identity"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - If prompted, configure the OAuth consent screen first:
     - Choose "External" (unless you have a Google Workspace)
     - Fill in the required fields (App name, User support email, Developer contact)
     - Add scopes: `email` and `profile`
     - Add test users if needed
   - Application type: "Web application"
   - Name: "ShipCanary"
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `http://localhost:5001` (for development)
     - Your production domain (when deployed)
   - Authorized redirect URIs:
     - `http://localhost:5001/api/auth/google/callback`
     - Your production callback URL (when deployed)
   - Click "Create"
5. Copy the **Client ID** and **Client Secret**

## Step 2: Update Environment Variables

Add these to your `server/.env` file:

```env
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
FRONTEND_URL=http://localhost:3000
```

## Step 3: Restart the Server

After adding the environment variables, restart your server:

```bash
cd server
PORT=5001 node index.js
```

## Step 4: Test Google Sign-In

1. Go to your login or register page
2. Click "Continue with Google"
3. You should be redirected to Google's sign-in page
4. After signing in, you'll be redirected back and logged in

## How It Works

- Users can sign in with their Google account
- If a user with that email already exists, the Google account is linked
- If no user exists, a new account is created with $10 free credit
- Google-authenticated users don't need a password

## Production Deployment

When deploying to production:

1. Update Google OAuth credentials:
   - Add your production domain to "Authorized JavaScript origins"
   - Add your production callback URL to "Authorized redirect URIs"
   - Example: `https://yourdomain.com/api/auth/google/callback`

2. Update environment variables:
   ```env
   GOOGLE_CLIENT_ID=your-production-client-id
   GOOGLE_CLIENT_SECRET=your-production-client-secret
   FRONTEND_URL=https://yourdomain.com
   ```

3. Make sure your OAuth consent screen is published (not in testing mode) for public use

