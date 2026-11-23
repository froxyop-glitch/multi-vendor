'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Filter, Star, X, SlidersHorizontal } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import ProductCard from '../../components/ProductCard';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const searchQuery = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const ratingParam = searchParams.get('rating') || '';

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (categoryParam) params.set('category', categoryParam);
      if (sortParam) params.set('sort', sortParam);
      if (minPriceParam) params.set('minPrice', minPriceParam);
      if (maxPriceParam) params.set('maxPrice', maxPriceParam);
      if (ratingParam) params.set('rating', ratingParam);
      params.set('limit', '40');

      const res = await apiRequest(`/products?${params.toString()}`);
      if (res.success) {
        setProducts(res.products || []);
        setTotal(res.total || 0);
      }

      const catRes = await apiRequest('/store/config');
      if (catRes.success && catRes.categories) {
        setCategories(catRes.categories);
      }
      setIsLoading(false);
    }

    loadData();
  }, [searchQuery, categoryParam, sortParam, minPriceParam, maxPriceParam, ratingParam]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/products?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push('/products');
  };

  const hasActiveFilters = Boolean(
    categoryParam || minPriceParam || maxPriceParam || ratingParam || (sortParam && sortParam !== 'newest')
  );

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4">
      {/* Mobile Filter Toggle */}
      <div className="md:hidden flex items-center justify-between bg-white p-3 rounded mb-3 border shadow-sm">
        <span className="text-sm font-bold text-gray-800">
          Showing {products.length} of {total} products
        </span>
        <button
          onClick={() => setShowMobileFilters(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-fkblue text-white rounded text-xs font-bold"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
        </button>
      </div>

      <div className="flex gap-4 items-start">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden md:block w-64 bg-white rounded border border-gray-200 shadow-sm p-4 shrink-0 divide-y divide-gray-200 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-fkblue" />
              <span>Filters</span>
            </h3>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-fkblue hover:underline font-semibold"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="pt-3">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
              Categories
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              <button
                onClick={() => updateFilter('category', '')}
                className={`w-full text-left text-xs py-1 px-1.5 rounded transition-colors ${
                  !categoryParam ? 'font-bold text-fkblue bg-blue-50' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => updateFilter('category', c.slug)}
                  className={`w-full text-left text-xs py-1 px-1.5 rounded transition-colors ${
                    categoryParam === c.slug ? 'font-bold text-fkblue bg-blue-50' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="pt-3">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
              Price Range
            </h4>
            <div className="space-y-1 text-xs">
              {[
                { label: 'Under ₹1,000', min: '', max: '1000' },
                { label: '₹1,000 - ₹5,000', min: '1000', max: '5000' },
                { label: '₹5,000 - ₹15,000', min: '5000', max: '15000' },
                { label: '₹15,000 - ₹50,000', min: '15000', max: '5000' },
                { label: 'Above ₹50,000', min: '50000', max: '' },
              ].map((tier, idx) => (
                <label key={idx} className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-fkblue">
                  <input
                    type="radio"
                    name="price_tier"
                    checked={minPriceParam === tier.min && maxPriceParam === tier.max}
                    onChange={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      if (tier.min) params.set('minPrice', tier.min);
                      else params.delete('minPrice');
                      if (tier.max) params.set('maxPrice', tier.max);
                      else params.delete('maxPrice');
                      router.push(`/products?${params.toString()}`);
                    }}
                    className="accent-fkblue"
                  />
                  <span>{tier.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Customer Rating */}
          <div className="pt-3">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
              Customer Ratings
            </h4>
            <div className="space-y-1.5 text-xs">
              {[4, 3].map((stars) => (
                <label key={stars} className="flex items-center gap-2 cursor-pointer text-gray-700">
                  <input
                    type="radio"
                    name="rating_filter"
                    checked={ratingParam === String(stars)}
                    onChange={() => updateFilter('rating', String(stars))}
                    className="accent-fkblue"
                  />
                  <span className="flex items-center gap-1 font-semibold">
                    {stars}★ & above
                  </span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Catalog Grid & Sorting */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded border border-gray-200 shadow-sm p-3 mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-sm sm:text-base font-bold text-gray-900">
                {searchQuery ? `Search results for "${searchQuery}"` : categoryParam ? `Category: ${categoryParam}` : 'All Products'}
              </h1>
              <p className="text-xs text-gray-500">Showing {products.length} products</p>
            </div>

            {/* Sorting Tabs */}
            <div className="flex items-center gap-1 sm:gap-2 text-xs font-semibold">
              <span className="text-gray-500 hidden sm:inline">Sort By:</span>
              {[
                { label: 'Popularity', key: 'rating' },
                { label: 'Price -- Low to High', key: 'price_asc' },
                { label: 'Price -- High to Low', key: 'price_desc' },
                { label: 'Newest First', key: 'newest' },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => updateFilter('sort', s.key)}
                  className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                    sortParam === s.key ? 'bg-fkblue text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="bg-white rounded p-12 text-center text-gray-500 font-medium">
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded border border-gray-200 p-12 text-center space-y-3">
              <p className="text-base font-bold text-gray-700">No products found matching your filters</p>
              <p className="text-xs text-gray-500">Try clearing filters or searching with a different term.</p>
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-fkblue text-white rounded text-xs font-bold hover:bg-fkblue-dark"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  title={p.title}
                  slug={p.slug}
                  images={p.images}
                  price={p.price}
                  discount_price={p.discount_price}
                  rating={p.rating}
                  review_count={p.review_count}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading catalog...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
