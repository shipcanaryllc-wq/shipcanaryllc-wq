import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useMapboxAutocomplete } from '../../hooks/useMapboxAutocomplete';
import AddressFormFields from './AddressFormFields';
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
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: ''
  });

  // Ref for street address input
  const streetAddressRef = useRef(null);
  const autocompleteCloseRef = useRef(null);

  useEffect(() => {
    console.log("[SavedAddresses] mounted");
    console.log("[SavedAddresses] MAPBOX token present?", !!process.env.REACT_APP_MAPBOX_ACCESS_TOKEN);
    console.log("[SavedAddresses] MAPBOX token preview:", process.env.REACT_APP_MAPBOX_ACCESS_TOKEN?.slice(0, 10));
    
    if (user) {
      fetchAddresses();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Helper functions to parse Mapbox address (same as CreateLabel)
  const extractHouseNumber = (feature) => {
    if (feature.properties?.address) {
      return feature.properties.address.trim();
    }
    if (feature.address) {
      return feature.address.trim();
    }
    if (feature.place_name) {
      const firstPart = feature.place_name.split(',')[0] || '';
      const houseNumberMatch = firstPart.match(/^(\d+[A-Z]?(?:-\d+)?)\b/);
      if (houseNumberMatch && houseNumberMatch[1]) {
        return houseNumberMatch[1].trim();
      }
    }
    return null;
  };

  const extractStreetName = (feature) => {
    if (feature.text) {
      return feature.text.trim();
    }
    if (feature.place_name) {
      const firstPart = feature.place_name.split(',')[0] || '';
      const withoutNumber = firstPart.replace(/^\d+[A-Z]?(?:-\d+)?\s*/, '').trim();
      const withoutUnit = withoutNumber.replace(/\b(APT|APARTMENT|APPT|SUITE|STE|ST|UNIT|UNT|#)\s+[A-Z0-9-]+\b/gi, '').trim();
      if (withoutUnit) {
        return withoutUnit;
      }
    }
    return null;
  };

  const extractUnit = (feature) => {
    if (!feature.place_name) return null;
    const firstPart = feature.place_name.split(',')[0] || '';
    const unitPatterns = [
      /\b(APT|APARTMENT|APPT)\s+([A-Z0-9-]+)\b/i,
      /\b(SUITE|STE|ST)\s+([A-Z0-9-]+)\b/i,
      /\b(UNIT|UNT)\s+([A-Z0-9-]+)\b/i,
      /\b#\s*([A-Z0-9-]+)\b/i,
    ];
    for (const pattern of unitPatterns) {
      const match = firstPart.match(pattern);
      if (match && match[0]) {
        return match[0].trim();
      }
    }
    return null;
  };

  const parseAddress = (feature) => {
    const address = {
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US'
    };

    const context = feature.context || [];
    const houseNumber = extractHouseNumber(feature);
    const streetName = extractStreetName(feature);
    const unit = extractUnit(feature);

    // Build street1
    if (houseNumber && streetName) {
      address.street1 = `${houseNumber} ${streetName}${unit ? ' ' + unit : ''}`.trim();
    } else if (feature.place_name) {
      const firstPart = feature.place_name.split(',')[0] || '';
      address.street1 = firstPart.trim();
    } else if (houseNumber) {
      address.street1 = streetName ? `${houseNumber} ${streetName}${unit ? ' ' + unit : ''}`.trim() : houseNumber;
    } else if (streetName) {
      if (feature.place_name) {
        const firstPart = feature.place_name.split(',')[0] || '';
        const hasNumberInPlaceName = /^\d+/.test(firstPart);
        if (hasNumberInPlaceName) {
          address.street1 = firstPart.trim();
        } else {
          address.street1 = streetName;
        }
      } else {
        address.street1 = streetName;
      }
    } else if (feature.text) {
      if (feature.place_name) {
        const firstPart = feature.place_name.split(',')[0] || '';
        address.street1 = firstPart.trim();
      } else {
        address.street1 = feature.text.trim();
      }
    }

    // Extract city, state, zip, country from context
    context.forEach(item => {
      const id = item.id || '';
      if (id.includes('place')) {
        address.city = item.text || address.city;
      } else if (id.includes('region')) {
        const code = item.short_code || '';
        if (code.includes('-')) {
          address.state = code.split('-')[1].toUpperCase();
        } else if (code.length === 2) {
          address.state = code.toUpperCase();
        } else if (item.text) {
          address.state = item.text;
        }
      } else if (id.includes('postcode')) {
        address.zip = item.text || address.zip;
      } else if (id.includes('country')) {
        address.country = item.short_code?.toUpperCase() || 'US';
      }
    });

    return address;
  };

  // Handle address autocomplete selection
  const handleAddressSelect = useCallback((feature) => {
    // Close suggestions
    if (autocompleteCloseRef.current) {
      autocompleteCloseRef.current();
    }

    const parsed = parseAddress(feature);
    
    // Update formData state with parsed address
    setFormData(prev => ({
      ...prev,
      street1: parsed.street1 ? parsed.street1.trim().toUpperCase() : prev.street1,
      city: parsed.city ? parsed.city.trim().toUpperCase() : prev.city,
      state: parsed.state ? parsed.state.trim().toUpperCase() : prev.state,
      zip: parsed.zip ? parsed.zip.trim() : prev.zip,
      country: parsed.country || 'US'
    }));
  }, []);

  // Initialize autocomplete
  const autocomplete = useMapboxAutocomplete(streetAddressRef, handleAddressSelect);
  autocompleteCloseRef.current = autocomplete.closeSuggestions;

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
      street1: address.street1,
      street2: address.street2 || '',
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country || 'US',
      phone: address.phone || ''
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
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US',
      phone: ''
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
        {/* Header Bar - Hide when creating */}
        {!showForm && (
          <div className="addresses-header">
            <div className="header-content">
              <h2>Saved Addresses</h2>
              <p className="header-description">
                Store frequently used ship-from locations for faster label creation.
              </p>
            </div>
            <button onClick={() => setShowForm(true)} className="add-button">
              + Add Address
            </button>
          </div>
        )}

      {showForm && (
        <form onSubmit={handleSubmit} className="address-form form-card">
          <div className="form-header-row">
            <h3>{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
            <button type="button" onClick={resetForm} className="cancel-button-header">
              Cancel
            </button>
          </div>
          <AddressFormFields
            prefix="saved"
            address={formData}
            setAddress={setFormData}
            autocomplete={autocomplete}
            cityAutocomplete={undefined}
            refs={{
              streetRef: streetAddressRef,
              cityRef: null,
              zipRef: null
            }}
            onAddressSelect={handleAddressSelect}
            onZipBlur={undefined}
            showLabel={true}
            streetPlaceholder="123 Main St"
          />
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

        {/* Address Cards Grid - Hide when creating */}
        {!showForm && (
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
                  <p className="address-street">{address.street1}</p>
                  {address.street2 && <p className="address-street">{address.street2}</p>}
                  <p className="address-city-state">
                    {address.city}, {address.state} {address.zip}
                  </p>
                  {address.phone && <p className="address-meta">Phone: {address.phone}</p>}
                </div>
              </div>
            ))
          )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedAddresses;

