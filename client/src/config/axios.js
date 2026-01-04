import axios from 'axios';
import API_BASE_URL from './api';

/**
 * Centralized Axios instance for API requests
 * All auth and API calls should use this instance
 * 
 * Base URL is automatically set to API_BASE_URL
 * Authorization header is set from localStorage token when available
 */

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor: Add auth token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized - clear token and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      delete apiClient.defaults.headers.common['Authorization'];
      // Don't redirect automatically - let components handle it
    }
    return Promise.reject(error);
  }
);

export default apiClient;

