import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Fetch user error:', error.response?.status, error.response?.data?.message || error.message);
      // Only clear token if it's an auth error
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setToken(null);
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setToken(token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      return { success: true };
    } catch (error) {
      let errorMessage = 'Login failed';
      if (error.response?.status === 503) {
        errorMessage = 'Database connection error. Please check MongoDB configuration.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      return { 
        success: false, 
        message: errorMessage
      };
    }
  };

  const register = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setToken(token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      // Get detailed error message
      let errorMessage = 'Registration failed';
      if (error.response?.status === 503) {
        errorMessage = 'Database connection error. Please check MongoDB configuration.';
      } else if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors && error.response.data.errors.length > 0) {
          errorMessage = error.response.data.errors[0].msg || error.response.data.errors[0].message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      return { 
        success: false, 
        message: errorMessage
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateBalance = (newBalance) => {
    setUser(prev => ({ ...prev, balance: newBalance }));
  };

  const handleOAuthCallback = async (token) => {
    try {
      localStorage.setItem('token', token);
      setToken(token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      await fetchUser();
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Failed to complete sign in' };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateBalance,
    fetchUser,
    handleOAuthCallback
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

