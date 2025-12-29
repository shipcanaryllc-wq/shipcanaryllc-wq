import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';
import DashboardLayout from './DashboardLayout';
import AvatarCropper from './AvatarCropper';
import API_BASE_URL from '../../config/api';
import './Profile.css';
import './DashboardCard.css';

const Profile = () => {
  const { user, fetchUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [securityError, setSecurityError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    businessName: ''
  });
  
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      // Update form data when user changes (e.g., after fetchUser)
      setFormData({
        name: user.name || '',
        businessName: user.businessName || ''
      });
      setAvatarPreview(null); // Don't set preview from user data - let it render from user.avatarUrl
      setAvatarFile(null); // Reset file selection when user changes
    }
  }, [user?.name, user?.businessName, user?.avatarUrl]); // Only update when these specific fields change

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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

    // Read file and show cropper
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageToCrop(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    
    // Clear any previous errors
    setError('');
  };

  const handleCropComplete = async (croppedBlob) => {
    setShowCropper(false);
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // Convert blob to file
      const croppedFile = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
      formData.append('avatar', croppedFile);

      const response = await axios.post(`${API_BASE_URL}/users/profile/avatar`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update user in context immediately for instant UI update
      if (response.data) {
        // Clear preview immediately - avatar will render from user.avatarUrl
        setAvatarPreview(null);
        setImageToCrop(null);
        
        // Update user state IMMEDIATELY from response data (no waiting)
        if (updateUser && response.data) {
          updateUser({
            avatarUrl: response.data.avatarUrl,
            name: response.data.name,
            fullName: response.data.fullName,
            businessName: response.data.businessName
          });
        }
        
        // Also refresh from server in background to ensure sync
        if (fetchUser) {
          fetchUser().catch(err => console.error('Error refreshing user:', err));
        }
        
        setSuccess('Avatar updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      
      // Handle 503 AVATAR_UPLOAD_NOT_CONFIGURED
      if (error.response?.status === 503 && error.response?.data?.error === 'AVATAR_UPLOAD_NOT_CONFIGURED') {
        setError('Avatar upload service is not configured. Please contact support.');
      } else {
        const errorMessage = error.response?.data?.message || 
                            (error.response?.status === 404 ? 'Avatar upload endpoint not found. Please check server configuration.' : 'Failed to upload avatar');
        setError(errorMessage);
      }
      setAvatarPreview(null);
      setImageToCrop(null);
    } finally {
      setSaving(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCropperClose = () => {
    setShowCropper(false);
    setImageToCrop(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

      // Update user in context immediately for instant UI update
      if (response.data) {
        // Update local form data FIRST for instant UI feedback
        if (response.data.name !== undefined) {
          setFormData(prev => ({ ...prev, name: response.data.name || '' }));
        }
        if (response.data.businessName !== undefined) {
          setFormData(prev => ({ ...prev, businessName: response.data.businessName || '' }));
        }
        if (response.data.avatarUrl !== undefined) {
          setAvatarPreview(null); // Use server URL - will render from user.avatarUrl
        }
        
        // Update user state IMMEDIATELY from response data (no waiting)
        if (updateUser && response.data) {
          updateUser({
            avatarUrl: response.data.avatarUrl,
            name: response.data.name,
            fullName: response.data.fullName,
            businessName: response.data.businessName
          });
        }
        
        // Also refresh from server in background to ensure sync
        if (fetchUser) {
          fetchUser().catch(err => console.error('Error refreshing user:', err));
        }
      }
      
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

  const handlePasswordReset = async (e) => {
    // Prevent default form submission if called from a form
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log("[RESET] clicked");

    if (!user?.email) {
      console.error('[RESET] No user email available');
      setSecurityError('Unable to determine your email address. Please refresh the page.');
      return;
    }

    setLoading(true);
    setSecurityError('');
    setPasswordResetSent(false);

    try {
      const base = process.env.REACT_APP_API_URL || process.env.VITE_API_URL || API_BASE_URL;
      console.log("[RESET] base", base);

      const url = `${base}/auth/request-password-reset`;
      console.log('[RESET] calling API', {
        url,
        email: user.email
      });

      const response = await fetch(url, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email: user.email }),
      });

      const responseBody = await response.json();
      console.log('[RESET] response status:', response.status);
      console.log('[RESET] response body:', responseBody);

      if (!response.ok) {
        throw new Error(responseBody.message || `HTTP error! status: ${response.status}`);
      }

      console.log('[RESET] API call successful');

      setPasswordResetSent(true);
      setSecurityError(''); // Clear any previous errors
      setTimeout(() => {
        setPasswordResetSent(false);
      }, 5000);
    } catch (error) {
      console.error('[RESET] API call failed:', error);
      console.error('[RESET] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      // Handle rate limiting (429) specifically
      if (error.message?.includes('429') || error.response?.status === 429) {
        setSecurityError('Too many password reset requests. Please try again in an hour.');
      } else {
        setSecurityError('Failed to send password reset email');
      }
      setPasswordResetSent(false);
    } finally {
      console.log('[RESET] handler finished, setting loading to false');
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="profile-page-content">
          <p>Please log in to view your profile.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {showCropper && imageToCrop && (
        <AvatarCropper
          imageSrc={imageToCrop}
          onClose={handleCropperClose}
          onCropComplete={handleCropComplete}
        />
      )}
      <div className="profile-page-content">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-header-top">
              <button 
                className="profile-back-button"
                onClick={() => navigate('/dashboard')}
                aria-label="Back to dashboard"
              >
                <ArrowLeft size={20} />
                <span>Back</span>
              </button>
            </div>
            <div className="profile-header-content">
              <h1>Profile Settings</h1>
              <p>Manage your account information and security</p>
            </div>
          </div>

        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('profile');
              setSecurityError(''); // Clear security errors when switching tabs
            }}
          >
            Profile
          </button>
          <button
            className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('security');
              setError(''); // Clear profile errors when switching tabs
              setSuccess(''); // Clear profile success when switching tabs
            }}
          >
            Security
          </button>
        </div>

        {/* Profile tab errors/success shown inline in form */}
        {activeTab === 'profile' && error && <div className="profile-error">{error}</div>}
        {activeTab === 'profile' && success && <div className="profile-success">{success}</div>}

        {activeTab === 'profile' && (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="profile-section">
              <h2>Profile Picture</h2>
              <div className="avatar-section">
                <div className="avatar-preview">
                  {(avatarPreview || user?.avatarUrl) ? (
                    <img 
                      src={avatarPreview || user?.avatarUrl} 
                      alt="Avatar"
                      onError={(e) => {
                        // Fallback to default avatar icon on image load error
                        e.target.style.display = 'none';
                        const placeholder = e.target.parentElement.querySelector('.avatar-placeholder-default');
                        if (placeholder) {
                          placeholder.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div className="avatar-placeholder-default" style={{ display: (avatarPreview || user?.avatarUrl) ? 'none' : 'flex' }}>
                    {/* Default avatar icon */}
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="8" r="4" fill="#9ca3af"/>
                      <path d="M6 21c0-3.314 2.686-6 6-6s6 2.686 6 6" fill="#9ca3af"/>
                    </svg>
                  </div>
                </div>
                <div className="avatar-actions">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary"
                    disabled={saving}
                  >
                    {saving ? 'Uploading...' : (avatarPreview || user?.avatarUrl) ? 'Change Picture' : 'Upload Picture'}
                  </button>
                </div>
                <p className="avatar-hint">Max size: 2MB. Supported formats: JPEG, PNG, WebP</p>
              </div>
            </div>

            <div className="profile-section">
              <h2>Personal Information</h2>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="businessName">Business Name</label>
                  <input
                    type="text"
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="Enter your business name (optional)"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={user.email}
                    disabled
                    className="disabled-input"
                  />
                  <p className="field-hint">Email cannot be changed</p>
                </div>
              </div>
            </div>

            <div className="profile-actions">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {activeTab === 'security' && (
          <div className="security-section">
            <div className="security-content">
              <h2 className="security-section-title">Password Reset</h2>
              <p className="security-description">
                Reset your password by email. You'll receive a secure link that expires in 1 hour.
              </p>
              
              {/* Error Alert - Inline, subtle */}
              {securityError && (
                <div className="security-alert security-alert-error" role="alert">
                  <svg className="security-alert-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM8.70711 7.29289C8.31658 6.90237 7.68342 6.90237 7.29289 7.29289C6.90237 7.68342 6.90237 8.31658 7.29289 8.70711L8.58579 10L7.29289 11.2929C6.90237 11.6834 6.90237 12.3166 7.29289 12.7071C7.68342 13.0976 8.31658 13.0976 8.70711 12.7071L10 11.4142L11.2929 12.7071C11.6834 13.0976 12.3166 13.0976 12.7071 12.7071C13.0976 12.3166 13.0976 11.6834 12.7071 11.2929L11.4142 10L12.7071 8.70711C13.0976 8.31658 13.0976 7.68342 12.7071 7.29289C11.6834 6.90237 11.3166 6.90237 10.7071 7.29289L10 8L9.29289 7.29289H8.70711Z" fill="currentColor"/>
                  </svg>
                  <span>We couldn't send the password reset email. Please try again.</span>
                </div>
              )}
              
              {/* Success Alert - Inline, subtle */}
              {passwordResetSent && (
                <div className="security-alert security-alert-success" role="alert">
                  <svg className="security-alert-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM13.7071 8.29289C14.0976 8.68342 14.0976 9.31658 13.7071 9.70711L9.70711 13.7071C9.31658 14.0976 8.68342 14.0976 8.29289 13.7071L6.29289 11.7071C5.90237 11.3166 5.90237 10.6834 6.29289 10.2929C6.68342 9.90237 7.31658 9.90237 7.70711 10.2929L9 11.5858L12.2929 8.29289C12.6834 7.90237 13.3166 7.90237 13.7071 8.29289Z" fill="currentColor"/>
                  </svg>
                  <span>Password reset email sent. Check your inbox.</span>
                </div>
              )}
              
              <div className="security-actions">
                <button
                  type="button"
                  onClick={(e) => {
                    console.log('[RESET] button onClick fired');
                    handlePasswordReset(e);
                  }}
                  disabled={loading || passwordResetSent}
                  className="btn-security-reset"
                >
                  {loading ? (
                    <>
                      <svg className="btn-spinner" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="43.98" strokeDashoffset="10" opacity="0.5"/>
                      </svg>
                      <span>Sending…</span>
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;

