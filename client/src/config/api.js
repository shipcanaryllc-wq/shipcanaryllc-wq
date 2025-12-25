// Centralized API configuration
// Uses REACT_APP_API_URL in production, falls back to localhost for development
const getApiBaseUrl = () => {
  // In production (Vercel), require REACT_APP_API_URL to be set
  if (process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost') {
    const apiUrl = process.env.REACT_APP_API_URL;
    if (!apiUrl) {
      console.error('❌ REACT_APP_API_URL is not set! Please configure it in Vercel environment variables.');
      // Return a placeholder that will fail gracefully
      return 'https://api-not-configured.vercel.app/api';
    }
    return apiUrl;
  }
  // Development: use localhost fallback
  return process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
};

const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;

