import React, { useState } from 'react';
import './OnRampWidget.css';

/**
 * OnRampWidget Component
 * 
 * Component for selecting trusted exchanges to purchase Bitcoin with card.
 * 
 * IMPORTANT: This widget does NOT send the BTCPay invoice address directly.
 * Users must manually copy/paste the destination address to avoid coupling
 * the fiat/KYC flow with our backend.
 * 
 * @param {Object} props
 * @param {Function} props.onClose - Callback when widget is closed
 * @param {number} props.amount - Payment amount (for reference)
 * @param {string} props.currency - Currency code (USD, EUR, etc.)
 */
const OnRampWidget = ({ onClose, amount, currency = 'USD' }) => {
  const [selectedProvider, setSelectedProvider] = useState('coinbase');

  /**
   * Get provider-specific exchange URL
   * Links to trusted, regulated cryptocurrency exchanges
   */
  const getProviderWidget = () => {
    switch (selectedProvider.toLowerCase()) {
      case 'coinbase':
        return {
          type: 'link',
          url: 'https://www.coinbase.com/buy-bitcoin',
          name: 'Coinbase',
          description: 'One of the largest and most trusted cryptocurrency exchanges. Regulated in the US with competitive fees.',
        };

      case 'kraken':
        return {
          type: 'link',
          url: 'https://www.kraken.com/buy-crypto',
          name: 'Kraken',
          description: 'Established exchange with low fees and strong security. Available in most countries.',
        };

      case 'cryptocom':
        return {
          type: 'link',
          url: 'https://crypto.com/app/buy',
          name: 'Crypto.com',
          description: 'Global cryptocurrency platform with competitive rates and multiple payment methods.',
        };

      case 'binance':
        return {
          type: 'link',
          url: 'https://www.binance.com/en/buy-sell-crypto',
          name: 'Binance',
          description: 'World\'s largest cryptocurrency exchange by volume. Low fees and wide selection.',
        };

      default:
        return {
          type: 'link',
          url: 'https://www.coinbase.com/buy-bitcoin',
          name: 'Coinbase',
          description: 'One of the largest and most trusted cryptocurrency exchanges.',
        };
    }
  };

  const widgetConfig = getProviderWidget();

  return (
    <div className="onramp-widget-overlay" onClick={onClose}>
      <div className="onramp-widget-container" onClick={(e) => e.stopPropagation()}>
        <div className="onramp-widget-header">
          <h2>Buy Bitcoin with Card</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="onramp-widget-content">
          <div className="onramp-info">
            <h3>How to Complete Your Payment</h3>
            <ol>
              <li>
                <strong>Select a trusted exchange</strong> below to purchase Bitcoin with your credit or debit card
              </li>
              <li>
                Complete any required <strong>identity verification</strong> with the exchange (handled securely by them)
              </li>
              <li>
                <strong>Receive Bitcoin</strong> directly in your personal wallet or exchange account
              </li>
              <li>
                Return to this payment page and <strong>open the BTCPay checkout</strong> to view the invoice address
              </li>
              <li>
                <strong>Send the purchased Bitcoin</strong> to the BTCPay invoice address to complete your payment
              </li>
            </ol>

            <div className="important-note">
              <strong>Important:</strong> After purchasing Bitcoin, return here and send it to the BTCPay invoice address to complete payment.
            </div>
          </div>

          <div className="provider-selector">
            <label>Select Exchange:</label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
            >
              <option value="coinbase">Coinbase</option>
              <option value="kraken">Kraken</option>
              <option value="cryptocom">Crypto.com</option>
              <option value="binance">Binance</option>
            </select>
            <p className="provider-note">
              All exchanges are trusted, regulated platforms with competitive fees and secure payment processing.
            </p>
          </div>

          <div className="widget-embed">
            {widgetConfig.type === 'link' && (
              <div className="widget-placeholder">
                <div className="exchange-info">
                  <h4>{widgetConfig.name}</h4>
                  <p className="exchange-description">{widgetConfig.description}</p>
                </div>
                <a
                  href={widgetConfig.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="exchange-link-button"
                >
                  <span>Visit {widgetConfig.name}</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="15 3 21 3 21 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
                <p className="widget-note">
                  After purchasing Bitcoin, return to this page and send the Bitcoin to your BTCPay invoice address to complete payment.
                </p>
              </div>
            )}
          </div>

          <div className="widget-footer">
            <p>
              <strong>Payment Amount:</strong> ${amount.toFixed(2)} {currency}
            </p>
            <p className="footer-note">
              Purchase enough Bitcoin to cover this amount plus network transaction fees (typically 1-3%).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnRampWidget;
