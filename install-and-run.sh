#!/bin/bash

echo "🚀 ShipCanary Installation & Setup"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    echo "Or use Homebrew: brew install node"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install
cd ..

echo ""
echo "✅ All dependencies installed!"
echo ""
echo "⚠️  IMPORTANT: Before running, make sure to:"
echo "   1. Set up MongoDB (local or MongoDB Atlas)"
echo "   2. Create server/.env file from server/env.example"
echo "   3. Configure your MongoDB URI in server/.env"
echo ""
echo "To start the application, run:"
echo "   npm run dev"
echo ""
echo "This will start:"
echo "   - Backend server on http://localhost:5000"
echo "   - Frontend app on http://localhost:3000"
echo ""

