import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: any[];
  totalPayable: number;
  totalCount: number;
  isLoading: boolean;
  addToCart: (productId: string, variantId?: string | null, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  items: [],
  totalPayable: 0,
  totalCount: 0,
  isLoading: false,
  addToCart: async () => false,
  updateQuantity: async () => {},
  removeItem: async () => {},
  refreshCart: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [totalPayable, setTotalPayable] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      setTotalPayable(0);
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiClient.get('/cart');
      if (res.data?.success && res.data?.items) {
        setItems(res.data.items);
        setTotalPayable(res.data.totalPayable || 0);
      }
    } catch (e) {}
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId: string, variantId?: string | null, quantity = 1): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await apiClient.post('/cart', { productId, variantId, quantity });
      if (res.data?.success) {
        await refreshCart();
        return true;
      }
    } catch (e) {}
    return false;
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      await apiClient.put(`/cart/${itemId}`, { quantity });
      await refreshCart();
    } catch (e) {}
  };

  const removeItem = async (itemId: string) => {
    try {
      await apiClient.delete(`/cart/${itemId}`);
      await refreshCart();
    } catch (e) {}
  };

  const totalCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        totalPayable,
        totalCount,
        isLoading,
        addToCart,
        updateQuantity,
        removeItem,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
