# BTCPayServer Vault Setup Guide

BTCPayServer Vault is a separate application that manages wallets for BTCPay Server. This guide will help you set it up.

## What is BTCPayServer Vault?

BTCPayServer Vault is a secure wallet management application that:
- Stores your wallet private keys securely
- Connects to BTCPay Server to enable payments
- Works with hardware wallets and software wallets

## Setup Options

### Option 1: Use BTCPay's Built-in Wallet (Easier - Recommended First)

Before setting up Vault, try the simpler option:

1. **In BTCPay Server Dashboard**, look for "Set up a wallet" button
2. **Click it** and choose "Create a new wallet" or "Connect an existing wallet"
3. **Follow the prompts** - BTCPay will create a wallet for you automatically

**This is much easier than Vault setup!**

---

### Option 2: Set Up BTCPayServer Vault (Advanced)

If you specifically need Vault (or BTCPay requires it), follow these steps:

## Step 1: Download BTCPayServer Vault

1. **Go to**: https://github.com/btcpayserver/BTCPayServer.Vault/releases
2. **Download the latest release** for your operating system:
   - **macOS**: Download the `.dmg` file or `.pkg` file
   - **Windows**: Download the `.exe` file
   - **Linux**: Download the appropriate package

## Step 2: Install BTCPayServer Vault

### For macOS:

1. **Open the downloaded file** (`.dmg` or `.pkg`)
2. **Drag BTCPayServer Vault to Applications** (if `.dmg`)
   - Or run the installer (if `.pkg`)
3. **Open Applications** and launch "BTCPayServer Vault"
4. **If you get a security warning**:
   - Go to System Preferences → Security & Privacy
   - Click "Open Anyway" next to the blocked app

### For Windows:

1. **Run the `.exe` installer**
2. **Follow the installation wizard**
3. **Launch BTCPayServer Vault** from Start Menu

### For Linux:

```bash
# For Debian/Ubuntu (.deb file)
sudo dpkg -i btcpayvault*.deb

# For RPM-based systems (.rpm file)
sudo rpm -i btcpayvault*.rpm
```

## Step 3: Set Up Your Wallet in Vault

1. **Launch BTCPayServer Vault**
2. **Create a new wallet** or **import an existing one**:
   - **New wallet**: Vault will generate a new wallet for you
   - **Import wallet**: If you have an existing wallet, you can import it
3. **Save your recovery phrase** (if creating new wallet):
   - Write it down securely
   - Store it in a safe place
   - **Never share it with anyone!**

## Step 4: Connect Vault to BTCPay Server

1. **In BTCPayServer Vault**, you should see connection options
2. **Get the connection URL** from your BTCPay Server:
   - Go to your BTCPay Server store
   - Go to **Settings → Wallets → Bitcoin**
   - Look for "Connect Vault" or "Vault Connection" option
   - Copy the connection URL or QR code

3. **In BTCPayServer Vault**:
   - Paste the connection URL or scan the QR code
   - Click "Connect"

## Step 5: Verify Connection

1. **In BTCPay Server**, go to **Settings → Wallets**
2. **You should see your wallet connected**
3. **The wallet status should show as "Connected"**

---

## Troubleshooting

### Vault won't connect to BTCPay Server

- **Check firewall**: Make sure ports aren't blocked
- **Check URL**: Verify the connection URL is correct
- **Check network**: Ensure both apps can communicate

### Can't find Vault connection option in BTCPay

- **Check BTCPay version**: Vault requires BTCPay Server v1.0.7.0 or later
- **Check store settings**: Go to Settings → Wallets → Bitcoin
- **Try alternative**: Use the built-in wallet option instead

### Security warning on macOS

1. **Go to System Preferences → Security & Privacy**
2. **Click "Open Anyway"** if the app is blocked
3. **Or right-click the app** → Open → Confirm

---

## Alternative: Use Built-in Wallet (No Vault Needed)

If Vault setup is too complex, you can use BTCPay's built-in wallet:

1. **In BTCPay Server Dashboard**
2. **Click "Set up a wallet"**
3. **Choose "Create a new wallet"**
4. **Follow the simple setup process**

This doesn't require Vault and works for most use cases!

---

## Need More Help?

- **BTCPayServer Vault Docs**: https://docs.btcpayserver.org/Vault/
- **BTCPayServer Docs**: https://docs.btcpayserver.org/
- **GitHub Issues**: https://github.com/btcpayserver/BTCPayServer.Vault/issues



