# Check Database User Settings

Since Network Access is correctly configured, the issue might be with the database user.

## Steps to Check Database User

1. **Go to Database Access**:
   - In MongoDB Atlas, click **"Database Access"** in the left sidebar
   - (It's under "Security" section)

2. **Find the User**:
   - Look for user: `shipcanary`
   - Check if it exists

3. **If User Doesn't Exist**:
   - Click **"Add New Database User"**
   - Authentication: **"Password"**
   - Username: `shipcanary`
   - Password: `Jacob123` (or create a new one)
   - Database User Privileges: **"Read and write to any database"**
   - Click **"Add User"**

4. **If User Exists**:
   - Click the **"Edit"** button (pencil icon) next to `shipcanary`
   - Click **"Edit Password"**
   - Enter password: `Jacob123`
   - Click **"Update User"**
   - Make sure privileges are set to **"Read and write to any database"**

5. **Verify Cluster is Running**:
   - Go to **"Database"** → **"Clusters"**
   - Make sure Cluster0 shows **"Running"** (green status)
   - If it shows "Paused", click **"Resume"** and wait 2-3 minutes

6. **Wait 2-3 minutes** after making changes

7. **Test Again** - Try registering or logging in

## Alternative: Test with MongoDB Compass

If you have MongoDB Compass installed, you can test the connection directly:
- Connection string: `mongodb+srv://shipcanary:Jacob123@cluster0.sackvan.mongodb.net/shipcanary?retryWrites=true&w=majority&appName=Cluster0`

