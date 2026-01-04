// Centralized API configuration
// Single source of truth for API base URL
// Ensures all requests include /api prefix for production backend

const getApiBaseUrl = () => {
  // Priority 1: REACT_APP_API_URL (should include /api already)
  if (process.env.REACT_APP_API_URL) {
    const url = process.env.REACT_APP_API_URL.trim();
    // Ensure it ends with /api (handles both https://api.shipcanary.com and https://api.shipcanary.com/api)
    if (url.endsWith('/api')) {
      return url;
    }
    // If URL doesn't end with /api, add it
    return `${url.replace(/\/$/, '')}/api`;
  }
  
  // Priority 2: VITE_API_URL (for Vite compatibility)
  if (process.env.VITE_API_URL) {
    const url = process.env.VITE_API_URL.trim();
    if (url.endsWith('/api')) {
      return url;
    }
    return `${url.replace(/\/$/, '')}/api`;
  }
  
  // Development fallback: localhost with /api
  if (typeof window !== 'undefined' && 
      process.env.NODE_ENV !== 'production' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5001/api';
  }
  
  // Production without env var: log error
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    console.error('❌ REACT_APP_API_URL is not set! Please configure it in Vercel environment variables.');
    console.error('Expected format: https://api.shipcanary.com/api');
  }
  
  // Default fallback for development
  return 'http://localhost:5001/api';
};

const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;

