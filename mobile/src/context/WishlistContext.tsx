import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  items: any[];
  wishlistIds: Set<string>;
  totalCount: number;
  toggleWishlist: (productId: string) => Promise<boolean>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType>({
  items: [],
  wishlistIds: new Set(),
  totalCount: 0,
  toggleWishlist: async () => false,
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
    try {
      const res = await apiClient.get('/wishlist');
      if (res.data?.success && res.data?.items) {
        setItems(res.data.items);
        setWishlistIds(new Set(res.data.items.map((i: any) => i.id)));
      }
    } catch (e) {}
  }, [user]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const toggleWishlist = async (productId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await apiClient.post('/wishlist/toggle', { productId });
      if (res.data?.success) {
        await refreshWishlist();
        return res.data.isWishlisted;
      }
    } catch (e) {}
    return false;
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        wishlistIds,
        totalCount: items.length,
        toggleWishlist,
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
