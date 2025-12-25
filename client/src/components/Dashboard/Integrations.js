import React from 'react';
import { Clock } from 'lucide-react';
import IntegrationsHeroAnimation from './IntegrationsHeroAnimation';
import IntegrationLogo from './IntegrationLogo';
import { INTEGRATIONS } from '../../config/integrations';
import './Integrations.css';

const Integrations = () => {
  const getStatusLabel = (status) => {
    return status === 'in-development' ? 'IN DEVELOPMENT' : 'PLANNED';
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
            Connect ShipCanary to the ecommerce tools you already use. Native integrations rolling out soon.
          </p>
          
          {/* Hero Animation */}
          <IntegrationsHeroAnimation integrations={INTEGRATIONS} />
          
          <div className="coming-soon-badge">
            Coming Soon — In active development
          </div>
        </div>

        {/* Logo Strip */}
        <div className="logo-strip-section">
          <p className="logo-strip-label">Connecting ShipCanary to the platforms you already ship with.</p>
          <div className="logo-strip">
            {INTEGRATIONS.map((integration) => (
              <div key={integration.id} className="logo-strip-item">
                <IntegrationLogo
                  logoSrc={integration.logoSrc}
                  name={integration.name}
                  size={24}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Integration Cards Grid */}
        <div className="integrations-grid">
          {INTEGRATIONS.map((integration) => (
            <div key={integration.id} className="integration-card" title="Integration in development">
              <div className="integration-card-header">
                <div className="integration-logo-container">
                  <IntegrationLogo
                    logoSrc={integration.logoSrc}
                    name={integration.name}
                    size={36}
                  />
                </div>
                <div className="integration-header-content">
                  <h3 className="integration-name">{integration.name}</h3>
                  <span className={`status-pill ${getStatusClass(integration.status)}`}>
                    {getStatusLabel(integration.status)}
                  </span>
                </div>
              </div>
              
              <p className="integration-description">{integration.description}</p>
              
              <div className="integration-footer">
                <Clock size={14} />
                <span>Integration in development</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Section */}
        <div className="integrations-roadmap">
          <h3 className="roadmap-title">What's Coming Next</h3>
          <p className="roadmap-description">
            Integrations will roll out in phases. You'll be able to connect your stores, 
            import orders automatically, and sync tracking data back to your ecommerce platforms.
          </p>
          <p className="roadmap-note">
            Want to request a platform? Contact support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Integrations;
