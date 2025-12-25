# MongoDB IP Whitelist Quick Fix

## Your Current IP
```
185.98.171.160
```

## Quick Steps to Whitelist

1. **Go to**: https://cloud.mongodb.com/
2. **Login** to your account
3. **Click** "Network Access" (left sidebar)
4. **Click** "Add IP Address"
5. **Click** "Add Current IP Address" or enter: `185.98.171.160`
6. **Click** "Confirm"
7. **Wait** 1-2 minutes

## Or Allow All IPs (Development Only)

1. **Go to**: https://cloud.mongodb.com/
2. **Click** "Network Access"
3. **Click** "Add IP Address"
4. **Click** "Allow Access from Anywhere"
5. **Enter**: `0.0.0.0/0`
6. **Click** "Confirm"

⚠️ **Warning**: Only use `0.0.0.0/0` for development!

## After Whitelisting

- Wait 1-2 minutes
- Refresh your browser
- Try registering/login again

## Check Your IP

If your IP changes, check it with:
```bash
curl https://api.ipify.org
```

Then whitelist the new IP in MongoDB Atlas.



