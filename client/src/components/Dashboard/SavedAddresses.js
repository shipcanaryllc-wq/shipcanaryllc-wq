import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './SavedAddresses.css';
import API_BASE_URL from '../../config/api';

const SavedAddresses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    label: '',
    name: '',
    company: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
    email: ''
  });

  useEffect(() => {
    if (user) {
      fetchAddresses();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/addresses`);
      setAddresses(response.data);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await axios.put(`${API_BASE_URL}/addresses/${editingAddress._id}`, formData);
      } else {
        await axios.post(`${API_BASE_URL}/addresses`, formData);
      }
      fetchAddresses();
      resetForm();
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Failed to save address');
    }
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      name: address.name,
      company: address.company || '',
      street1: address.street1,
      street2: address.street2 || '',
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country || 'US',
      phone: address.phone || '',
      email: address.email || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/addresses/${id}`);
      fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Failed to delete address');
    }
  };

  const resetForm = () => {
    setFormData({
      label: '',
      name: '',
      company: '',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US',
      phone: '',
      email: ''
    });
    setEditingAddress(null);
    setShowForm(false);
  };

  if (!user) {
    return (
      <div className="saved-addresses">
        <div className="login-prompt">
          <h3>🔒 Sign Up Required</h3>
          <p>Create an account to save and manage your shipping addresses.</p>
          <button onClick={() => navigate('/register')} className="signup-prompt-button">
            Sign Up Free
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div>Loading addresses...</div>;
  }

  return (
    <div className="saved-addresses">
      <div className="saved-addresses-container">
        {/* Header Bar */}
        <div className="addresses-header">
          <div className="header-content">
            <h2>Saved Addresses</h2>
            <p className="header-description">
              Store frequently used ship-from locations for faster label creation.
            </p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="add-button">
            {showForm ? 'Cancel' : '+ Add Address'}
          </button>
        </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="address-form">
          <h3>{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Label (e.g., Home, Office)</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                required
                placeholder="Home"
              />
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Company (optional)</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            <div className="form-group full-width">
              <label>Street Address 1</label>
              <input
                type="text"
                value={formData.street1}
                onChange={(e) => setFormData({ ...formData, street1: e.target.value })}
                required
              />
            </div>
            <div className="form-group full-width">
              <label>Street Address 2 (optional)</label>
              <input
                type="text"
                value={formData.street2}
                onChange={(e) => setFormData({ ...formData, street2: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                required
                maxLength={2}
                placeholder="CA"
              />
            </div>
            <div className="form-group">
              <label>ZIP Code</label>
              <input
                type="text"
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                required
                pattern="\d{5}(-\d{4})?"
                placeholder="12345"
              />
            </div>
            <div className="form-group">
              <label>Phone (optional)</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email (optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="save-button">
              {editingAddress ? 'Update Address' : 'Save Address'}
            </button>
            <button type="button" onClick={resetForm} className="cancel-button">
              Cancel
            </button>
          </div>
        </form>
      )}

        {/* Address Cards Grid */}
        <div className="addresses-list">
          {addresses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <h3 className="empty-state-title">No saved addresses yet</h3>
              <p className="empty-state-subtitle">
                Add your most-used ship-from locations so you can create labels in seconds.
              </p>
              <button onClick={() => setShowForm(true)} className="empty-state-button">
                Add Address
              </button>
            </div>
          ) : (
            addresses.map(address => (
              <div key={address._id} className="address-card">
                <div className="address-card-header">
                  <h3 className="address-label">{address.label}</h3>
                  <div className="address-actions">
                    <button onClick={() => handleEdit(address)} className="edit-button" title="Edit address">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(address._id)} className="delete-button" title="Delete address">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="address-details">
                  <p className="address-name">{address.name}</p>
                  {address.company && <p className="address-company">{address.company}</p>}
                  <p className="address-street">{address.street1}</p>
                  {address.street2 && <p className="address-street">{address.street2}</p>}
                  <p className="address-city-state">
                    {address.city}, {address.state} {address.zip}
                  </p>
                  {address.phone && <p className="address-meta">Phone: {address.phone}</p>}
                  {address.email && <p className="address-meta">Email: {address.email}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedAddresses;

