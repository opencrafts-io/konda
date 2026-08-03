// src/services/user-reentry.service.js
import authService from './auth.service';

const VERISAFE_URL = import.meta.env.VITE_VERISAFE_URL;
class UserReentryService {
  constructor() {
    this.GRACE_PERIOD_DAYS = 30;
  }

  // Get the base URL for API calls (use proxy in development)
  getApiBaseUrl() {
    return VERISAFE_URL;
  }

  // Check reentry status
  async checkReentryStatus(email) {
    try {
      const baseUrl = this.getApiBaseUrl();
      const response = await fetch(
        `${baseUrl}/accounts/reentry-check?email=${encodeURIComponent(email)}`, // Changed to /accounts/
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return { exists: false, canReenter: true };
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Reentry check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Handle reentry (restore account)
  async handleReentry(userData) {
    try {
      const token = authService.getAccessToken();
      const baseUrl = this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/accounts/restore`, { // Changed to /accounts/
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: userData.previousAccount?.id,
          restoreData: userData,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Restore failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Create new account with history
  async createNewAccountWithHistory(userData) {
    try {
      const token = authService.getAccessToken();
      const baseUrl = this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/accounts/create-with-history`, { // Changed to /accounts/
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          name: userData.name,
          previousAccountId: userData.previousAccount?.id,
          deletionReason: userData.deletionReason,
          deletedAt: userData.deletedAt,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Create with history failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Request account deletion with grace period
  async requestDeletion(reason = 'user_requested') {
    try {
      const token = authService.getAccessToken();
      const baseUrl = this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/accounts/deletion-request`, { // Changed to /accounts/
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason,
          gracePeriodDays: this.GRACE_PERIOD_DAYS,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Deletion request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Cancel deletion request
  async cancelDeletionRequest() {
    try {
      const token = authService.getAccessToken();
      const baseUrl = this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/accounts/deletion-request/cancel`, { // Changed to /accounts/
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Cancel deletion failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }
}

export default new UserReentryService();