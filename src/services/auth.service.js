// src/services/auth.service.js

// Use the QA Verisafe URL your team gave you
const VERISAFE_URL = 'https://qaverisafe.opencrafts.io';

class AuthService {
  constructor() {
    // Use localStorage for persistent storage
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    this.accessExpiresAt = localStorage.getItem('access_expires_at');
    this.userData = JSON.parse(localStorage.getItem('user_data') || 'null');
  }

  // Get the base URL for API calls (use proxy in development)
  getApiBaseUrl() {
    return import.meta.env.DEV ? '/verisafe' : 'https://qaverisafe.opencrafts.io';
  }

  // Initiate Google Sign-In - Mobile Flow with deep_link
  signInWithGoogle() {
    const deepLink = 'http://localhost:8080/auth/callback';
    const url = `${VERISAFE_URL}/auth/google?deep_link=${encodeURIComponent(deepLink)}`;
    window.location.href = url;
  }

  // Initiate Apple Sign-In - Mobile Flow with deep_link
  signInWithApple() {
    const deepLink = 'http://localhost:8080/auth/callback';
    const url = `${VERISAFE_URL}/auth/apple?deep_link=${encodeURIComponent(deepLink)}`;
    window.location.href = url;
  }

  // Exchange code for tokens (mobile/deep link flow)
  async exchangeCode(code) {
    try {
      
      const baseUrl = this.getApiBaseUrl();
      const url = `${baseUrl}/auth/token/exchange`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
        credentials: 'include',
      });


      if (!response.ok) {
        let errorMessage = `Token exchange failed: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          const text = await response.text();
        }
        throw new Error(errorMessage);
      }

      const tokens = await response.json();
      
      return tokens;
    } catch (error) {
      throw error;
    }
  }

  // Check if user is authenticated
  async checkAuth() {
    try {
      const token = this.getAccessToken();
      const baseUrl = this.getApiBaseUrl();
      
      if (!token) {
        return null;
      }

      // Check if token is expired
      if (this.isTokenExpired()) {
        try {
          await this.refreshToken();
          // After refresh, get user profile with new token
          const user = await this.getUserProfile();
          return user;
        } catch (refreshError) {
          this.logout();
          return null;
        }
      }
      
      // Token is valid, get user profile
      try {
        const user = await this.getUserProfile();
        return user;
      } catch (profileError) {
        // If we have stored user data, return it
        if (this.userData) {
          return this.userData;
        }
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  // Get user profile - Using /accounts/me endpoint
  async getUserProfile() {
    try {
      const token = this.getAccessToken();
      
      if (!token) {
        throw new Error('No access token available');
      }

      const baseUrl = this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/accounts/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });


      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
          throw new Error('Session expired');
        }
        
        let errorMessage = `Failed to fetch profile: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          const text = await response.text();
        }
        throw new Error(errorMessage);
      }

      const user = await response.json();
      
      // Cache user data
      this.userData = user;
      localStorage.setItem('user_data', JSON.stringify(user));
      
      return user;
    } catch (error) {
      throw error;
    }
  }

  // Store tokens
  setTokens(tokens) {
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
    this.accessExpiresAt = tokens.access_expires_at;
    
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    localStorage.setItem('access_expires_at', tokens.access_expires_at);
    
  }

  // Store user data
  setUserData(user) {
    this.userData = user;
    localStorage.setItem('user_data', JSON.stringify(user));
  }

  // Get access token
  getAccessToken() {
    return localStorage.getItem('access_token');
  }

  // Check if token is expired
  isTokenExpired() {
    const expiresAt = localStorage.getItem('access_expires_at');
    if (!expiresAt) return true;
    return new Date(expiresAt) < new Date();
  }

  // Get cached user data
  getCachedUser() {
    return JSON.parse(localStorage.getItem('user_data') || 'null');
  }

  // Refresh token
  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const baseUrl = this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/auth/token/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 400) {
          this.logout();
          throw new Error('Session expired - please login again');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Refresh failed: ${response.status}`);
      }

      const tokens = await response.json();
      this.setTokens(tokens);
      return tokens;
    } catch (error) {
      throw error;
    }
  }

  // Make authenticated API call
  async apiCall(endpoint, options = {}) {
    let token = this.getAccessToken();

    if (this.isTokenExpired()) {
      try {
        const tokens = await this.refreshToken();
        token = tokens.access_token;
      } catch (error) {
        this.logout();
        throw error;
      }
    }

    const baseUrl = this.getApiBaseUrl();
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      ...options,
    };

    if (options.body && options.body instanceof FormData) {
      delete requestOptions.headers['Content-Type'];
    }

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, requestOptions);

      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
          throw new Error('Session expired');
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API call failed: ${response.status}`);
      }

      const data = await response.json();
      return { data, status: response.status, headers: response.headers };
    } catch (error) {
      throw error;
    }
  }

  // Helper methods
  async get(endpoint) {
    return this.apiCall(endpoint, { method: 'GET' });
  }

  async post(endpoint, body) {
    return this.apiCall(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put(endpoint, body) {
    return this.apiCall(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete(endpoint) {
    return this.apiCall(endpoint, { method: 'DELETE' });
  }

  async patch(endpoint, body) {
    return this.apiCall(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  // Logout
  async logout() {
    try {
      const token = this.getAccessToken();
      const baseUrl = this.getApiBaseUrl();
      if (token) {
        await fetch(`${baseUrl}/auth/token/revoke`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
      }
    } catch (error) {
      throw error;
    } finally {
      // Clear all auth data
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('access_expires_at');
      localStorage.removeItem('user_data');
      localStorage.removeItem('userName');
      localStorage.removeItem('email');
      localStorage.removeItem('user_id');
      
      this.accessToken = null;
      this.refreshToken = null;
      this.accessExpiresAt = null;
      this.userData = null;
    }
  }

  // Check if user has permission
  async hasPermission(permissionName) {
    try {
      const response = await this.apiCall(`/accounts/permissions/check/${permissionName}`);
      return response.data.hasPermission || false;
    } catch (error) {
      return false;
    }
  }

  // Get user permissions
  async getUserPermissions() {
    try {
      const response = await this.apiCall('/accounts/permissions/me');
      return response.data || [];
    } catch (error) {
      return [];
    }
  }
}

export default new AuthService();