#!/bin/bash

# BTCPay Server Configuration Helper
# This script helps you add BTCPay configuration to your .env file

echo "🔧 BTCPay Server Configuration Helper"
echo "======================================"
echo ""

# Check if .env file exists
if [ ! -f "server/.env" ]; then
    echo "⚠️  server/.env file not found. Creating from env.example..."
    cp server/env.example server/.env
fi

echo "Please provide your BTCPay Server configuration:"
echo ""

# Get BTCPay URL
read -p "1. BTCPay Server URL (e.g., https://my-store.btcpay.org): " BTCPAY_URL
if [ -z "$BTCPAY_URL" ]; then
    echo "❌ BTCPay URL is required!"
    exit 1
fi

# Remove trailing slash if present
BTCPAY_URL=$(echo "$BTCPAY_URL" | sed 's:/*$::')

# Get API Key
read -p "2. BTCPay API Key: " BTCPAY_API_KEY
if [ -z "$BTCPAY_API_KEY" ]; then
    echo "❌ API Key is required!"
    exit 1
fi

# Get Store ID
read -p "3. BTCPay Store ID: " BTCPAY_STORE_ID
if [ -z "$BTCPAY_STORE_ID" ]; then
    echo "❌ Store ID is required!"
    exit 1
fi

# Get Webhook Secret
read -p "4. BTCPay Webhook Secret: " BTCPAY_WEBHOOK_SECRET
if [ -z "$BTCPAY_WEBHOOK_SECRET" ]; then
    echo "⚠️  Webhook Secret is optional (but recommended for production)"
    read -p "   Continue without webhook secret? (y/n): " continue_without
    if [ "$continue_without" != "y" ]; then
        exit 1
    fi
fi

echo ""
echo "📝 Adding configuration to server/.env..."
echo ""

# Remove old BTCPay config if exists
sed -i.bak '/^BTCPAY_/d' server/.env

# Add new BTCPay config
cat >> server/.env << EOF

# BTCPay Server Configuration (Added by setup script)
BTCPAY_URL=$BTCPAY_URL
BTCPAY_API_KEY=$BTCPAY_API_KEY
BTCPAY_STORE_ID=$BTCPAY_STORE_ID
BTCPAY_WEBHOOK_SECRET=$BTCPAY_WEBHOOK_SECRET
EOF

echo "✅ Configuration added to server/.env"
echo ""
echo "📋 Summary:"
echo "   BTCPay URL: $BTCPAY_URL"
echo "   Store ID: $BTCPAY_STORE_ID"
echo "   API Key: ${BTCPAY_API_KEY:0:10}... (hidden)"
echo "   Webhook Secret: ${BTCPAY_WEBHOOK_SECRET:0:10}... (hidden)"
echo ""
echo "🔄 Next steps:"
echo "   1. Restart your server: cd server && npm start"
echo "   2. Test the connection by going to Dashboard → Add Balance"
echo "   3. Check BTCPAY_SETUP_GUIDE.md for detailed instructions"
echo ""

