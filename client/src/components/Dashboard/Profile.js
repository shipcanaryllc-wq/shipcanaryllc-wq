import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import API_BASE_URL from '../../config/api';
import './Profile.css';

const Profile = () => {
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    businessName: ''
  });
  
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        businessName: user.businessName || ''
      });
      setAvatarPreview(user.avatarUrl || user.picture || null);
      setAvatarFile(null); // Reset file selection when user changes
    }
  }, [user]);

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

  const handlePasswordReset = async () => {
    setLoading(true);
    setError('');
    setPasswordResetSent(false);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/auth/request-password-reset`, {
        email: user.email
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setPasswordResetSent(true);
      setSuccess('Password reset email sent! Check your inbox.');
      setTimeout(() => {
        setSuccess('');
        setPasswordResetSent(false);
      }, 5000);
    } catch (error) {
      console.error('Error requesting password reset:', error);
      setError(error.response?.data?.message || 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1>Profile Settings</h1>
          <p>Manage your account information and security</p>
        </div>

        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
        </div>

        {error && <div className="profile-error">{error}</div>}
        {success && <div className="profile-success">{success}</div>}

        {activeTab === 'profile' && (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="profile-section">
              <h2>Profile Picture</h2>
              <div className="avatar-section">
                <div className="avatar-preview">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" />
                  ) : (
                    <div className="avatar-placeholder">
                      {(formData.name || user.email)?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
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
                  >
                    {avatarPreview ? 'Change Picture' : 'Upload Picture'}
                  </button>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarPreview(user?.avatarUrl || user?.picture || null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="btn-text"
                    >
                      Remove
                    </button>
                  )}
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
            <h2>Password</h2>
            <p className="security-description">
              Reset your password by email. You'll receive a secure link that expires in 1 hour.
            </p>
            <div className="security-actions">
              <button
                onClick={handlePasswordReset}
                disabled={loading || passwordResetSent}
                className="btn-primary"
              >
                {passwordResetSent ? 'Email Sent ✓' : loading ? 'Sending...' : 'Reset Password'}
              </button>
            </div>
            {passwordResetSent && (
              <div className="security-message">
                <p>✓ Password reset email sent to <strong>{user.email}</strong></p>
                <p>Check your inbox and click the link to reset your password.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;

