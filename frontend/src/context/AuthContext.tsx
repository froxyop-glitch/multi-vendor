'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'SELLER' | 'ADMIN';
  adminSubRole?: 'SUPER_ADMIN' | 'MANAGER' | 'SUPPORT_AGENT' | 'FINANCE' | null;
  phone?: string | null;
  address?: string | null;
  preferredLanguage?: string;
  sellerProfile?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  quickSwitchAccount: (type: 'ADMIN' | 'MANAGER' | 'SUPPORT' | 'FINANCE' | 'SELLER_1' | 'SELLER_2' | 'CUSTOMER') => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => false,
  logout: () => {},
  quickSwitchAccount: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('shopezy_token');
    const savedUser = localStorage.getItem('shopezy_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch {}
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password = 'Password123!'): Promise<boolean> => {
    setIsLoading(true);
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('shopezy_token', res.token);
      localStorage.setItem('shopezy_user', JSON.stringify(res.user));
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('shopezy_token');
    localStorage.removeItem('shopezy_user');
  };

  const quickSwitchAccount = async (type: 'ADMIN' | 'MANAGER' | 'SUPPORT' | 'FINANCE' | 'SELLER_1' | 'SELLER_2' | 'CUSTOMER') => {
    const emailMap: Record<string, string> = {
      ADMIN: 'admin@shopezy.com',
      MANAGER: 'manager@shopezy.com',
      SUPPORT: 'support@shopezy.com',
      FINANCE: 'finance@shopezy.com',
      SELLER_1: 'techworld@seller.com',
      SELLER_2: 'urbanstyle@seller.com',
      CUSTOMER: 'customer@shopezy.com',
    };
    const targetEmail = emailMap[type];
    if (targetEmail) {
      await login(targetEmail, 'Password123!');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, quickSwitchAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
