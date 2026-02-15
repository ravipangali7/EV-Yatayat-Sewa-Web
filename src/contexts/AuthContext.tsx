import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AxiosError } from 'axios';
import { authApi } from '@/modules/auth/services/authApi';
import { User } from '@/types';
import { authSync as flutterAuthSync } from '@/lib/flutterBridge';

function getInitialUser(): User | null {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    const stored = localStorage.getItem('auth_user');
    if (!stored) return null;
    return JSON.parse(stored) as User;
  } catch {
    return null;
  }
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getInitialUser);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session and validate token
    const validateSession = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const userData = await authApi.getCurrentUser();
          setUser(userData);
        } catch (error) {
          // Only clear session on 401/403 (invalid/forbidden); keep cached user on network/other errors
          const status = error instanceof AxiosError && error.response ? error.response.status : null;
          if (status === 401 || status === 403) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            setUser(null);
          }
        }
      }
      setIsLoading(false);
    };
    validateSession();
  }, []);

  const login = async (phone: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login(phone, password);
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      setUser(response.user);
      flutterAuthSync(response.token, JSON.stringify(response.user));
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      flutterAuthSync('', '');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
