import React, { useState, useMemo } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { INTEGRATIONS, CATEGORIES } from '../../config/integrations';
import './Integrations.css';

// Logo URLs - Using official brand logos
const LOGO_URLS = {
  shopify: 'https://cdn.simpleicons.org/shopify/96BF48',
  etsy: 'https://cdn.simpleicons.org/etsy/F16521',
  // Amazon logo - official brand logo (Amazon smile with arrow)
  amazon: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
  // eBay logo - official colorful brand logo
  ebay: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg',
  woocommerce: 'https://cdn.simpleicons.org/woocommerce/96588A',
  bigcommerce: 'https://cdn.simpleicons.org/bigcommerce/121118'
};

const Integrations = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [logoErrors, setLogoErrors] = useState({});

  // Filter integrations based on category only
  const filteredIntegrations = useMemo(() => {
    return INTEGRATIONS.filter(integration => {
      const matchesCategory = selectedCategory === 'All' || integration.category === selectedCategory;
      return matchesCategory;
    });
  }, [selectedCategory]);

  // Get logo URL
  const getLogoSrc = (integrationId) => {
    return LOGO_URLS[integrationId] || `https://cdn.simpleicons.org/${integrationId}`;
  };

  // Handle logo load error
  const handleLogoError = (integrationId, e) => {
    setLogoErrors(prev => ({ ...prev, [integrationId]: true }));
    e.target.style.display = 'none';
    const placeholder = e.target.parentElement.querySelector('.integration-logo-fallback');
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  };

  const getStatusLabel = (status) => {
    return status === 'in-development' ? 'In development' : 'Planned';
  };

  const getStatusClass = (status) => {
    return status === 'in-development' ? 'status-pill-development' : 'status-pill-planned';
  };

  return (
    <div className="integrations-page">
      <div className="integrations-container">
        {/* Hero Section */}
        <div className="integrations-hero">
          <h1 className="integrations-title">Integrations</h1>
          <p className="integrations-subtitle">
            Connect ShipCanary to your storefronts and marketplaces. Native integrations are rolling out soon.
          </p>
          <div className="coming-soon-pill">
            Coming soon
          </div>
        </div>

        {/* Roadmap Strip */}
        <div className="roadmap-strip">
          <div className="roadmap-steps">
            <div className="roadmap-step">
              <div className="roadmap-step-indicator planned">1</div>
              <span className="roadmap-step-label">Planned</span>
            </div>
            <div className="roadmap-step-connector">
              <div className="roadmap-connector-line"></div>
            </div>
            <div className="roadmap-step">
              <div className="roadmap-step-indicator in-development">2</div>
              <span className="roadmap-step-label">In development</span>
            </div>
            <div className="roadmap-step-connector">
              <div className="roadmap-connector-line"></div>
            </div>
            <div className="roadmap-step">
              <div className="roadmap-step-indicator launching">3</div>
              <span className="roadmap-step-label">Launching</span>
            </div>
          </div>
          <p className="roadmap-note">
            We're building these natively, starting with Shopify.
          </p>
        </div>

        {/* Category Filters */}
        <div className="integrations-filters">
          <div className="category-pills">
            {CATEGORIES.map(category => (
              <button
                key={category}
                className={`category-pill ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Integration Cards Grid */}
        <div className="integrations-grid">
          {filteredIntegrations.length > 0 ? (
            filteredIntegrations.map((integration, index) => {
              const logoSrc = getLogoSrc(integration.id);
              const hasError = logoErrors[integration.id];
              
              return (
                <div
                  key={integration.id}
                  className={`integration-card ${integration.status === 'planned' ? 'disabled' : ''} ${integration.status === 'in-development' ? 'in-development' : ''}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* In Progress Indicator for In Development */}
                  {integration.status === 'in-development' && (
                    <div className="integration-progress-bar">
                      <div className="integration-progress-shimmer"></div>
                    </div>
                  )}
                  
                  <div className="integration-card-header">
                    <div className="integration-logo-container">
                      {!hasError ? (
                        <img
                          src={logoSrc}
                          alt={`${integration.name} logo`}
                          className="integration-logo"
                          onError={(e) => handleLogoError(integration.id, e)}
                          loading="lazy"
                        />
                      ) : null}
                      <div 
                        className="integration-logo-fallback"
                        style={{ display: hasError ? 'flex' : 'none' }}
                      >
                        {integration.name.charAt(0)}
                      </div>
                    </div>
                    <div className="integration-header-content">
                      <h3 className="integration-name">{integration.name}</h3>
                      <span className={`status-pill ${getStatusClass(integration.status)}`}>
                        {integration.status === 'in-development' && (
                          <Loader2 size={12} className="status-pill-loader" />
                        )}
                        {getStatusLabel(integration.status)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="integration-description">{integration.description}</p>
                  
                  <div className="integration-footer">
                    <span className="integration-coming-soon-text">Coming soon</span>
                    <button
                      className="integration-connect-button"
                      disabled
                      title="Not available yet"
                    >
                      Connect
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="integrations-empty">
              <p>No integrations found in this category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Integrations;
