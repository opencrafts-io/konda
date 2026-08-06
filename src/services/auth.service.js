// src/services/auth.service.js

class AuthService {
  constructor() {
    // Use localStorage for persistent storage
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    this.accessExpiresAt = localStorage.getItem('access_expires_at');
    this.userData = JSON.parse(localStorage.getItem('user_data') || 'null');
    this._isFetchingUser = false;
    this._lastFetchTime = 0;
    this._cacheDuration = 60000; // 1 minute cache
    
    // Get URLs from environment variables
    this.baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
    this.verisafeUrl = import.meta.env.VITE_VERISAFE_URL || 'https://qaverisafe.opencrafts.io';
    this.appUrl = import.meta.env.VITE_APP_URL || 'http://localhost:8080';
  }

  // Get the base URL for API calls
  getApiBaseUrl() {
    // In development, use the proxy path
    if (import.meta.env.DEV) {
      return '/verisafe';
    }
    return this.verisafeUrl;
  }

  // Get the backend base URL for direct calls
  getBackendBaseUrl() {
    return this.baseUrl;
  }

  // Initiate Google Sign-In - Mobile Flow with deep_link
  signInWithGoogle() {
    const deepLink = `${this.appUrl}/auth/callback`;
    const url = `${this.verisafeUrl}/auth/google?deep_link=${encodeURIComponent(deepLink)}`;
    window.location.href = url;
  }

  // Initiate Apple Sign-In - Mobile Flow with deep_link
  signInWithApple() {
    const deepLink = `${this.appUrl}/auth/callback`;
    const url = `${this.verisafeUrl}/auth/apple?deep_link=${encodeURIComponent(deepLink)}`;
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
          // Ignore
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
      
      if (!token) {
        return null;
      }

      // Check if token is expired
      if (this.isTokenExpired()) {
        try {
          await this.refreshToken();
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
        if (this.userData) {
          return this.userData;
        }
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  // Get user profile - With caching to prevent infinite requests
  async getUserProfile(forceRefresh = false) {
    try {
      // Check cache first
      const now = Date.now();
      if (!forceRefresh && this.userData && (now - this._lastFetchTime) < this._cacheDuration) {
        return this.userData;
      }

      // Prevent concurrent requests
      if (this._isFetchingUser) {
        return new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (!this._isFetchingUser) {
              clearInterval(checkInterval);
              resolve(this.userData);
            }
          }, 100);
        });
      }

      this._isFetchingUser = true;
      
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
          // Ignore
        }
        throw new Error(errorMessage);
      }

      const user = await response.json();
      
      // Cache user data
      this.userData = user;
      this._lastFetchTime = Date.now();
      localStorage.setItem('user_data', JSON.stringify(user));
      
      return user;
    } catch (error) {
      throw error;
    } finally {
      this._isFetchingUser = false;
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
    this._lastFetchTime = Date.now();
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

  // Make authenticated API call to the backend
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

    // Use the backend base URL for API calls
    const baseUrl = this.getBackendBaseUrl();
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
     throw error
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
      this._isFetchingUser = false;
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