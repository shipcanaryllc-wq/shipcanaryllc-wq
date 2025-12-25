# ⚠️ Important: Update Your MongoDB Password

## Your MongoDB Atlas Connection String

I've updated your `server/.env` file with your MongoDB Atlas connection string, but you need to **replace `<db_password>` with your actual database password**.

## Steps:

1. **Open `server/.env` file**

2. **Find this line:**
   ```
   MONGODB_URI=mongodb+srv://shipcanary:<db_password>@cluster0.sackvan.mongodb.net/shipcanary?retryWrites=true&w=majority&appName=Cluster0
   ```

3. **Replace `<db_password>` with your actual MongoDB Atlas database password**

   For example, if your password is `MySecurePass123`, it should look like:
   ```
   MONGODB_URI=mongodb+srv://shipcanary:MySecurePass123@cluster0.sackvan.mongodb.net/shipcanary?retryWrites=true&w=majority&appName=Cluster0
   ```

4. **Save the file**

5. **Restart your server:**
   ```bash
   # Stop the current server (Ctrl+C in the terminal)
   npm run dev
   ```

6. **Check for success message:**
   - Look for: `✅ MongoDB connected successfully`
   - If you see this, you're all set! 🎉

## Security Note

⚠️ **Never commit your `.env` file to Git!** It contains sensitive passwords.

The `.env` file is already in `.gitignore`, so you're safe.

## Still Having Issues?

- Make sure your MongoDB Atlas cluster is running (not paused)
- Verify your IP address is whitelisted in MongoDB Atlas Network Access
- Check that your database user password is correct
- Look at server console for specific error messages

