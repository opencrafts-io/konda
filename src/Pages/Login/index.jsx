// src/Pages/Login/index.jsx (or wherever your login page is)
import React, { useContext, useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { LoginContext } from '../../loginContext';
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import authService from '../../services/auth.service.js';
import style from './index.module.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loginContext = useContext(LoginContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is already authenticated (persistent)
  useEffect(() => {
    const checkAuth = async () => {
      try {

        // Check for existing session
        const token = localStorage.getItem('token');
        const userName = localStorage.getItem('userName');
        const email = localStorage.getItem('email');
        const userId = localStorage.getItem('user_id');
        const profilePic = localStorage.getItem('profile_pic');

        if (token && userName) {
          
          // Update context with stored data
          loginContext.setUserName(userName);
          loginContext.setEmail(email || '');
          loginContext.setUser_id(userId || '');
          loginContext.setProfile_pic(profilePic || '');
          loginContext.setToken(token);
          
          // Verify token is still valid
          try {
            const user = await authService.checkAuth();
            if (user) {
              navigate('/dashboard');
              return;
            }
          } catch (verifyError) {
            // Clear invalid session
            localStorage.removeItem('token');
            localStorage.removeItem('userName');
            localStorage.removeItem('email');
            localStorage.removeItem('user_id');
            localStorage.removeItem('profile_pic');
          }
        }
      
      } catch (error) {
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [navigate, loginContext]);

  // Handle OAuth callback parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const errorParam = params.get('error');
    const errorDescription = params.get('error_description');

    if (code) {
      return; // AuthCallback will handle this
    }

    if (errorParam) {
      setError(`Authentication failed: ${errorDescription || errorParam}`);
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location]);

  const handleSocialSignIn = async (provider) => {
    setLoading(true);
    setError(null);

    try {
      
      if (provider === 'Google') {
        authService.signInWithGoogle();
      } else if (provider === 'Apple') {
        authService.signInWithApple();
      }
    } catch (error) {
      setError(`Failed to sign in with ${provider}. Please try again.`);
      setLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className={style.container}>
        <div className={style.loadingContainer}>
          <div className={style.spinner}></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={style.container}>
      {/* Left Branding Section */}
      <div className={style.brandSection}>
        <div className={style.overlay}>
          <h1 className={style.brandTagline}>Welcome back</h1>
          <p style={{ color: 'white', fontSize: '18px', marginTop: '10px' }}>
            Manage your trips and book new adventures easily.
          </p>
        </div>
      </div>

      {/* Right Form Section */}
      <div className={style.formSection}>
        <div className={style.form}>
          <div className={style.header}>
            <h2>Welcome Back!</h2>
            <p>Login to your account.</p>
          </div>

          {error && (
            <div className={style.errorMessage}>
              <span className={style.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          <button 
            type="button" 
            className={style.socialBtn}
            onClick={() => handleSocialSignIn('Google')}
            disabled={loading}
          >
            {loading ? (
              <span className={style.loadingSpinner}></span>
            ) : (
              <FcGoogle className={style.socialIcon} />
            )}
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>

          <button 
            type="button" 
            className={style.socialBtn}
            onClick={() => handleSocialSignIn('Apple')}
            disabled={loading}
          >
            {loading ? (
              <span className={style.loadingSpinner}></span>
            ) : (
              <FaApple className={style.socialIcon} />
            )}
            {loading ? 'Signing in...' : 'Sign in with Apple'}
          </button>

          <p className={style.footer}>
            Don't have an account? <Link to="/signup" className={style.link}>Create an account</Link>
          </p>
        </div>

        <div className={style.footerLinks}>
          <span className={style.brandName}>BusBooking</span>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/help">Help Center</Link>
          <Link to="/contact">Contact Us</Link>
          <Link to="/careers">Careers</Link>
        </div>

        <p className={style.disclaimer}>© 2024 BusBooking. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Login;