# Mapbox Setup for Address Autocomplete

To enable address autocomplete functionality, you need to set up a Mapbox access token.

## Step-by-Step Guide to Get Your Access Token:

### 1. Go to Mapbox
   - Visit: https://account.mapbox.com/
   - Sign in with your account (or create one if you don't have it - it's free)

### 2. Enable Geocoding API (IMPORTANT!)
   - Go to: https://account.mapbox.com/
   - Click on your account name (top right) > "Account"
   - Scroll down to "APIs" section
   - Make sure "Geocoding API" is enabled/checked
   - If you don't see it, you may need to add it to your account

### 3. Get Your Access Token
   - Go to: https://account.mapbox.com/access-tokens/
   - You'll see your default public token (starts with `pk.`)
   - Make sure the token has "Geocoding API" permissions enabled
   - Copy your default public token

### 4. Add the Access Token to Your Project
   - Open or create the file: `client/.env`
   - Add this line (replace `your_access_token_here` with your actual token):
     ```
     REACT_APP_MAPBOX_ACCESS_TOKEN=your_access_token_here
     ```
   - Save the file

### 5. Restart Your Development Server
   - Stop the React development server (press Ctrl+C in the terminal)
   - Navigate to the client directory: `cd client`
   - Run `npm start` again

### 6. Test the Autocomplete
   - Go to the "Create Label" page in your app
   - Click "Enter New" for From Address or To Address
   - Start typing in the "Street Address" field (e.g., "103 Bur" or "3333")
   - You should see address suggestions appear in a dropdown below the input field
   - Click on a suggestion to auto-fill all address fields

## Important Notes:

- **Enable Geocoding API**: You MUST enable the Geocoding API in your Mapbox account settings, otherwise the API calls will fail
- **Free Tier**: Mapbox provides 100,000 free geocoding requests per month, which is usually more than enough for development and small-scale use
- **No Credit Card Required**: You can use Mapbox without a credit card for the free tier
- **Security**: The public token (pk.*) is safe to use in client-side applications
- **Token Permissions**: Make sure your token has "Geocoding API" scope enabled

## Enable Geocoding API in Mapbox Account:

**IMPORTANT**: You must enable the Geocoding API in your Mapbox account:

1. Go to: https://account.mapbox.com/
2. Click on your account name (top right) > "Account settings"
3. Scroll to "APIs" or "Services" section
4. Look for "Geocoding API" and make sure it's enabled
5. If you don't see it listed, you may need to:
   - Go to: https://account.mapbox.com/billing/
   - Make sure you have a payment method or are on the free tier
   - The Geocoding API should be automatically available on free tier

## Troubleshooting:

- **Suggestions don't appear**: 
  - **First**: Open browser console (F12) and check for errors
  - Look for "Mapbox API call:" and "Mapbox response:" logs to see if API is being called
  - Verify the access token is correct in your `.env` file
  - Make sure you restarted the development server after adding the token
  - Ensure the token starts with `pk.` (public token)
  - **Check if Geocoding API is enabled** in your Mapbox account

- **Token errors**:
  - Make sure there are no extra spaces in your `.env` file
  - Verify the token is the public token, not a secret token
  - Check that the token hasn't expired

- **Still not working?**:
  - Check that `REACT_APP_MAPBOX_ACCESS_TOKEN` is spelled correctly in `.env`
  - Make sure the `.env` file is in the `client` directory, not the root directory
  - Try clearing your browser cache and refreshing

