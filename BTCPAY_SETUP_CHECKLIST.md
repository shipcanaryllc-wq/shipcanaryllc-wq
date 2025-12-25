# BTCPay Setup Checklist

Use this checklist to track your setup progress.

## Prerequisites
- [ ] BTCPay Server account/instance ready
- [ ] Access to BTCPay Server admin panel

## Step 1: Create Store
- [ ] Logged into BTCPay Server
- [ ] Created a new store
- [ ] **Store ID**: `_________________` (copy this)
- [ ] **BTCPay URL**: `_________________` (copy this)

## Step 2: Generate API Key
- [ ] Went to Account → API Keys
- [ ] Created new API key
- [ ] Selected permissions:
  - [ ] `btcpay.store.canviewinvoices`
  - [ ] `btcpay.store.cancreateinvoice`
- [ ] Selected your store
- [ ] **API Key**: `_________________` (copy this - you won't see it again!)

## Step 3: Set Up Webhook
- [ ] Went to Store Settings → Webhooks
- [ ] Created new webhook
- [ ] Set webhook URL (production or ngrok URL)
- [ ] Selected events:
  - [ ] InvoiceSettled
  - [ ] InvoiceProcessing
  - [ ] InvoiceExpired
  - [ ] InvoiceInvalid
- [ ] **Webhook Secret**: `_________________` (copy this)

## Step 4: Configure Environment Variables
- [ ] Opened `server/.env` file
- [ ] Added `BTCPAY_URL=`
- [ ] Added `BTCPAY_API_KEY=`
- [ ] Added `BTCPAY_STORE_ID=`
- [ ] Added `BTCPAY_WEBHOOK_SECRET=`
- [ ] Saved the file

## Step 5: Test
- [ ] Restarted server
- [ ] Server starts without errors
- [ ] Can access "Add Balance" page
- [ ] Can create a payment
- [ ] BTCPay checkout link opens
- [ ] Payment page shows correct status

## ✅ Setup Complete!
Once all items are checked, your BTCPay integration is ready!

