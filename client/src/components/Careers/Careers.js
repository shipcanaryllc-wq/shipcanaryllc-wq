// Premium SaaS Careers Page - ShipCanary
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Baby,
  Clock,
  UtensilsCrossed,
  Bus,
  HeartPulse,
} from 'lucide-react';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import './Careers.css';

const Careers = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      title: 'Medical',
      description: 'Comprehensive health insurance coverage for you and your family.',
      icon: Stethoscope
    },
    {
      title: 'Parental leave',
      description: 'Generous paid parental leave to support new parents.',
      icon: Baby
    },
    {
      title: 'Unlimited PTO',
      description: 'Take time off when you need it. We trust you to manage your own schedule.',
      icon: Clock
    },
    {
      title: 'Lunches & dinners credits',
      description: 'Monthly meal credits to keep you fueled and happy.',
      icon: UtensilsCrossed
    },
    {
      title: 'Commuter benefits',
      description: 'Help with your commute costs to make getting to work easier.',
      icon: Bus
    },
    {
      title: 'Wellness and more',
      description: 'Additional wellness benefits and perks to support your overall wellbeing.',
      icon: HeartPulse
    }
  ];

  const openRoles = [
    {
      title: 'Account Manager',
      description: 'Help our customers succeed by managing relationships and ensuring their shipping needs are met.',
      location: 'Remote'
    },
    {
      title: 'Software Engineer iOS',
      description: 'Build and maintain our iOS application, creating a seamless shipping experience for mobile users.',
      location: 'Remote'
    },
    {
      title: 'Software Engineer Android',
      description: 'Develop and enhance our Android app, delivering a smooth shipping solution for Android users.',
      location: 'Remote'
    },
    {
      title: 'Software Engineer Backend',
      description: 'Design and implement scalable backend systems that power our shipping platform.',
      location: 'Remote'
    },
    {
      title: 'Software Engineer Web',
      description: 'Create beautiful and functional web experiences for our shipping platform.',
      location: 'Remote'
    },
    {
      title: 'UI/UX Engineer',
      description: 'Design and implement user interfaces that make shipping simple and intuitive.',
      location: 'Remote'
    },
    {
      title: 'Social Media Manager',
      description: 'Manage our social media presence and help grow our community of small business owners.',
      location: 'Remote'
    }
  ];

  return (
    <div className="careers-page">
      <Navbar />

      <main className="careers-main">
        {/* Hero Section - Premium SaaS Style */}
        <div className="careers-hero">
          <div className="hero-gradient-bg"></div>
          <div className="hero-content-wrapper">
            <h1 className="careers-title">Join us at ShipCanary</h1>
            <p className="careers-subtitle">
              We're building the future of shipping for small businesses. Join our team and help us make shipping simple, affordable, and accessible for everyone.
            </p>
            <button className="careers-cta-button" onClick={() => {
              document.getElementById('open-roles').scrollIntoView({ behavior: 'smooth' });
            }}>
              See Open Roles
            </button>
          </div>
        </div>

        {/* Why Work With Us Section - Elevated Cards */}
        <section className="benefits-section">
          <h2 className="benefits-section-title">Why Work With Us?</h2>
          <div className="benefits-grid">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div key={index} className="benefit-card">
                  <div className="benefit-icon-badge">
                    <IconComponent size={28} />
                  </div>
                  <h3 className="benefit-title">{benefit.title}</h3>
                  <p className="benefit-description">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Open Roles Section - Modern Job Cards */}
        <section id="open-roles" className="open-roles-section">
          <h2 className="open-roles-title">We're Hiring! Check Out Our Open Roles</h2>
          <div className="jobs-list">
            {openRoles.map((job, index) => (
              <div key={index} className="job-card">
                <div className="job-content">
                  <div className="job-header">
                    <h3 className="job-title">{job.title}</h3>
                    <span className="job-location">{job.location}</span>
                  </div>
                  <p className="job-description">{job.description}</p>
                </div>
                <div className="job-actions">
                  <button className="job-apply-button" onClick={() => {
                    window.location.href = `mailto:careers@shipcanary.com?subject=Application for ${job.title}`;
                  }}>
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Careers;
