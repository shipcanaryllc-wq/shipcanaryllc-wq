# Avatar Upload Fix - Multipart/Form-Data Implementation

## Problem
Profile picture upload was failing with `413 Payload Too Large` because base64 images were being sent as JSON, exceeding server limits.

## Solution
Implemented multipart/form-data uploads with multer, Cloudinary integration (with local fallback), and proper file validation.

---

## Backend Implementation

### 1. `server/services/uploadService.js` (NEW)
```javascript
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary if credentials are provided
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

const uploadImage = async (fileBuffer, mimetype, userId) => {
  // Try Cloudinary first if configured
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'avatars',
            public_id: `user-${userId}`,
            overwrite: true,
            resource_type: 'image',
            transformation: [
              { width: 400, height: 400, crop: 'fill', gravity: 'face' },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              console.log('Image uploaded to Cloudinary:', result.secure_url);
              resolve(result.secure_url);
            }
          }
        );
        
        uploadStream.end(fileBuffer);
      });
    } catch (error) {
      console.error('Cloudinary upload failed, falling back to local storage:', error);
    }
  }

  // Fallback: Save to local /uploads folder
  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const extension = mimetype.split('/')[1];
  const filename = `avatar-${userId}-${Date.now()}.${extension}`;
  const filepath = path.join(uploadsDir, filename);

  fs.writeFileSync(filepath, fileBuffer);

  const baseUrl = process.env.BACKEND_URL || process.env.FRONTEND_URL || 'http://localhost:5001';
  const uploadUrl = `${baseUrl}/uploads/${filename}`;

  console.warn('⚠️  WARNING: Using local file storage. This will NOT persist on Railway/Render.');
  console.warn('⚠️  Configure Cloudinary (CLOUDINARY_*) for production use.');

  return uploadUrl;
};

module.exports = { uploadImage };
```

### 2. `server/routes/users.js` - PUT /api/users/me
```javascript
const multer = require('multer');
const { uploadImage } = require('../services/uploadService');

// Configure multer for memory storage (2MB limit)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
    }
  }
});

// Update current user profile (multipart/form-data)
router.put('/me', 
  auth,
  upload.single('avatar'), // Handle single file upload with field name 'avatar'
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Handle text fields from form-data
      const { name, businessName } = req.body;

      // Update name if provided
      if (name !== undefined) {
        const trimmedName = typeof name === 'string' ? name.trim() : '';
        if (trimmedName.length > 100) {
          return res.status(400).json({ message: 'Name must be 100 characters or less' });
        }
        user.name = trimmedName || null;
      }

      // Update businessName if provided
      if (businessName !== undefined) {
        const trimmedBusinessName = typeof businessName === 'string' ? businessName.trim() : '';
        if (trimmedBusinessName.length > 100) {
          return res.status(400).json({ message: 'Business name must be 100 characters or less' });
        }
        user.businessName = trimmedBusinessName || null;
      }

      // Handle avatar file upload if provided
      if (req.file) {
        try {
          // Validate file size (multer already checks, but double-check)
          if (req.file.size > 2 * 1024 * 1024) {
            return res.status(400).json({ message: 'File size exceeds 2MB limit' });
          }

          // Validate mimetype
          const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
          if (!allowedMimes.includes(req.file.mimetype)) {
            return res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' });
          }

          // Upload image and get URL
          const avatarUrl = await uploadImage(req.file.buffer, req.file.mimetype, user._id.toString());
          user.avatarUrl = avatarUrl;
        } catch (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          return res.status(500).json({ message: 'Failed to upload avatar image' });
        }
      }

      await user.save();

      // Return updated user object
      res.json({
        id: user._id,
        email: user.email,
        name: user.name || null,
        businessName: user.businessName || null,
        avatarUrl: user.avatarUrl || user.picture || null,
        balance: user.balance
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      
      // Handle multer errors
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File size exceeds 2MB limit' });
        }
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: error.message || 'Server error' });
    }
  }
);
```

### 3. `server/index.js` - Static File Serving
```javascript
// Static file serving for uploads (local storage fallback)
// WARNING: This won't persist on Railway/Render unless using persistent volumes
const uploadsPath = path.join(__dirname, 'uploads');
if (require('fs').existsSync(uploadsPath)) {
  app.use('/uploads', express.static(uploadsPath));
  console.log('[STARTUP] Static uploads folder enabled:', uploadsPath);
}
```

---

## Frontend Implementation

### `client/src/components/Dashboard/Profile.js` - handleSubmit
```javascript
const [formData, setFormData] = useState({
  name: '',
  businessName: ''
});

const [avatarFile, setAvatarFile] = useState(null);

const handleAvatarChange = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    setError('Please select a valid image file (JPEG, PNG, or WebP)');
    return;
  }

  // Validate file size (2MB max)
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    setError('Image size must be less than 2MB');
    return;
  }

  // Store file object for upload
  setAvatarFile(file);
  
  // Create preview URL for display
  const reader = new FileReader();
  reader.onloadend = () => {
    setAvatarPreview(reader.result);
    setError('');
  };
  reader.readAsDataURL(file);
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setSaving(true);
  setError('');
  setSuccess('');

  try {
    const token = localStorage.getItem('token');
    
    // Create FormData for multipart/form-data upload
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name || '');
    formDataToSend.append('businessName', formData.businessName || '');
    
    // Append avatar file if selected
    if (avatarFile) {
      formDataToSend.append('avatar', avatarFile);
    }

    const response = await axios.put(`${API_BASE_URL}/users/me`, formDataToSend, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    // Update user in context (this will refresh header avatar/name)
    await fetchUser();
    
    // Clear file selection after successful upload
    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    setSuccess('Profile updated successfully!');
    setTimeout(() => setSuccess(''), 3000);
  } catch (error) {
    console.error('Error updating profile:', error);
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error ||
                        error.message || 
                        'Failed to update profile';
    setError(errorMessage);
  } finally {
    setSaving(false);
  }
};
```

---

## Environment Variables

### Cloudinary (Recommended for Production)
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Local Storage Fallback (Development Only)
No additional env vars needed. Files will be saved to `server/uploads/` folder.
**WARNING**: This won't persist on Railway/Render unless using persistent volumes.

---

## Dependencies Added

### `server/package.json`
```json
{
  "dependencies": {
    "multer": "^1.4.5-lts.1",
    "cloudinary": "^1.41.0"
  }
}
```

---

## Request/Response Examples

### Request (PUT /api/users/me)
```
Headers:
  Authorization: Bearer <token>
  Content-Type: multipart/form-data

Body (FormData):
  name: "John Doe"
  businessName: "My Business"
  avatar: <File object>
```

### Response (Success)
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "John Doe",
  "businessName": "My Business",
  "avatarUrl": "https://res.cloudinary.com/.../user-user_id.jpg",
  "balance": 10.00
}
```

### Response (Error - File Too Large)
```json
{
  "message": "File size exceeds 2MB limit"
}
```

### Response (Error - Invalid File Type)
```json
{
  "message": "Invalid file type. Only JPEG, PNG, and WebP images are allowed."
}
```

---

## Features

✅ **Multipart/form-data upload** - No more base64 JSON payloads
✅ **Multer integration** - Memory storage with 2MB limit
✅ **Cloudinary support** - Production-ready image hosting
✅ **Local fallback** - Works in development without Cloudinary
✅ **File validation** - MIME type and size checks
✅ **Automatic header update** - Avatar/name updates immediately after save
✅ **Error handling** - Clear error messages for all failure cases

---

## Testing

1. **Upload avatar**: Select image → Click "Save Changes" → Verify header updates
2. **File size limit**: Try uploading >2MB file → Should show error
3. **File type validation**: Try uploading non-image → Should show error
4. **Profile update**: Change name/business → Save → Verify persistence
5. **Remove avatar**: Click "Remove" → Save → Verify avatar clears

