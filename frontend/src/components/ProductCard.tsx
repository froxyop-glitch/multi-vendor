'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';

export interface ProductCardProps {
  id: string;
  title: string;
  slug: string;
  images: string[];
  price: number;
  discount_price: number;
  rating: number;
  review_count: number;
  is_featured?: boolean;
}

export default function ProductCard({
  id,
  title,
  slug,
  images,
  price,
  discount_price,
  rating,
  review_count,
}: ProductCardProps) {
  const { wishlistIds, toggleWishlist } = useWishlist();
  const isWishlisted = wishlistIds.has(id);

  const discountPercent = Math.round(((price - discount_price) / price) * 100);
  const mainImage = images && images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800';

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(id);
  };

  return (
    <div className="relative group bg-white border border-gray-100 rounded hover:shadow-lg transition-all flex flex-col justify-between p-3">
      {/* Wishlist Heart Icon */}
      <button
        onClick={handleWishlistClick}
        className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm transition-transform active:scale-90"
        aria-label="Wishlist"
      >
        <Heart
          className={`w-4 h-4 transition-colors ${
            isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'
          }`}
        />
      </button>

      <Link href={`/product/${slug || id}`} className="block">
        {/* Product Image */}
        <div className="relative aspect-square w-full rounded overflow-hidden bg-gray-50 flex items-center justify-center p-3">
          <img
            src={mainImage}
            alt={title}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Content */}
        <div className="mt-3">
          <h3 className="text-xs sm:text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-fkblue transition-colors leading-snug">
            {title}
          </h3>

          {/* Rating Pill */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="inline-flex items-center gap-0.5 bg-green-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              <span>{rating.toFixed(1)}</span>
              <Star className="w-2.5 h-2.5 fill-white" />
            </span>
            <span className="text-[11px] font-semibold text-gray-400">
              ({review_count.toLocaleString('en-IN')})
            </span>
          </div>

          {/* Price & Discount */}
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-base sm:text-lg font-black text-gray-900">
              ₹{discount_price.toLocaleString('en-IN')}
            </span>
            {price > discount_price && (
              <>
                <span className="text-xs text-gray-400 line-through">
                  ₹{price.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-green-700">
                  {discountPercent}% off
                </span>
              </>
            )}
          </div>

          {/* Free Delivery Tag */}
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[10px] font-semibold text-gray-500">
              {discount_price >= 499 ? 'Free delivery' : 'Delivery ₹40'}
            </span>
            <span className="text-[10px] font-bold text-fkblue italic">
              Assured ★
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
