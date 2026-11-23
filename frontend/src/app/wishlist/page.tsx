'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function WishlistPage() {
  const { user } = useAuth();
  const { items, toggleWishlist, moveToCart } = useWishlist();

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <Heart className="w-16 h-16 text-gray-300 mx-auto" />
        <h2 className="text-xl font-bold text-gray-800">Please log in to view your wishlist</h2>
        <Link href="/" className="inline-block px-6 py-2.5 bg-fkblue text-white rounded font-bold text-xs">
          Go to Home & Login
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4 bg-white rounded border border-gray-200 mt-6 shadow-sm">
        <Heart className="w-20 h-20 text-gray-300 mx-auto" />
        <h2 className="text-lg font-bold text-gray-800">Your Wishlist is Empty</h2>
        <p className="text-xs text-gray-500">Explore products and tap the heart icon to save your favorites.</p>
        <Link
          href="/products"
          className="inline-block px-6 py-2.5 bg-fkblue text-white rounded font-bold text-xs shadow hover:bg-fkblue-dark"
        >
          Explore Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">My Wishlist ({items.length} items)</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((prod) => (
          <div key={prod.id} className="bg-white rounded border border-gray-200 shadow-sm p-3 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="relative aspect-square w-full rounded bg-gray-50 flex items-center justify-center p-2 mb-2">
                <img src={prod.images?.[0]} alt={prod.title} className="w-full h-full object-contain" />
                <button
                  onClick={() => toggleWishlist(prod.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-white shadow hover:bg-gray-100 text-red-500"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <Link href={`/product/${prod.slug || prod.id}`} className="text-xs font-semibold text-gray-800 hover:text-fkblue line-clamp-2">
                {prod.title}
              </Link>

              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-base font-bold text-gray-900">
                  ₹{prod.discount_price?.toLocaleString('en-IN')}
                </span>
                {prod.price > prod.discount_price && (
                  <span className="text-xs text-gray-400 line-through">
                    ₹{prod.price?.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t">
              <button
                onClick={async () => {
                  const ok = await moveToCart(prod.id);
                  if (ok) alert('Moved to cart!');
                }}
                className="w-full py-2 bg-fkyellow hover:bg-yellow-400 text-gray-900 font-bold rounded text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Move to Cart</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
