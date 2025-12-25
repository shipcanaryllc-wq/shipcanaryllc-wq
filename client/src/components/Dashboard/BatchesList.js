import React, { useState } from 'react';
import './BatchesList.css';

const BatchesList = () => {
  const [showNotification, setShowNotification] = useState(false);

  const handleNotifyClick = () => {
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  return (
    <div className="batches-list-page">
      <div className="batches-hero-container">
        <div className="batches-hero-card">
          {/* Animated Illustration */}
          <div className="batches-animation-container">
            <div className="animation-boxes">
              <div className="box box-1"></div>
              <div className="box box-2"></div>
              <div className="box box-3"></div>
              <div className="box box-4"></div>
            </div>
            <div className="animation-conveyor">
              <div className="conveyor-line"></div>
            </div>
            <div className="animation-label">
              <div className="label-sheet"></div>
              <div className="label-printer"></div>
            </div>
          </div>

          {/* Hero Content */}
          <div className="batches-hero-content">
            <h1 className="batches-hero-title">Batches List</h1>
            <p className="batches-hero-subtitle">
              Batch creation, bulk fulfillment, automation rules — arriving soon.
            </p>
            
            {/* CTA Button */}
            <button
              onClick={handleNotifyClick}
              className="batches-notify-button"
              disabled
            >
              Notify Me When Ready
            </button>
          </div>

          {/* Notification Toast */}
          {showNotification && (
            <div className="batches-notification-toast">
              Feature pending — notifications coming soon.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchesList;



