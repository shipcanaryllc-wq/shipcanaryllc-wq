# Quick Start Guide

## Prerequisites

You need to install **Node.js** first:

### macOS (using Homebrew):
```bash
brew install node
```

### Or download from:
https://nodejs.org/ (Download LTS version)

## Installation Steps

1. **Install Node.js** (if not already installed)
   - Check if installed: `node --version`
   - Should show v14 or higher

2. **Install all dependencies:**
   ```bash
   cd /Users/zeeshan/Downloads/ShipCanary
   ./install-and-run.sh
   ```
   
   Or manually:
   ```bash
   npm install
   cd server && npm install && cd ..
   cd client && npm install && cd ..
   ```

3. **Set up MongoDB:**
   - **Option A (Local):** Install MongoDB locally
     ```bash
     brew install mongodb-community
     brew services start mongodb-community
     ```
   - **Option B (Cloud - Recommended):** Use MongoDB Atlas (free tier)
     - Go to https://www.mongodb.com/cloud/atlas
     - Create free cluster
     - Get connection string

4. **Configure environment:**
   ```bash
   cp server/env.example server/.env
   ```
   
   Edit `server/.env` and set:
   ```
   MONGODB_URI=mongodb://localhost:27017/shipcanary
   # OR for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shipcanary
   
   JWT_SECRET=your-super-secret-key-change-this
   ```

5. **Start the application:**
   ```bash
   npm run dev
   ```

## Access the Application

Once running, open your browser:

- **Frontend (Main App):** http://localhost:3000
- **Backend API:** http://localhost:5000/api/health

## First Time Setup

1. Go to http://localhost:3000
2. Click "Sign up" to create an account
3. You'll automatically get **$10 free credit**
4. Start creating shipping labels!

## Troubleshooting

- **Port 3000 or 5000 already in use?**
  - Kill the process or change ports in `.env` and `package.json`
  
- **MongoDB connection error?**
  - Make sure MongoDB is running
  - Check your `MONGODB_URI` in `.env`
  
- **Module not found errors?**
  - Run `npm install` in root, server, and client directories

