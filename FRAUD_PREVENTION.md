# Fraud Prevention Features

## Overview
Multiple layers of fraud prevention have been implemented to prevent users from creating multiple accounts to abuse the $10 free credit.

## Protection Mechanisms

### 1. **IP Address Tracking**
- Maximum **2 accounts per IP address** (reduced from 5)
- Tracks both `ipAddress` and `registrationIP` separately
- Blocks registration if IP has already created 2 accounts
- Checks for accounts created within last 24 hours from same IP

### 2. **Device Fingerprinting**
- Creates a unique fingerprint from:
  - User-Agent string
  - Accept-Language header
  - Accept-Encoding header
- Maximum **2 accounts per device fingerprint**
- Prevents same device from creating multiple accounts

### 3. **Email Pattern Detection**
- Detects similar email patterns from same IP (e.g., test1@gmail.com, test2@gmail.com)
- Blocks if 3+ similar patterns found from same IP
- Detects random email patterns (e.g., abc1234@, xyz5678@)
- Flags suspicious email patterns with many numbers

### 4. **Disposable Email Blocking**
- Blocks known disposable email services:
  - tempmail.com, 10minutemail.com, guerrillamail.com
  - mailinator.com, throwaway.email, temp-mail.org
  - getnada.com, mohmal.com, fakeinbox.com
  - trashmail.com, yopmail.com, sharklasers.com
  - And many more...

### 5. **Rate Limiting**
- **2 accounts per hour** per IP address (reduced from 3)
- **5 registration attempts per hour** per IP address
- Prevents rapid-fire account creation

### 6. **Registration Attempt Tracking**
- All registration attempts are logged in `RegistrationAttempt` collection
- Tracks: IP, email, user agent, fingerprint, success/failure
- Auto-deletes after 24 hours
- Used to detect suspicious patterns

### 7. **Credit Usage Tracking**
- Tracks when users first use their credit (`hasUsedCredit` flag)
- Records `firstOrderDate` when first order is placed
- Helps identify accounts that never use credit (potential abuse)

### 8. **Google OAuth Protection**
- Same fraud checks apply to Google Sign-In
- IP and fingerprint tracking for Google accounts
- Prevents creating multiple Google accounts from same device/IP

## Error Messages Users Will See

1. **"Too many accounts from this IP address. Maximum 2 accounts per IP allowed."**
   - User has already created 2 accounts from this IP

2. **"Too many accounts created recently from this IP address"**
   - 2+ accounts created in last 24 hours from same IP

3. **"Multiple accounts detected from same device"**
   - Same device fingerprint used for multiple accounts

4. **"Multiple accounts with similar email patterns detected"**
   - Similar email patterns (test1@, test2@, test3@) from same IP

5. **"Disposable email addresses are not allowed"**
   - User tried to use a disposable email service

6. **"Suspicious email pattern detected"**
   - Random email pattern with many numbers from same IP

7. **"Too many registration attempts from this IP address"**
   - 5+ registration attempts in last hour

## Database Models

### User Model - New Fields
- `registrationIP`: IP address used during registration
- `deviceFingerprint`: Browser/device fingerprint
- `hasUsedCredit`: Boolean - tracks if user has used their credit
- `firstOrderDate`: Date - when user placed first order
- `flaggedForReview`: Boolean - for manual review
- `flagReason`: String - reason for flagging

### RegistrationAttempt Model
- Tracks all registration attempts
- Auto-expires after 24 hours
- Used for pattern detection

## Monitoring & Review

Accounts can be flagged for manual review by setting:
- `flaggedForReview: true`
- `flagReason: "reason here"`

## Configuration

Fraud prevention limits can be adjusted in:
- `server/middleware/fraudPrevention.js`
- `server/routes/auth.js`

## Testing

To test fraud prevention:
1. Try creating 3 accounts from same IP - should be blocked
2. Try using disposable email - should be blocked
3. Try creating accounts with similar emails (test1@, test2@) - should be blocked after 3
4. Try creating accounts rapidly - rate limiting should kick in

## Future Enhancements

Potential additions:
- Phone number verification
- Credit card verification (even for $0 transactions)
- CAPTCHA on registration
- Machine learning for pattern detection
- Browser extension detection
- VPN/proxy detection

