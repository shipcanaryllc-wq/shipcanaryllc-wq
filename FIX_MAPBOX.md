# Fix Mapbox API Issues

## Quick Fix Steps

### 1. Restart React Development Server

The React app needs to be restarted to load environment variables from `.env`:

```bash
# Stop the current React server (Ctrl+C in the terminal where it's running)
# Then restart:
cd client
npm start
```

### 2. Check Browser Console

Open your browser's developer console (F12) and look for:
- ✅ "Mapbox access token found" - means token is loaded
- ❌ "Mapbox access token not found" - means token isn't being read
- Any error messages about Mapbox API calls

### 3. Verify Environment Variable

Make sure `client/.env` contains:
```
REACT_APP_MAPBOX_ACCESS_TOKEN=pk.eyJ1Ijoic2hpcGNhbmFyeSIsImEiOiJjbWlqaDN3bWswZ3k2M2VweWRwZG83eDZwIn0.k1MbFlbaxMrkkq4KIoasCg
```

**Important**: 
- Must start with `REACT_APP_` prefix
- No spaces around the `=` sign
- File must be in `client/` directory, not root

### 4. Test the API Directly

The token is valid and working. Test it:
```bash
curl "https://api.mapbox.com/geocoding/v5/mapbox.places/103%20Bur.json?access_token=pk.eyJ1Ijoic2hpcGNhbmFyeSIsImEiOiJjbWlqaDN3bWswZ3k2M2VweWRwZG83eDZwIn0.k1MbFlbaxMrkkq4KIoasCg&country=us&types=address&autocomplete=true&limit=5"
```

If this returns results, the API is working.

### 5. Common Issues

**Issue: Token not found in React**
- **Fix**: Restart React dev server after adding/changing `.env`
- **Fix**: Make sure variable name starts with `REACT_APP_`
- **Fix**: Check for typos in variable name

**Issue: API returns 401 (Unauthorized)**
- **Fix**: Check token is correct (starts with `pk.`)
- **Fix**: Verify token hasn't been revoked in Mapbox account

**Issue: API returns 403 (Forbidden)**
- **Fix**: Enable Geocoding API in Mapbox account settings
- **Fix**: Check token has geocoding permissions

**Issue: Suggestions don't appear**
- **Fix**: Check browser console for errors
- **Fix**: Make sure you're typing in the "Street Address" field
- **Fix**: Type at least 2 characters
- **Fix**: Check network tab to see if API calls are being made

### 6. Debug Steps

1. Open browser console (F12)
2. Go to Create Label page
3. Click "Enter New" for an address
4. Type in Street Address field (e.g., "103 Bur")
5. Look for console logs:
   - "Mapbox access token found" ✅
   - "Mapbox API call: ..." ✅
   - "Mapbox response: ..." ✅
   - Any error messages ❌

### 7. Still Not Working?

If suggestions still don't appear after restarting:

1. **Clear browser cache** and hard refresh (Cmd+Shift+R on Mac)
2. **Check Network tab** in browser DevTools to see if API calls are being made
3. **Verify the input field** - make sure you're typing in the correct field
4. **Check for JavaScript errors** in console that might be blocking the code

## Current Status

✅ Token is valid and API is working
✅ `.env` file exists in correct location
✅ Token format is correct

**Most likely fix**: Restart the React development server to load the environment variable.



