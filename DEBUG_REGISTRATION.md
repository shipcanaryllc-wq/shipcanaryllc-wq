# Debugging Registration Issue

## Steps to Find the Exact Error

1. **Open Browser Developer Tools:**
   - Press `F12` or `Cmd+Option+I` (Mac)
   - Go to the "Console" tab
   - Go to the "Network" tab

2. **Try to Register Again:**
   - Fill in the registration form
   - Click "Sign Up"
   - Watch the Network tab

3. **Check the Request:**
   - Find the request to `/api/auth/register`
   - Click on it
   - Check the "Response" tab to see the exact error message

## Common Issues & Solutions

### Issue 1: MongoDB Connection Error
**Error Message:** "Database connection error" or "MongoServerError"

**Solution:**
- Check `server/.env` file
- Make sure `MONGODB_URI` has your actual password (not `<db_password>`)
- Verify MongoDB Atlas cluster is running
- Check IP whitelist in MongoDB Atlas

### Issue 2: Password Validation Error
**Error Message:** "Password must contain uppercase, lowercase, and a number"

**Solution:**
- Password must be at least 8 characters
- Must have uppercase letter (A-Z)
- Must have lowercase letter (a-z)
- Must have a number (0-9)

### Issue 3: Rate Limiting
**Error Message:** "Too many accounts created from this IP"

**Solution:**
- Wait 1 hour or restart the server

### Issue 4: Email Already Exists
**Error Message:** "User already exists"

**Solution:**
- Use a different email address
- Or try logging in instead

## Quick Test

Open your browser console and run:
```javascript
fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'Test1234'
  })
})
.then(r => r.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```

This will show you the exact error message from the server.

