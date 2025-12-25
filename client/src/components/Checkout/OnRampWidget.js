import React, { useState } from 'react';
import './OnRampWidget.css';

/**
 * OnRampWidget Component
 * 
 * Generic component for third-party fiat→crypto on-ramp services.
 * 
 * This component is provider-agnostic and can be wired to:
 * - MoonPay (https://www.moonpay.com/)
 * - Ramp (https://ramp.network/)
 * - Transak (https://transak.com/)
 * - Or any other on-ramp provider
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
  const [selectedProvider, setSelectedProvider] = useState(
    process.env.REACT_APP_ONRAMP_PROVIDER || 'moonpay'
  );

  // TODO: Wire this to actual provider API keys from environment variables
  // Example: process.env.REACT_APP_MOONPAY_API_KEY
  // Example: process.env.REACT_APP_RAMP_API_KEY
  const onRampApiKey = process.env.REACT_APP_ONRAMP_API_KEY || '';

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

      case 'binance':
        return {
          type: 'link',
          url: 'https://www.binance.com/en/buy-sell-crypto',
          name: 'Binance',
          description: 'World\'s largest cryptocurrency exchange by volume. Low fees and wide selection.',
        };

      case 'gemini':
        return {
          type: 'link',
          url: 'https://www.gemini.com/buy-bitcoin',
          name: 'Gemini',
          description: 'US-based regulated exchange with strong security and compliance standards.',
        };

      case 'moonpay':
        return {
          type: 'link',
          url: 'https://www.moonpay.com/buy',
          name: 'MoonPay',
          description: 'Fast and easy crypto purchases with credit or debit cards.',
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
          <h2>Buy Cryptocurrency</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="onramp-widget-content">
          <div className="onramp-info">
            <h3>How to Complete Your Payment</h3>
            <ol>
              <li>
                <strong>Select a trusted exchange</strong> below to purchase cryptocurrency with your credit or debit card
              </li>
              <li>
                Complete any required <strong>identity verification</strong> with the exchange (handled securely by them)
              </li>
              <li>
                <strong>Receive cryptocurrency</strong> directly in your personal wallet or exchange account
              </li>
              <li>
                Return to this payment page and <strong>open the BTCPay checkout</strong> to view the invoice address
              </li>
              <li>
                <strong>Send the purchased cryptocurrency</strong> to the BTCPay invoice address to complete your payment
              </li>
            </ol>

            <div className="important-note">
              <strong>Security Note:</strong> For your security and privacy, you'll need to manually copy the BTCPay invoice address when purchasing crypto. This ensures you maintain full control over your funds and protects your privacy.
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
              <option value="binance">Binance</option>
              <option value="gemini">Gemini</option>
              <option value="moonpay">MoonPay</option>
            </select>
            <p className="provider-note">
              All exchanges are trusted, regulated platforms with competitive fees and secure payment processing.
            </p>
          </div>

          <div className="widget-embed">
            {widgetConfig.type === 'iframe' && (
              <iframe
                src={widgetConfig.url}
                width="100%"
                height="600"
                frameBorder="0"
                title="Buy Cryptocurrency"
                allow="payment"
              />
            )}

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
                  After purchasing cryptocurrency, return to this page and send the crypto to your BTCPay invoice address to complete payment.
                </p>
              </div>
            )}

            {widgetConfig.type === 'sdk' && (
              <div className="widget-placeholder">
                <p>
                  <strong>Provider: {selectedProvider}</strong>
                </p>
                <p>
                  TODO: Load {selectedProvider} JavaScript SDK and initialize widget here.
                </p>
                <p className="widget-note">
                  See provider documentation for SDK integration:
                  <br />
                  {selectedProvider === 'ramp' && (
                    <a
                      href="https://docs.ramp.network/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ramp Documentation
                    </a>
                  )}
                </p>
              </div>
            )}

            {widgetConfig.type === 'script' && (
              <div className="widget-placeholder">
                <p>
                  <strong>Provider: {selectedProvider}</strong>
                </p>
                <p>
                  TODO: Load {selectedProvider} script tag and initialize widget here.
                </p>
                <p className="widget-note">
                  See provider documentation for script integration:
                  <br />
                  {selectedProvider === 'transak' && (
                    <a
                      href="https://docs.transak.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Transak Documentation
                    </a>
                  )}
                </p>
              </div>
            )}
          </div>

          <div className="widget-footer">
            <p>
              <strong>Payment Amount:</strong> ${amount.toFixed(2)} {currency}
            </p>
            <p className="footer-note">
              Purchase enough cryptocurrency to cover this amount plus network transaction fees (typically 1-3%).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnRampWidget;

