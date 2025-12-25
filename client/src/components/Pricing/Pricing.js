// Page recreated from archived Fleex site for ShipCanary; text and layout match snapshot 1:1 (brand-mapped).
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import './Pricing.css';

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clickedCard, setClickedCard] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    company: '',
    shipmentsPerMonth: '',
    message: ''
  });

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  const handleContactSales = (e) => {
    e.preventDefault();
    // Handle contact sales form submission
    window.location.href = `mailto:sales@shipcanary.com?subject=Sales Inquiry&body=Name: ${contactForm.name}%0AEmail: ${contactForm.email}%0ACompany: ${contactForm.company}%0AShipments per month: ${contactForm.shipmentsPerMonth}%0AMessage: ${contactForm.message}`;
  };

  const handleInputChange = (e) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value
    });
  };

  const pricingPlans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 'Free',
      description: 'Start with quick and easy shipping automations.',
      features: [
        'Best Shipping Discounts',
        'Unlimited store connections',
        'Automations',
        'Return labels',
        'Shipment tracking',
        '1 user login',
        '5 cents per automation',
        'Up to 5k labels per month'
      ],
      buttonText: 'Get started',
      buttonAction: handleGetStarted
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 'Contact Us',
      description: 'Grow your business with branded shipping and more support.',
      features: [
        'Everything in Starter',
        'Branded tracking pages and notification emails',
        'Chat and phone support',
        'Up to 5 user logins',
        'Up to 50k labels per month'
      ],
      buttonText: 'Contact Us',
      buttonAction: () => {
        document.getElementById('contact-sales').scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      id: 'premier',
      name: 'Premier',
      price: 'Contact us',
      description: 'Scale up with dedicated support and more user access.',
      features: [
        'Everything in Pro',
        'Dedicated account manager',
        '15+ user logins',
        'Unlimited shipments'
      ],
      buttonText: 'Contact Us',
      buttonAction: () => {
        document.getElementById('contact-sales').scrollIntoView({ behavior: 'smooth' });
      }
    }
  ];

  return (
    <div className="pricing-page">
      <Navbar />

      <main className="pricing-main">
        <div className="pricing-hero">
          <h1 className="pricing-title">Straight Forward Pricing</h1>
          <p className="pricing-subtitle">No Hidden Fees.</p>
          <button className="pricing-cta-button" onClick={handleGetStarted}>
            Get Started
          </button>
          <p className="pricing-disclaimer">No credit card required.</p>
        </div>

        {/* Pricing Cards */}
        <div className="pricing-cards">
          {pricingPlans.map((plan) => (
            <div 
              key={plan.id} 
              className={`pricing-card ${clickedCard === plan.id ? 'clicked' : ''}`}
              onClick={() => {
                setClickedCard(plan.id);
                setTimeout(() => {
                  plan.buttonAction();
                  setClickedCard(null);
                }, 300);
              }}
            >
              <h2 className="plan-name">{plan.name}</h2>
              <div className="plan-price">{plan.price}</div>
              <p className="plan-description">{plan.description}</p>
              <ul className="plan-features">
                {plan.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
              <button 
                className={`plan-button ${plan.id === 'starter' ? 'primary' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  plan.buttonAction();
                }}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* Contact Sales Section */}
        <section id="contact-sales" className="contact-sales-section">
          <h2 className="contact-sales-title">Contact Sales</h2>
          <form className="contact-sales-form" onSubmit={handleContactSales}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={contactForm.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={contactForm.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="company">Company</label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={contactForm.company}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="shipmentsPerMonth">Shipments per month</label>
                <input
                  type="text"
                  id="shipmentsPerMonth"
                  name="shipmentsPerMonth"
                  value={contactForm.shipmentsPerMonth}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={contactForm.message}
                onChange={handleInputChange}
                rows="5"
                required
              ></textarea>
            </div>
            <button type="submit" className="submit-button">
              Send Message
            </button>
          </form>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
