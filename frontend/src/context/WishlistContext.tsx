'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../lib/api';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  items: any[];
  wishlistIds: Set<string>;
  totalCount: number;
  toggleWishlist: (productId: string) => Promise<boolean>;
  moveToCart: (productId: string, variantId?: string | null) => Promise<boolean>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType>({
  items: [],
  wishlistIds: new Set(),
  totalCount: 0,
  toggleWishlist: async () => false,
  moveToCart: async () => false,
  refreshWishlist: async () => {},
});

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  const refreshWishlist = useCallback(async () => {
    if (!user) {
      setItems([]);
      setWishlistIds(new Set());
      return;
    }
    const res = await apiRequest('/wishlist');
    if (res.success && res.items) {
      setItems(res.items);
      setWishlistIds(new Set(res.items.map((i: any) => i.id)));
    }
  }, [user]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const toggleWishlist = async (productId: string): Promise<boolean> => {
    if (!user) {
      alert('Please log in to save items to your wishlist.');
      return false;
    }
    const res = await apiRequest('/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
    if (res.success) {
      await refreshWishlist();
      return res.isWishlisted;
    }
    return false;
  };

  const moveToCart = async (productId: string, variantId?: string | null): Promise<boolean> => {
    const res = await apiRequest('/wishlist/move-to-cart', {
      method: 'POST',
      body: JSON.stringify({ productId, variantId }),
    });
    if (res.success) {
      await refreshWishlist();
      return true;
    }
    return false;
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        wishlistIds,
        totalCount: items.length,
        toggleWishlist,
        moveToCart,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
