// src/components/AuthCallback/index.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/auth.service.js';
import { LoginContext } from '../../loginContext.jsx';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loginContext = useContext(LoginContext);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const handleCallback = async () => {
      const debug = {
        url: window.location.href,
        search: location.search,
        hash: location.hash,
        pathname: location.pathname,
        timestamp: new Date().toISOString()
      };
      setDebugInfo(debug);
      
      try {

        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const errorParam = params.get('error');
        const errorDescription = params.get('error_description');


        if (errorParam) {
          setError(`Authentication failed: ${errorDescription || errorParam}`);
          setTimeout(() => navigate('/login'), 3000);
          setLoading(false);
          return;
        }

        if (!code) {
          setError('No authentication code found');
          setTimeout(() => navigate('/login'), 3000);
          setLoading(false);
          return;
        }
        
        try {
          const tokens = await authService.exchangeCode(code);
          
          authService.setTokens(tokens);

          const user = await authService.getUserProfile();
          
          if (user) {
            // Store in localStorage for persistence
            localStorage.setItem('userName', user.name || '');
            localStorage.setItem('email', user.email || '');
            localStorage.setItem('user_id', user.id || '');
            localStorage.setItem('profile_pic', user.avatar_url || '');
            localStorage.setItem('token', tokens.access_token);
            
            // Update context
            loginContext.setUserName(user.name || '');
            loginContext.setEmail(user.email || '');
            loginContext.setUser_id(user.id || '');
            loginContext.setProfile_pic(user.avatar_url || '');
            loginContext.setToken(tokens.access_token);
          }
          
          window.history.replaceState({}, document.title, location.pathname);
          
          navigate('/dashboard');
        } catch (exchangeError) {
          setError(`Authentication failed: ${exchangeError.message || 'Please try again.'}`);
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (error) {
        setError('Authentication failed. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [navigate, location, loginContext]);

  // Loading UI
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#253745',
        color: 'white'
      }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '20px' }}>Signing you in...</p>
        <pre style={{ 
          marginTop: '20px', 
          fontSize: '12px', 
          color: '#8a9a9a',
          maxWidth: '600px',
          overflow: 'auto',
          padding: '10px',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '4px'
        }}>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    );
  }

  // Error UI
  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#253745',
        color: 'white',
        padding: '20px'
      }}>
        <h2 style={{ color: '#ef9a9a' }}>Authentication Error</h2>
        <p style={{ color: '#d0d8e0' }}>{error}</p>
        <p style={{ color: '#8a9a9a' }}>Redirecting to login...</p>
        <pre style={{ 
          marginTop: '20px', 
          fontSize: '12px', 
          color: '#8a9a9a',
          maxWidth: '600px',
          overflow: 'auto',
          padding: '10px',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '4px',
          textAlign: 'left'
        }}>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    );
  }

  return null;
};

export default AuthCallback;