'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../lib/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: any[];
  totalPayable: number;
  itemsSubtotal: number;
  originalSubtotal: number;
  totalSavings: number;
  shippingFee: number;
  couponDiscount: number;
  couponCode: string | null;
  totalCount: number;
  isLoading: boolean;
  addToCart: (productId: string, variantId?: string | null, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  items: [],
  totalPayable: 0,
  itemsSubtotal: 0,
  originalSubtotal: 0,
  totalSavings: 0,
  shippingFee: 0,
  couponDiscount: 0,
  couponCode: null,
  totalCount: 0,
  isLoading: false,
  addToCart: async () => false,
  updateQuantity: async () => {},
  removeItem: async () => {},
  applyCoupon: async () => ({ success: false, message: '' }),
  refreshCart: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [totalPayable, setTotalPayable] = useState(0);
  const [itemsSubtotal, setItemsSubtotal] = useState(0);
  const [originalSubtotal, setOriginalSubtotal] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      setTotalPayable(0);
      setItemsSubtotal(0);
      return;
    }
    setIsLoading(true);
    const query = couponCode ? `?couponCode=${encodeURIComponent(couponCode)}` : '';
    const res = await apiRequest(`/cart${query}`);
    if (res.success && res.items) {
      setItems(res.items);
      setTotalPayable(res.totalPayable || 0);
      setItemsSubtotal(res.itemsSubtotal || 0);
      setOriginalSubtotal(res.originalSubtotal || 0);
      setTotalSavings(res.totalSavings || 0);
      setShippingFee(res.shippingFee || 0);
      setCouponDiscount(res.couponDiscount || 0);
      setCouponCode(res.couponCode || null);
    }
    setIsLoading(false);
  }, [user, couponCode]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId: string, variantId?: string | null, quantity = 1): Promise<boolean> => {
    if (!user) {
      alert('Please log in to add items to your cart.');
      return false;
    }
    const res = await apiRequest('/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, variantId, quantity }),
    });
    if (res.success) {
      await refreshCart();
      return true;
    }
    return false;
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    await apiRequest(`/cart/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
    await refreshCart();
  };

  const removeItem = async (itemId: string) => {
    await apiRequest(`/cart/${itemId}`, {
      method: 'DELETE',
    });
    await refreshCart();
  };

  const applyCoupon = async (code: string) => {
    const res = await apiRequest('/coupons/validate-coupon', {
      method: 'POST',
      body: JSON.stringify({ code, cartAmount: itemsSubtotal }),
    });
    if (res.success) {
      setCouponCode(code);
      await refreshCart();
      return { success: true, message: res.message || 'Coupon applied!' };
    }
    return { success: false, message: res.message || 'Coupon invalid.' };
  };

  const totalCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        totalPayable,
        itemsSubtotal,
        originalSubtotal,
        totalSavings,
        shippingFee,
        couponDiscount,
        couponCode,
        totalCount,
        isLoading,
        addToCart,
        updateQuantity,
        removeItem,
        applyCoupon,
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
