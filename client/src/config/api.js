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
  
  // Production without REACT_APP_API_URL: return placeholder that will fail at runtime
  // Don't throw during build - let it fail at runtime instead
  if (typeof window !== 'undefined') {
    console.error('❌ REACT_APP_API_URL is not set! Please configure it in Vercel environment variables.');
  }
  
  // Return a placeholder that will cause API calls to fail gracefully
  // This allows the build to succeed, but the app will show errors at runtime
  return process.env.NODE_ENV === 'production' 
    ? 'https://api-not-configured.vercel.app/api' 
    : 'http://localhost:5001/api';
};

const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;

