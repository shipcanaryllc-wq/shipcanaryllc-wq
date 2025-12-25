// Centralized API configuration
// Uses REACT_APP_API_URL in production, falls back to localhost for development
const getApiBaseUrl = () => {
  // Single source of truth: always check REACT_APP_API_URL first
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Development fallback: only use localhost when not in production
  if (process.env.NODE_ENV !== 'production' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5001/api';
  }
  
  // Production without REACT_APP_API_URL: throw error to catch misconfiguration
  console.error('❌ REACT_APP_API_URL is not set! Please configure it in Vercel environment variables.');
  throw new Error('REACT_APP_API_URL environment variable is required in production');
};

const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;

