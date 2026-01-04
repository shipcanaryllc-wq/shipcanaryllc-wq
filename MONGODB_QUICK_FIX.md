# MongoDB Network Error - Quick Fix

## Step 1: Check MongoDB Atlas Dashboard
1. Go to https://cloud.mongodb.com/
2. Log in to your account
3. Check your cluster status:
   - If it shows **"Paused"** → Click **"Resume"** and wait 2-3 minutes
   - If it shows **"Running"** → Continue to Step 2

## Step 2: Check Network Access (IP Whitelist)
1. In MongoDB Atlas, click **"Network Access"** in the left sidebar
2. Make sure `0.0.0.0/0` is listed and shows **"Active"**
3. If not:
   - Click **"Add IP Address"**
   - Click **"Allow access from anywhere"** (adds `0.0.0.0/0`)
   - Click **"Confirm"**
   - Wait 2-3 minutes

## Step 3: Get Fresh Connection String
1. In MongoDB Atlas, click **"Database"** → **"Clusters"**
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** and version **"5.5 or later"**
5. Copy the connection string
6. Replace `<password>` with your actual database password
7. Add `/shipcanary` before the `?` (if not already there)

Example:
```
mongodb+srv://shipcanary:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/shipcanary?retryWrites=true&w=majority
```

## Step 4: Update server/.env
1. Open `server/.env` file
2. Update the `MONGODB_URI` line with your fresh connection string
3. Save the file

## Step 5: Restart Server
The server should auto-restart if using nodemon, or restart manually:
```bash
# Stop current server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

## Step 6: Verify Connection
Look for this message in server logs:
```
✅ MongoDB connected successfully
```

If you still see errors, check:
- Password has no special characters that need URL encoding
- Connection string has `/shipcanary` before the `?`
- Cluster is fully resumed (wait 2-3 minutes after resuming)

