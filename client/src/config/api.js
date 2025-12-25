// Centralized API configuration
// Uses REACT_APP_API_URL in production, falls back to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export default API_BASE_URL;

