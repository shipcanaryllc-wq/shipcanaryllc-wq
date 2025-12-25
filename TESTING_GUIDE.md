# Testing Guide - ShipCanary

## ⚠️ Important: Real Charges

**YES, creating a label will use real money from your ShippFast account balance.**

When you create a shipping label:
- It uses your **ShippFast API account** (the one with token: `4|VB6xNS1X9hrwITTJY1PtZRtxehQQrT4WoV11iCq92e03d300`)
- It **deducts the label cost** from your ShippFast account balance
- It creates a **real shipping label** via ShippFast API
- You get a **real tracking number**

## 💰 Balance System

1. **New users get $10 free credit** in the ShipCanary app (local database)
2. **Your actual ShippFast balance** is what gets charged
3. The app syncs balance from ShippFast when you:
   - Login
   - Check balance
   - Create a label

## 🧪 Safe Testing Steps

### Step 1: Check Your ShippFast Balance First
1. Go to your ShippFast dashboard: https://shippfast.net
2. Check your current balance
3. Make sure you have enough for test labels

### Step 2: Test with Small Labels
- Use the cheapest option: **USPS Ground Advantage** ($0.50)
- Test with small packages (1-2 lbs)
- Use test addresses (your own addresses)

### Step 3: Monitor Your Balance
- Check balance before creating labels
- Watch it decrease after each label
- Balance syncs automatically from ShippFast

## 📋 Testing Checklist

### Before Testing:
- [ ] Check ShippFast account balance
- [ ] Verify you have at least $5-10 for testing
- [ ] Have test addresses ready (your own addresses work)

### Test Flow:
1. **Create Account** - Get $10 free credit (local only)
2. **Add Saved Address** - Use your real address
3. **Add Saved Package** - Small test package (6x6x6, 1 lb)
4. **Create Label** - Select cheapest option ($0.50)
5. **Check Order History** - Verify label was created
6. **Download PDF** - Get the actual shipping label

## 💡 Cost Breakdown

Based on your ShippFast API:
- **USPS Priority Mail (9505)**: $0.50
- **USPS Priority Mail (9488)**: $0.50
- **USPS Ground Advantage**: $0.50
- **USPS API**: $1.90

**Recommended for testing:** Use Ground Advantage ($0.50) - cheapest option

## ⚠️ Important Notes

1. **Real Labels**: Every label created is REAL and costs money
2. **No Refunds**: Once a label is created, you can't undo it
3. **Balance Sync**: The app shows your ShippFast balance, not local balance
4. **Test Addresses**: Use real addresses (can be your own for testing)

## 🔍 How to Verify It's Working

1. **Check ShippFast Dashboard**:
   - Go to https://shippfast.net
   - View your order history
   - See the label you just created

2. **Check ShipCanary App**:
   - Order History tab shows your orders
   - Tracking numbers are real
   - PDF links work

3. **Verify Balance**:
   - Balance decreases after each label
   - Syncs with ShippFast automatically

## 🚨 If Something Goes Wrong

- **Label not created?** Check server console for errors
- **Balance not updating?** Click "Sync Balance" or refresh
- **Wrong address?** Can't change after label is created
- **Need to cancel?** Contact ShippFast support (labels can't be cancelled in app)

## 💰 Cost Estimate for Testing

- **Minimum test**: 1 label = $0.50
- **Recommended**: 2-3 labels = $1.50 - $2.50
- **Full testing**: 5-10 labels = $2.50 - $5.00

**Start with 1-2 labels to verify everything works!**

