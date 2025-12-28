import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import Home from './components/Home/Home';
import Pricing from './components/Pricing/Pricing';
import Support from './components/Support/Support';
import Careers from './components/Careers/Careers';
import Checkout from './components/Checkout/Checkout';
import PaymentDetail from './components/Checkout/PaymentDetail';
import Profile from './components/Dashboard/Profile';
import ResetPassword from './components/Auth/ResetPassword';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './styles/theme.css';
import './App.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
}

function AuthCallback() {
  const { handleOAuthCallback } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    
    if (error) {
      navigate(`/login?error=${error}`);
      return;
    }
    
    if (token) {
      handleOAuthCallback(token).then((result) => {
        if (result.success) {
          navigate('/dashboard');
        } else {
          navigate('/login?error=google_auth_failed');
        }
      });
    } else {
      navigate('/login?error=google_auth_failed');
    }
  }, [searchParams, handleOAuthCallback, navigate]);
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
      color: 'white',
      fontSize: '1.2rem'
    }}>
      Completing sign in...
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/support" element={<Support />} />
      <Route path="/careers" element={<Careers />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/checkout" element={<PaymentDetail />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

