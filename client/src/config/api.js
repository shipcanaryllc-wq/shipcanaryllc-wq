// Centralized API configuration
// Uses REACT_APP_API_URL in production, falls back to localhost for development
const getApiBaseUrl = () => {
  // Single source of truth: always check REACT_APP_API_URL first
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Development fallback: only use localhost when not in production
  // Check if we're in browser (window exists) and on localhost
  if (typeof window !== 'undefined' && 
      process.env.NODE_ENV !== 'production' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5001/api';
  }
  
  // Production without REACT_APP_API_URL: log error and use localhost fallback
  // This allows the build to succeed, but the app will show errors at runtime
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    console.error('❌ REACT_APP_API_URL is not set! Please configure it in Vercel environment variables.');
    // Return localhost as fallback (will fail in production, but allows build)
    return 'http://localhost:5001/api';
  }
  
  // Default fallback for development
  return 'http://localhost:5001/api';
};

const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;

