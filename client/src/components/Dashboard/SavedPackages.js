import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './SavedPackages.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const SavedPackages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [formData, setFormData] = useState({
    label: '',
    length: '',
    width: '',
    height: '',
    weight: '',
    description: '',
    unit: 'inches',
    weightUnit: 'lbs'
  });

  useEffect(() => {
    if (user) {
      fetchPackages();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchPackages = async () => {
    try {
      const response = await axios.get(`${API_URL}/packages`);
      setPackages(response.data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate weight (max 70 lbs)
    const weight = parseFloat(formData.weight);
    if (weight > 70) {
      alert('Maximum weight is 70 lbs');
      return;
    }

    try {
      const submitData = {
        ...formData,
        length: parseFloat(formData.length),
        width: parseFloat(formData.width),
        height: parseFloat(formData.height),
        weight: weight
      };

      if (editingPackage) {
        await axios.put(`${API_URL}/packages/${editingPackage._id}`, submitData);
      } else {
        await axios.post(`${API_URL}/packages`, submitData);
      }
      fetchPackages();
      resetForm();
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Failed to save package');
    }
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      label: pkg.label,
      length: pkg.length.toString(),
      width: pkg.width.toString(),
      height: pkg.height.toString(),
      weight: pkg.weight.toString(),
      description: pkg.description || '',
      unit: pkg.unit || 'inches',
      weightUnit: pkg.weightUnit || 'lbs'
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return;
    
    try {
      await axios.delete(`${API_URL}/packages/${id}`);
      fetchPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
      alert('Failed to delete package');
    }
  };

  const resetForm = () => {
    setFormData({
      label: '',
      length: '',
      width: '',
      height: '',
      weight: '',
      description: '',
      unit: 'inches',
      weightUnit: 'lbs'
    });
    setEditingPackage(null);
    setShowForm(false);
  };

  if (!user) {
    return (
      <div className="saved-packages">
        <div className="login-prompt">
          <h3>🔒 Sign Up Required</h3>
          <p>Create an account to save and manage your package dimensions.</p>
          <button onClick={() => navigate('/register')} className="signup-prompt-button">
            Sign Up Free
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div>Loading packages...</div>;
  }

  return (
    <div className="saved-packages">
      <div className="saved-packages-container">
        {/* Header Bar */}
        <div className="packages-header">
          <div className="header-content">
            <h2>Saved Packages</h2>
            <p className="header-description">
              Save commonly used box sizes and weights to speed up label creation.
            </p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="add-button">
            {showForm ? 'Cancel' : '+ Add Package'}
          </button>
        </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="package-form-new">
          <h3>{editingPackage ? 'Edit Package' : 'Add Custom Package'}</h3>
          <div className="form-group-new">
            <label>Package Name*</label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              required
              placeholder="Box"
            />
          </div>
          <div className="form-group-new">
            <label>Dimensions (inches)*</label>
            <div className="dimensions-input">
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={formData.length}
                onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                required
                placeholder="6"
              />
              <span className="dimension-separator">x</span>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={formData.width}
                onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                required
                placeholder="6"
              />
              <span className="dimension-separator">x</span>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                required
                placeholder="6"
              />
            </div>
          </div>
          <div className="form-group-new">
            <label>Weight (lbs)*</label>
            <input
              type="number"
              step="0.01"
              min="0.1"
              max="70"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              required
              placeholder="0.90"
            />
            {formData.weight && parseFloat(formData.weight) > 70 && (
              <span className="error-text">Maximum weight is 70 lbs</span>
            )}
          </div>
          <div className="form-group-new">
            <label>Description (Optional)</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="box <1 lb"
            />
          </div>
          <div className="form-actions-new">
            <button type="submit" className="create-package-button">
              {editingPackage ? 'Update Package' : 'Create Package'}
            </button>
            <button type="button" onClick={resetForm} className="cancel-button-new">
              Cancel
            </button>
          </div>
        </form>
      )}

        {/* Package Cards Grid */}
        <div className="packages-list">
          {packages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="3" x2="9" y2="21"></line>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                </svg>
              </div>
              <h3 className="empty-state-title">No saved packages yet</h3>
              <p className="empty-state-subtitle">
                Create your first saved package to avoid re-typing dimensions and weights.
              </p>
              <button onClick={() => setShowForm(true)} className="empty-state-button">
                Add Package
              </button>
            </div>
          ) : (
            packages.map(pkg => (
              <div key={pkg._id} className="package-card">
                <div className="package-card-header">
                  <h3 className="package-label">{pkg.label}</h3>
                  <div className="package-actions">
                    <button onClick={() => handleEdit(pkg)} className="edit-button" title="Edit package">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(pkg._id)} className="delete-button" title="Delete package">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="package-details">
                  <div className="package-dimensions">
                    {pkg.length}" × {pkg.width}" × {pkg.height}"
                  </div>
                  <div className="package-weight">
                    {pkg.weight} {pkg.weightUnit || 'lbs'}
                  </div>
                  {pkg.weight > 70 && (
                    <div className="package-warning">
                      Weight exceeds 70 lbs limit
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedPackages;

