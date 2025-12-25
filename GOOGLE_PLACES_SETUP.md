# Google Places API Setup for Address Autocomplete

To enable address autocomplete functionality, you need to set up a Google Places API key.

## Step-by-Step Guide to Get Your API Key:

### 1. Go to Google Cloud Console
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account (or create one if you don't have it)

### 2. Create or Select a Project
   - Click the project dropdown at the top of the page
   - Click "New Project"
   - Enter a project name (e.g., "ShipCanary")
   - Click "Create"
   - Wait for the project to be created, then select it from the dropdown

### 3. Enable the Places API
   - In the left sidebar, go to "APIs & Services" > "Library"
   - Search for "Places API" (make sure it's "Places API", not "Places API (New)")
   - Click on "Places API"
   - Click the "Enable" button
   - Wait for it to enable (may take a few seconds)

### 4. Create an API Key
   - In the left sidebar, go to "APIs & Services" > "Credentials"
   - Click "+ CREATE CREDENTIALS" at the top
   - Select "API key"
   - Your API key will be created and displayed
   - **Copy this key immediately** - you'll need it in the next step
   - Click "Close" (you can restrict it later for security)

### 5. (Optional but Recommended) Restrict the API Key
   - Click on the API key you just created (or go back to Credentials and click on it)
   - Under "API restrictions", select "Restrict key"
   - Check "Places API" in the list
   - Under "Application restrictions", you can restrict by HTTP referrer (for web apps)
   - Click "Save"

### 6. Add the API Key to Your Project
   - Open or create the file: `client/.env`
   - Add this line (replace `your_api_key_here` with your actual key):
     ```
     REACT_APP_GOOGLE_PLACES_API_KEY=your_api_key_here
     ```
   - Save the file

### 7. Restart Your Development Server
   - Stop the React development server (press Ctrl+C in the terminal)
   - Navigate to the client directory: `cd client`
   - Run `npm start` again

### 8. Test the Autocomplete
   - Go to the "Create Label" page in your app
   - Click "Enter New" for From Address or To Address
   - Start typing in the "Street Address" field (e.g., "103 Bur" or "3333")
   - You should see address suggestions appear in a dropdown below the input field
   - Click on a suggestion to auto-fill all address fields

## Important Notes:

- **Free Tier**: Google provides $200 in free credits per month, which is usually enough for development and small-scale use
- **Billing**: You may need to set up a billing account, but you won't be charged unless you exceed the free tier
- **Security**: Always restrict your API key to only the APIs you need (Places API) and optionally by domain/IP

## Troubleshooting:

- **Suggestions don't appear**: 
  - Check the browser console (F12) for errors
  - Verify the API key is correct in your `.env` file
  - Make sure the Places API is enabled in Google Cloud Console
  - Ensure you restarted the development server after adding the key

- **API key errors**:
  - Make sure there are no extra spaces in your `.env` file
  - Verify the key starts with "AIza" (Google API keys start with this)
  - Check that billing is enabled if required

- **Still not working?**:
  - Check that `REACT_APP_GOOGLE_PLACES_API_KEY` is spelled correctly in `.env`
  - Make sure the `.env` file is in the `client` directory, not the root directory
  - Try clearing your browser cache and refreshing

