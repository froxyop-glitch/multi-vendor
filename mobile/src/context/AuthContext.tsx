import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient, saveAuthToken, removeAuthToken } from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'SELLER' | 'ADMIN';
  adminSubRole?: string | null;
  phone?: string | null;
  address?: string | null;
  sellerProfile?: any;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  quickSwitchAccount: (type: 'ADMIN' | 'MANAGER' | 'SUPPORT' | 'FINANCE' | 'SELLER_1' | 'SELLER_2' | 'CUSTOMER') => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => false,
  logout: async () => {},
  quickSwitchAccount: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await apiClient.get('/auth/me');
        if (res.data?.success && res.data?.user) {
          setUser(res.data.user);
        }
      } catch (e) {
        // user not authenticated
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = async (email: string, password = 'Password123!'): Promise<boolean> => {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      if (res.data?.success && res.data?.token) {
        await saveAuthToken(res.data.token);
        setUser(res.data.user);
        return true;
      }
    } catch (e) {}
    return false;
  };

  const logout = async () => {
    await removeAuthToken();
    setUser(null);
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
    <AuthContext.Provider value={{ user, isLoading, login, logout, quickSwitchAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
