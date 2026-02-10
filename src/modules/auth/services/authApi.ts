import { api } from '@/lib/api';
import { User } from '@/types';

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterPayload {
  name: string;
  phone: string;
  email?: string;
  password: string;
}

export interface RegisterResponse {
  token: string;
  user: User;
  message: string;
}

export interface VerifyOtpResponse {
  message: string;
  reset_token: string;
  phone: string;
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

  // Register new user (app)
  register: async (data: RegisterPayload): Promise<RegisterResponse> => {
    return api.post<RegisterResponse>('auth/register/', data);
  },

  // Forgot password - send OTP to phone
  forgotPassword: async (phone: string): Promise<{ message: string; phone: string }> => {
    return api.post<{ message: string; phone: string }>('auth/forgot-password/', { phone });
  },

  // Verify OTP - returns reset_token for changePassword
  verifyOtp: async (phone: string, otp_code: string): Promise<VerifyOtpResponse> => {
    return api.post<VerifyOtpResponse>('auth/verify-otp/', { phone, otp_code });
  },

  // Change password using reset token (after verify OTP)
  changePassword: async (reset_token: string, new_password: string): Promise<{ message: string }> => {
    return api.post<{ message: string }>('auth/change-password/', { reset_token, new_password });
  },
};
