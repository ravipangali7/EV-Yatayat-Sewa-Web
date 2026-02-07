import { api } from '@/lib/api';
import { User } from '@/types';

export interface LoginResponse {
  token: string;
  user: User;
}

export const authApi = {
  // Login with phone and password
  login: async (phone: string, password: string): Promise<LoginResponse> => {
    return api.post<LoginResponse>('auth/login/', { phone, password });
  },

  // Logout (invalidate token)
  logout: async (): Promise<void> => {
    try {
      await api.post('auth/logout/');
    } catch (error) {
      // Even if logout fails on server, clear local token
      console.error('Logout error:', error);
    }
  },

  // Get current authenticated user
  getCurrentUser: async (): Promise<User> => {
    return api.get<User>('auth/me/');
  },

  // Validate token by trying to get current user
  validateToken: async (): Promise<boolean> => {
    try {
      await authApi.getCurrentUser();
      return true;
    } catch (error) {
      return false;
    }
  },
};
