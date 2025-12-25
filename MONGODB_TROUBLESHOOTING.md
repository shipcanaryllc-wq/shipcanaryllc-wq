# MongoDB Connection Troubleshooting

## Current Issue
The MongoDB Atlas cluster cannot be reached. The DNS lookup for `cluster0.sackvan.mongodb.net` is failing.

## Possible Causes

1. **Cluster is Paused**: MongoDB Atlas free tier clusters pause after 1 week of inactivity
2. **Cluster was Deleted**: The cluster might have been deleted
3. **Connection String is Outdated**: The connection string might be from an old cluster
4. **Network/DNS Issues**: Local network or DNS problems

## How to Fix

### Step 1: Check Cluster Status
1. Go to https://cloud.mongodb.com/
2. Log in to your account
3. Check if your cluster is:
   - **Running** (green status)
   - **Paused** (needs to be resumed)
   - **Deleted** (needs to be recreated)

### Step 2: If Cluster is Paused
1. Click on your cluster
2. Click "Resume" or "Resume Cluster"
3. Wait 2-3 minutes for it to start
4. Try connecting again

### Step 3: Get Fresh Connection String
1. In MongoDB Atlas, click "Connect" on your cluster
2. Choose "Connect your application"
3. Select "Node.js" and version "5.5 or later"
4. Copy the new connection string
5. Update `server/.env` with the new `MONGODB_URI`

### Step 4: Verify Network Access
1. Go to "Network Access" in MongoDB Atlas
2. Make sure `0.0.0.0/0` is listed (or your current IP)
3. If not, click "Add IP Address" and add `0.0.0.0/0`

### Step 5: Verify Database User
1. Go to "Database Access" in MongoDB Atlas
2. Make sure the user `shipcanary` exists
3. Make sure the password matches what's in your `.env` file
4. If not, create a new user or reset the password

## Test Connection
After fixing the above, test the connection:
```bash
cd server
node -e "const mongoose = require('mongoose'); require('dotenv').config(); mongoose.connect(process.env.MONGODB_URI).then(() => {console.log('✅ Connected!'); process.exit(0);}).catch(err => {console.error('❌ Error:', err.message); process.exit(1);});"
```

## Alternative: Use Local MongoDB
If you prefer to use local MongoDB instead:
1. Install MongoDB locally: `brew install mongodb-community`
2. Start MongoDB: `brew services start mongodb-community`
3. Update `server/.env`: `MONGODB_URI=mongodb://localhost:27017/shipcanary`

