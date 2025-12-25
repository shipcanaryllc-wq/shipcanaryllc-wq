# MongoDB Setup Guide

## Quick Fix: Registration Failed Error

The "Registration failed" error is because **MongoDB is not running**. 

## Option 1: MongoDB Atlas (Easiest - Recommended) ⭐

1. **Go to:** https://www.mongodb.com/cloud/atlas
2. **Sign up** for free account
3. **Create a free cluster** (M0 - Free tier)
4. **Create database user:**
   - Database Access → Add New User
   - Username: `shipcanary`
   - Password: (create a strong password)
5. **Whitelist IP:**
   - Network Access → Add IP Address
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
6. **Get connection string:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `shipcanary`

7. **Update `server/.env`:**
   ```
   MONGODB_URI=mongodb+srv://shipcanary:Jacobrocks41@cluster0.xxxxx.mongodb.net/shipcanary?retryWrites=true&w=majority
   ```

8. **Restart the server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

## Option 2: Install MongoDB Locally

### macOS (Homebrew):
```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

### Verify MongoDB is running:
```bash
brew services list | grep mongodb
# Should show: mongodb-community started
```

## After Setup

1. **Check connection:**
   - Look for "✅ MongoDB connected successfully" in server logs
   - No more "Registration failed" errors!

2. **Test registration:**
   - Go to http://localhost:3000
   - Click "Sign Up"
   - Create an account
   - Should work now! 🎉

## Troubleshooting

- **Still getting errors?**
  - Check server console for MongoDB connection messages
  - Verify MONGODB_URI in `server/.env` is correct
  - Make sure MongoDB service is running

- **MongoDB Atlas connection issues?**
  - Check your IP is whitelisted
  - Verify username/password in connection string
  - Make sure cluster is running (not paused)

