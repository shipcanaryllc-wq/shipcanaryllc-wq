# Profile & Password Reset Implementation Summary

## Overview
Implemented a complete profile management system with avatar upload, name/business editing, and password reset functionality.

## Files Changed

### Backend Changes

#### 1. `server/models/User.js`
- **Added fields:**
  - `businessName` (String)
  - `avatarUrl` (String)
  - `passwordResetToken` (String)
  - `passwordResetExpires` (Date)

#### 2. `server/routes/auth.js`
- **Updated `/auth/me` endpoint:** Now returns `name`, `businessName`, `avatarUrl` in addition to `id`, `email`, `balance`
- **Added `/auth/request-password-reset` endpoint:**
  - POST endpoint
  - Rate limited (3 requests per hour)
  - Generates secure token, stores hashed version in DB
  - Sends password reset email
  - Always returns success (prevents email enumeration)
- **Added `/auth/reset-password` endpoint:**
  - POST endpoint
  - Validates token and expiration
  - Updates password and clears reset token
  - Single-use token (deleted after use)

#### 3. `server/routes/users.js`
- **Added `GET /api/users/me` endpoint:**
  - Returns current user profile (name, businessName, avatarUrl, email, balance)
  - Protected with auth middleware
- **Added `PUT /api/users/me` endpoint:**
  - Updates user profile (name, businessName, avatarUrl)
  - Protected with auth middleware
  - Validates input (max length, URL format for avatar)

#### 4. `server/services/emailService.js` (NEW)
- Email service for sending password reset emails
- Supports SMTP, SendGrid, or development mode (console logging)
- HTML email template with reset link

#### 5. `server/package.json`
- Added `nodemailer` dependency

### Frontend Changes

#### 1. `client/src/components/Dashboard/Dashboard.js`
- **Fixed header dropdown:**
  - Removed duplicate "hi / hi" display
  - Shows only display name (or email username if no name)
  - Displays avatar image if available
  - Profile button navigates to `/profile`

#### 2. `client/src/components/Dashboard/Dashboard.css`
- Updated dropdown styling (removed CSS variable dependencies)
- Removed `.user-username-small` duplicate display
- Improved avatar display

#### 3. `client/src/components/Dashboard/Profile.js` (NEW)
- Complete profile management page
- Two tabs: Profile and Security
- **Profile tab:**
  - Avatar upload (base64 encoding, max 2MB)
  - Full name editing
  - Business name editing
  - Email display (read-only)
- **Security tab:**
  - Password reset by email button
  - Success/error messaging

#### 4. `client/src/components/Dashboard/Profile.css` (NEW)
- Styling for profile page
- Responsive design
- Form layouts and avatar preview

#### 5. `client/src/components/Auth/ResetPassword.js` (NEW)
- Password reset page
- Validates token from URL query parameter
- Password strength validation
- Success/error handling

#### 6. `client/src/components/Auth/ResetPassword.css` (NEW)
- Styling for reset password page

#### 7. `client/src/App.js`
- Added `/profile` route (protected)
- Added `/reset-password` route (public)

#### 8. `client/src/context/AuthContext.js`
- Updated `fetchUser()` to try `/api/users/me` first, fallback to `/auth/me`
- Ensures compatibility with both endpoints

## Database Schema Changes

### User Model Updates
```javascript
{
  // Existing fields...
  name: String,
  picture: String, // Google OAuth picture (existing)
  
  // New fields:
  businessName: String,
  avatarUrl: String,
  passwordResetToken: String,
  passwordResetExpires: Date
}
```

## API Endpoints

### GET `/api/users/me` (or `/api/auth/me`)
**Request:**
```
Headers: Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "John Doe",
  "businessName": "My Business",
  "avatarUrl": "https://...",
  "balance": 10.00
}
```

### PUT `/api/users/me`
**Request:**
```
Headers: 
  Authorization: Bearer <token>
  Content-Type: application/json

Body:
{
  "name": "John Doe",
  "businessName": "My Business",
  "avatarUrl": "data:image/jpeg;base64,..." // or URL
}
```

**Response:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "John Doe",
  "businessName": "My Business",
  "avatarUrl": "data:image/jpeg;base64,...",
  "balance": 10.00
}
```

### POST `/api/auth/request-password-reset`
**Request:**
```
Body:
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

### POST `/api/auth/reset-password`
**Request:**
```
Body:
{
  "token": "reset_token_from_email",
  "password": "NewPassword123"
}
```

**Response:**
```json
{
  "message": "Password has been reset successfully. You can now log in with your new password."
}
```

## Environment Variables (Email Service)

Add these to your `.env` file for email functionality:

### Option 1: SMTP (Gmail, SendGrid SMTP, etc.)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@shipcanary.com
```

### Option 2: SendGrid API
```
SENDGRID_API_KEY=your-sendgrid-api-key
```

### Option 3: Development Mode
- No email config needed
- Emails are logged to console
- Works automatically in `NODE_ENV=development`

## Features Implemented

✅ **Header Dropdown Fix**
- Removed duplicate name display
- Shows avatar image if available
- Displays name or email username
- Profile link navigates to profile page

✅ **Profile Page**
- Avatar upload (base64, max 2MB)
- Full name editing
- Business name editing
- Real-time preview
- Save to backend
- Header updates immediately after save

✅ **Security Section**
- Password reset by email
- Rate limited (3 requests/hour)
- Secure token generation
- 1-hour expiration
- Single-use tokens

✅ **Password Reset Flow**
- Email with reset link
- Token validation
- Password strength requirements
- Success/error handling

## Testing Checklist

- [ ] Header dropdown shows only one name (no duplicate)
- [ ] Avatar displays in header if set
- [ ] Profile page loads with current user data
- [ ] Avatar upload works (preview + save)
- [ ] Name and business name can be edited and saved
- [ ] Header updates immediately after profile save
- [ ] Password reset email is sent (check console in dev mode)
- [ ] Reset link works and allows password change
- [ ] Token expires after 1 hour
- [ ] Token is single-use (can't reset twice with same token)

## Notes

- Avatar upload currently uses base64 encoding. For production, consider uploading to Cloudinary/S3 and storing the URL.
- Email service falls back to console logging in development mode if not configured.
- Password reset tokens are hashed before storage (SHA-256).
- All endpoints are protected with JWT authentication middleware.

