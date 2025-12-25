# How to Connect MongoDB Atlas

## Step-by-Step Guide

### Step 1: Go to MongoDB Atlas
1. Open your browser and go to: https://cloud.mongodb.com/
2. Log in to your MongoDB Atlas account

### Step 2: Check Network Access (IP Whitelist)
1. In the left sidebar, click **"Database & Network Access"**
2. Click the **"Network Access"** tab
3. Check if you see `0.0.0.0/0` in the list (this allows all IPs)
4. If `0.0.0.0/0` is NOT there or shows "Inactive":
   - Click the green **"Add IP Address"** button
   - Click **"Allow access from anywhere"** (this adds `0.0.0.0/0`)
   - Click **"Confirm"**
5. Wait 2-3 minutes for the change to take effect

### Step 3: Verify Database User
1. In the left sidebar, click **"Database Access"**
2. Check if the user `shipcanary` exists
3. If it doesn't exist:
   - Click **"Add New Database User"**
   - Choose **"Password"** authentication
   - Username: `shipcanary`
   - Password: `Jacob123` (or create a new one)
   - Database User Privileges: **"Read and write to any database"**
   - Click **"Add User"**
4. If the user exists but password is wrong:
   - Click the **"Edit"** button next to the user
   - Click **"Edit Password"**
   - Enter new password: `Jacob123`
   - Click **"Update User"**

### Step 4: Get Connection String
1. In the left sidebar, click **"Database"** → **"Clusters"**
2. Find your cluster (should be "Cluster0")
3. Click the **"Connect"** button
4. Choose **"Connect your application"**
5. Select:
   - Driver: **"Node.js"**
   - Version: **"5.5 or later"**
6. Copy the connection string (it will look like):
   ```
   mongodb+srv://shipcanary:<password>@cluster0.sackvan.mongodb.net/?appName=Cluster0
   ```
7. Replace `<password>` with your actual password: `Jacob123`
8. Add the database name at the end: `/shipcanary`
9. Final connection string should be:
   ```
   mongodb+srv://shipcanary:Jacob123@cluster0.sackvan.mongodb.net/shipcanary?retryWrites=true&w=majority&appName=Cluster0
   ```

### Step 5: Update Your .env File
1. Open `server/.env` file
2. Make sure the `MONGODB_URI` line matches your connection string:
   ```
   MONGODB_URI=mongodb+srv://shipcanary:Jacob123@cluster0.sackvan.mongodb.net/shipcanary?retryWrites=true&w=majority&appName=Cluster0
   ```
3. Save the file

### Step 6: Restart the Server
1. Stop the current server (if running)
2. Start it again:
   ```bash
   cd server
   PORT=5001 node index.js
   ```
3. You should see: `✅ MongoDB connected successfully`

### Step 7: Test the Connection
Try registering or logging in on your website. It should work now!

## Troubleshooting

### If connection still fails:

1. **Check Cluster Status**:
   - Make sure your cluster is **"Running"** (not paused)
   - If paused, click **"Resume"** and wait 2-3 minutes

2. **Verify Network Access**:
   - Make sure `0.0.0.0/0` shows **"Active"** status
   - If it shows "Inactive", delete it and add it again

3. **Check Password**:
   - Make sure the password in `.env` matches the password in MongoDB Atlas
   - Special characters in passwords might need URL encoding

4. **Test Connection Directly**:
   ```bash
   cd server
   node -e "const mongoose = require('mongoose'); require('dotenv').config(); mongoose.connect(process.env.MONGODB_URI, {serverSelectionTimeoutMS: 10000}).then(() => {console.log('✅ Connected!'); process.exit(0);}).catch(err => {console.error('❌ Error:', err.message); process.exit(1);});"
   ```

## Quick Checklist
- [ ] Network Access has `0.0.0.0/0` and it's Active
- [ ] Database user `shipcanary` exists with correct password
- [ ] Cluster is Running (not paused)
- [ ] Connection string in `.env` is correct
- [ ] Server has been restarted after updating `.env`

