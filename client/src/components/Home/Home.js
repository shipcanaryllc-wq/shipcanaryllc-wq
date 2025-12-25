import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import './Home.css';

// Icon Components
const SavingsIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const UsersIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const PackageIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const LightningIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const RocketIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
);

const LinkIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const ChartIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

const ZapIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const DollarIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const TrendingUpIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const NetworkIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="2"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    <path d="M2 12h20"/>
  </svg>
);

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [microstats, setMicrostats] = useState({
    labelsToday: 1247,
    avgSavings: '$3.42',
    processingSpeed: '240ms'
  });

  const [currentProofIndex, setCurrentProofIndex] = useState(0);
  const [demoStage, setDemoStage] = useState(0); // 0: Dashboard, 1: Create Label, 2: Success, 3: Stats Update

  const socialProofStatements = [
    {
      icon: DollarIcon,
      text: 'Over $2.5M saved in postage this year',
      color: '#ff6b35'
    },
    {
      icon: PackageIcon,
      text: 'Thousands of labels generated monthly',
      color: '#ff6b35'
    },
    {
      icon: TrendingUpIcon,
      text: 'Carrier-level discounts for every business',
      color: '#ff6b35'
    },
    {
      icon: NetworkIcon,
      text: 'Infrastructure-level routing and tracking',
      color: '#ff6b35'
    }
  ];

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  // Animate microstats on mount
  useEffect(() => {
    const interval = setInterval(() => {
      setMicrostats(prev => ({
        labelsToday: prev.labelsToday + Math.floor(Math.random() * 3),
        avgSavings: prev.avgSavings,
        processingSpeed: `${220 + Math.floor(Math.random() * 40)}ms`
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Rotate social proof statements
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentProofIndex((prev) => (prev + 1) % socialProofStatements.length);
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animated demo tour - loops through dashboard states
  useEffect(() => {
    const interval = setInterval(() => {
      setDemoStage((prev) => (prev + 1) % 4);
    }, 6000); // 6 seconds per stage
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home-page">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background-gradient"></div>
        <div className="hero-background-blur"></div>
        <div className="container">
        <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-heading">
                Small Business
                <br />
                Shipping Simplified
          </h1>
              <p className="hero-subheading">
                Designed for small businesses — affordable shipping resources at your fingertips. Access top-tier tools through our easy-to-use platform or Canary Infrastructure Engine.
              </p>
              <div className="hero-cta-container">
                <button className="hero-cta-button" onClick={handleGetStarted}>
                  Get Started Free
                </button>
                <p className="hero-cta-sublabel">
                  No credit card required. First label free.
                </p>
              </div>
              
              {/* Microstats */}
              <div className="hero-microstats">
                <div className="microstat-item">
                  <div className="microstat-value">{microstats.labelsToday.toLocaleString()}</div>
                  <div className="microstat-label">Live Labels Generated Today</div>
                </div>
                <div className="microstat-item">
                  <div className="microstat-value">{microstats.avgSavings}</div>
                  <div className="microstat-label">Average Savings Per Shipment</div>
                </div>
                <div className="microstat-item">
                  <div className="microstat-value">{microstats.processingSpeed}</div>
                  <div className="microstat-label">Label Processing Speed</div>
                </div>
              </div>
            </div>
            <div className="hero-illustration">
              <div className="shipping-animation">
                <div className="label-printer">
                  <div className="printer-base"></div>
                  <div className="printer-head"></div>
                  <div className="label-sheet">
                    <div className="label-line label-line-1"></div>
                    <div className="label-line label-line-2"></div>
                    <div className="label-line label-line-3"></div>
                  </div>
                </div>
                <div className="parcel-flow">
                  <div className="parcel parcel-1"></div>
                  <div className="parcel parcel-2"></div>
                  <div className="parcel parcel-3"></div>
                </div>
                <div className="route-lines">
                  <svg className="route-svg" viewBox="0 0 400 300">
                    <path className="route-path" d="M50,150 Q150,50 250,100 T450,150" stroke="currentColor" fill="none" strokeWidth="2"/>
                    <circle className="route-node route-node-1" cx="50" cy="150" r="4"/>
                    <circle className="route-node route-node-2" cx="250" cy="100" r="4"/>
                    <circle className="route-node route-node-3" cx="350" cy="150" r="4"/>
                  </svg>
                </div>
              </div>
          </div>
          </div>
        </div>
      </section>

      {/* Trust Layer - Rotating Social Proof */}
      <section className="trust-section">
        <div className="container">
          <p className="trust-section-title">Trusted by High-Volume Shippers</p>
          <div className="social-proof-container">
            {socialProofStatements.map((statement, index) => {
              const IconComponent = statement.icon;
              const isActive = index === currentProofIndex;
              return (
                <div
                  key={index}
                  className={`social-proof-card ${isActive ? 'active' : ''}`}
                >
                  <div className="social-proof-icon">
                    <IconComponent size={28} color={statement.color} />
              </div>
                  <p className="social-proof-text">{statement.text}</p>
            </div>
              );
            })}
              </div>
          <p className="trust-credibility">
            Join thousands of businesses saving on shipping costs every day
          </p>
            </div>
      </section>

      {/* Data + Social Proof */}
      <section className="data-proof-section">
        <div className="container">
          <div className="data-proof-grid">
            <div className="data-proof-card">
              <div className="data-proof-icon">
                <SavingsIcon size={32} color="#ff6b35" />
              </div>
              <div className="data-proof-value">Up to 90%</div>
              <div className="data-proof-label">USPS Savings</div>
            </div>
            <div className="data-proof-card">
              <div className="data-proof-icon">
                <UsersIcon size={32} color="#ff6b35" />
              </div>
              <div className="data-proof-value">1,200+</div>
              <div className="data-proof-label">Active Monthly Shippers</div>
            </div>
            <div className="data-proof-card">
              <div className="data-proof-icon">
                <PackageIcon size={32} color="#ff6b35" />
              </div>
              <div className="data-proof-value">150,000+</div>
              <div className="data-proof-label">Total Labels Generated</div>
            </div>
            <div className="data-proof-card">
              <div className="data-proof-icon">
                <LightningIcon size={32} color="#ff6b35" />
              </div>
              <div className="data-proof-value">240ms</div>
              <div className="data-proof-label">Avg Processing Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* See Canary In Action - Animated Dashboard Demo */}
      <section className="dashboard-preview-section">
        <div className="container">
          <h2 className="dashboard-preview-title">See Canary In Action</h2>
          <div className="dashboard-preview-container">
            <div className="dashboard-mockup">
              <div className="dashboard-mockup-header">
                <div className="mockup-dot"></div>
                <div className="mockup-dot"></div>
                <div className="mockup-dot"></div>
                <div className="mockup-url">shipcanary.com/dashboard</div>
            </div>
              <div className="dashboard-mockup-content">
                {/* Sidebar Navigation */}
                <div className="demo-sidebar">
                  <div className={`demo-nav-item ${demoStage === 1 ? 'active' : ''}`}>
                    <div className="demo-nav-icon"></div>
                    <span>Dashboard</span>
            </div>
                  <div className={`demo-nav-item ${demoStage === 1 ? 'active highlight' : ''}`}>
                    <div className="demo-nav-icon"></div>
                    <span>Create Label</span>
                    {demoStage === 1 && <div className="demo-pulse-indicator"></div>}
            </div>
                  <div className={`demo-nav-item ${demoStage === 2 || demoStage === 3 ? 'active' : ''}`}>
                    <div className="demo-nav-icon"></div>
                    <span>Order History</span>
          </div>
                  <div className="demo-nav-item">
                    <div className="demo-nav-icon"></div>
                    <span>Bulk Orders</span>
          </div>
                  <div className="demo-nav-item">
                    <div className="demo-nav-icon"></div>
                    <span>Saved Addresses</span>
        </div>
                </div>

                {/* Main Content Area */}
                <div className="demo-main-content">
                  {/* Stage 0: Dashboard Overview */}
                  <div className={`demo-stage ${demoStage === 0 ? 'active' : ''}`}>
                    <div className="demo-stats-row">
                      <div className="demo-stat-card">
                        <div className="demo-stat-label">Orders Today</div>
                        <div className="demo-stat-value">12</div>
                      </div>
                      <div className="demo-stat-card">
                        <div className="demo-stat-label">This Week</div>
                        <div className="demo-stat-value">47</div>
                      </div>
                      <div className="demo-stat-card">
                        <div className="demo-stat-label">This Month</div>
                        <div className="demo-stat-value">189</div>
                      </div>
                      <div className={`demo-stat-card ${demoStage === 3 ? 'flash-update' : ''}`}>
                        <div className="demo-stat-label">All Time</div>
                        <div className="demo-stat-value">
                          {demoStage === 3 ? '190' : '189'}
                          {demoStage === 3 && <span className="demo-increment">+1</span>}
                        </div>
                      </div>
                    </div>
                    <div className="demo-recent-orders">
                      <div className="demo-section-title">Recent Orders</div>
                      <div className="demo-order-item">
                        <div className="demo-order-info">
                          <div className="demo-order-service">USPS Priority</div>
                          <div className="demo-order-tracking">Tracking: 9400111899562537</div>
                        </div>
                        <div className="demo-order-status status-in-transit">In Transit</div>
                      </div>
                      <div className="demo-order-item">
                        <div className="demo-order-info">
                          <div className="demo-order-service">USPS Ground</div>
                          <div className="demo-order-tracking">Tracking: 9400111899562538</div>
                        </div>
                        <div className="demo-order-status status-delivered">Delivered</div>
                </div>
              </div>
            </div>

                  {/* Stage 1: Create Label Form */}
                  <div className={`demo-stage ${demoStage === 1 ? 'active' : ''}`}>
                    <div className="demo-form-header">Create Shipping Label</div>
                    <div className="demo-form-content">
                      <div className="demo-form-field">
                        <div className="demo-field-label">From Address</div>
                        <div className="demo-field-value">123 Main St, New York, NY 10001</div>
                      </div>
                      <div className="demo-form-field">
                        <div className="demo-field-label">To Address</div>
                        <div className="demo-field-value">456 Oak Ave, Los Angeles, CA 90001</div>
                      </div>
                      <div className="demo-form-row">
                        <div className="demo-form-field">
                          <div className="demo-field-label">Service</div>
                          <div className="demo-field-value">USPS Priority Mail</div>
                        </div>
                        <div className="demo-form-field">
                          <div className="demo-field-label">Weight</div>
                          <div className="demo-field-value">2.5 lbs</div>
                        </div>
                      </div>
                      <div className="demo-form-actions">
                        <div className="demo-button-primary">Create Label</div>
                </div>
              </div>
            </div>

                  {/* Stage 2: Success State */}
                  <div className={`demo-stage ${demoStage === 2 ? 'active' : ''}`}>
                    <div className="demo-success-state">
                      <div className="demo-success-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#28a745" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                          <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                      </div>
                      <div className="demo-success-title">Label Created Successfully</div>
                      <div className="demo-tracking-section">
                        <div className="demo-tracking-label">Tracking Number</div>
                        <div className="demo-tracking-number">9400111899562539</div>
                        <div className="demo-api-badge">
                          <ZapIcon size={14} color="#ff6b35" />
                          <span>Canary Generated</span>
                        </div>
                      </div>
                      <div className="demo-order-details">
                        <div className="demo-detail-row">
                          <span>Status:</span>
                          <span className="demo-status-badge status-created">Label Created</span>
                        </div>
                        <div className="demo-detail-row">
                          <span>Cost:</span>
                          <span>$8.45</span>
                        </div>
                </div>
              </div>
            </div>

                  {/* Stage 3: Stats Update */}
                  <div className={`demo-stage ${demoStage === 3 ? 'active' : ''}`}>
                    <div className="demo-stats-row">
                      <div className="demo-stat-card">
                        <div className="demo-stat-label">Orders Today</div>
                        <div className="demo-stat-value">13</div>
                      </div>
                      <div className="demo-stat-card">
                        <div className="demo-stat-label">This Week</div>
                        <div className="demo-stat-value">48</div>
                      </div>
                      <div className="demo-stat-card">
                        <div className="demo-stat-label">This Month</div>
                        <div className="demo-stat-value">190</div>
                      </div>
                      <div className="demo-stat-card flash-update">
                        <div className="demo-stat-label">All Time</div>
                        <div className="demo-stat-value">
                          190
                          <span className="demo-increment">+1</span>
                        </div>
                      </div>
                    </div>
                    <div className="demo-recent-orders">
                      <div className="demo-section-title">Recent Orders</div>
                      <div className="demo-order-item highlight-new">
                        <div className="demo-order-info">
                          <div className="demo-order-service">USPS Priority</div>
                          <div className="demo-order-tracking">Tracking: 9400111899562539</div>
                        </div>
                        <div className="demo-order-status status-created">Label Created</div>
                      </div>
                      <div className="demo-order-item">
                        <div className="demo-order-info">
                          <div className="demo-order-service">USPS Priority</div>
                          <div className="demo-order-tracking">Tracking: 9400111899562537</div>
                        </div>
                        <div className="demo-order-status status-in-transit">In Transit</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
                </div>
          <div className="dashboard-highlights">
            <div className="dashboard-highlight">
              <div className="highlight-icon">
                <ChartIcon size={24} color="#4a5568" />
              </div>
              <div className="highlight-text">Real-time order tracking</div>
            </div>
            <div className="dashboard-highlight">
              <div className="highlight-icon">
                <LinkIcon size={24} color="#4a5568" />
              </div>
              <div className="highlight-text">Canary Infrastructure Engine</div>
            </div>
            <div className="dashboard-highlight">
              <div className="highlight-icon">
                <ZapIcon size={24} color="#4a5568" />
              </div>
              <div className="highlight-text">Real-Time Label Processing</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section - Modern SaaS Cards */}
      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <RocketIcon size={40} color="#ff6b35" />
              </div>
              <p className="feature-eyebrow">SHIP FASTER, SAVE MORE</p>
              <h2 className="feature-heading">Access deep discounts from top carriers</h2>
              <p className="feature-description">
                Get access to the cheapest shipping rates on the market.
              </p>
              <ul className="feature-list">
                <li><strong>Negotiated rates</strong> with top carriers</li>
                <li><strong>Insurance</strong> on every shipment</li>
                <li><strong>No hidden fees!</strong></li>
              </ul>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <LinkIcon size={40} color="#ff6b35" />
              </div>
              <p className="feature-eyebrow">AUTOMATE YOUR BUSINESS IN MINUTES</p>
              <h2 className="feature-heading">Connect your e-commerce platform</h2>
              <p className="feature-description">
                Import sales from your e-commerce platform in real-time.
              </p>
              <ul className="feature-list">
                <li><strong>Shopify, Etsy, Ebay</strong>, and more!</li>
                <li><strong>Built for Scale</strong> — handle any volume</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
