'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '../lib/api-client';
import { AuthUserResponse, SystemRole } from '@ems/shared';

interface AuthContextType {
  user: AuthUserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: SystemRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
  updateUserAvatar: (avatarUrl: string | null) => void;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('ems_access_token');
      const storedUser = localStorage.getItem('ems_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Refresh user profile in background
          const me = await api.get<AuthUserResponse>('/auth/me');
          setUser(me);
          localStorage.setItem('ems_user', JSON.stringify(me));
        } catch {
          // If token invalid, clear
          localStorage.removeItem('ems_access_token');
          localStorage.removeItem('ems_refresh_token');
          localStorage.removeItem('ems_user');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user: userProfile, tokens } = res;

      localStorage.setItem('ems_access_token', tokens.accessToken);
      localStorage.setItem('ems_refresh_token', tokens.refreshToken);
      localStorage.setItem('ems_user', JSON.stringify(userProfile));

      setUser(userProfile);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };


  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register', { email, password, firstName, lastName });
      const { user: userProfile, tokens } = res;

      localStorage.setItem('ems_access_token', tokens.accessToken);
      localStorage.setItem('ems_refresh_token', tokens.refreshToken);
      localStorage.setItem('ems_user', JSON.stringify(userProfile));

      setUser(userProfile);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('ems_refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Ignore
    } finally {
      localStorage.removeItem('ems_access_token');
      localStorage.removeItem('ems_refresh_token');
      localStorage.removeItem('ems_user');
      setUser(null);
      router.push('/login');
    }
  };

  const hasRole = (...roles: SystemRole[]): boolean => {
    if (!user || !user.roles) return false;
    return roles.some((r) => user.roles.includes(r));
  };

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };

  const updateUserAvatar = (avatarUrl: string | null) => {
    if (!user) return;
    const updatedUser = { ...user, avatarUrl: avatarUrl || undefined };
    setUser(updatedUser);
    localStorage.setItem('ems_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        hasRole,
        hasPermission,
        updateUserAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
