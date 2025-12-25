# Get Fresh Connection String from MongoDB Atlas

The DNS lookup is failing, which suggests the connection string might be outdated. Let's get a fresh one.

## Steps:

1. **In MongoDB Atlas**, on the Clusters page (where you see Cluster0)

2. **Click the "Connect" button** (next to Cluster0)

3. **Choose "Connect your application"**

4. **Select:**
   - Driver: **"Node.js"**
   - Version: **"5.5 or later"** (or the latest version shown)

5. **Copy the connection string** - it will look like:
   ```
   mongodb+srv://shipcanary:<password>@cluster0.sackvan.mongodb.net/?appName=Cluster0
   ```

6. **Replace `<password>` with your actual password** (`Jacob123`)

7. **Add the database name** - add `/shipcanary` before the `?`:
   ```
   mongodb+srv://shipcanary:Jacob123@cluster0.sackvan.mongodb.net/shipcanary?retryWrites=true&w=majority&appName=Cluster0
   ```

8. **Update your `.env` file** with this fresh connection string

9. **Restart the server**

## Alternative: Check if Cluster Hostname Changed

Sometimes MongoDB Atlas changes the cluster hostname. The fresh connection string will have the correct one.

