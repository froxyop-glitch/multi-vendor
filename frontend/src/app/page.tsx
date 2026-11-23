'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Tag, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../lib/api';
import AnnouncementBar from '../components/AnnouncementBar';
import CategoryBar from '../components/CategoryBar';
import HeroCarousel from '../components/HeroCarousel';
import FlashSaleStrip from '../components/FlashSaleStrip';
import ProductCard from '../components/ProductCard';

export default function HomePage() {
  const { language, t } = useLanguage();
  const [config, setConfig] = useState<any>(null);
  const [banners, setBanners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [activeFlashSale, setActiveFlashSale] = useState<any>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStorefront() {
      setIsLoading(true);
      const res = await apiRequest(`/store/config?lang=${language}`);
      if (res.success) {
        setConfig(res.config);
        setBanners(res.banners || []);
        setCategories(res.categories || []);
        setFeaturedProducts(res.featuredProducts || []);
        setActiveFlashSale(res.activeFlashSale || null);
      }

      const prodRes = await apiRequest('/products?limit=16');
      if (prodRes.success && prodRes.products) {
        setAllProducts(prodRes.products);
      }
      setIsLoading(false);
    }

    loadStorefront();
  }, [language]);

  const midPromo = banners.find((b) => b.position === 'MID_PROMO');
  const electronicsProducts = allProducts.filter((p) => p.category_id === 'cat_electronics' || p.category_id === 'cat_mobiles');
  const fashionProducts = allProducts.filter((p) => p.category_id === 'cat_fashion' || p.category_id === 'cat_sports');

  return (
    <div className="space-y-3 pb-8">
      {/* Localized Announcement Strip */}
      <AnnouncementBar text={config?.announcement_bar_text} />

      {/* Horizontal Category Strip */}
      <CategoryBar categories={categories} />

      {/* Hero Carousel */}
      <HeroCarousel banners={banners} />

      {/* Countdown Flash Sale */}
      {activeFlashSale && <FlashSaleStrip flashSale={activeFlashSale} />}

      {/* Deals of the Day / Featured Rail */}
      <section className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-fkblue" />
              <div>
                <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                  Featured Products & Best Deals
                </h2>
                <p className="text-xs text-gray-500 font-medium">Curated top picks with maximum savings</p>
              </div>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-fkblue hover:text-fkblue-dark hover:underline"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 p-4">
            {(featuredProducts.length > 0 ? featuredProducts : allProducts.slice(0, 4)).map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                slug={product.slug}
                images={product.images}
                price={product.price}
                discount_price={product.discount_price}
                rating={product.rating}
                review_count={product.review_count}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Mid-Promo Promotional Banner */}
      {midPromo && (
        <section className="max-w-7xl mx-auto px-2 sm:px-4">
          <Link
            href={midPromo.redirectLink || '/products?category=fashion-apparel'}
            className="block relative h-36 sm:h-52 w-full rounded overflow-hidden shadow-sm group"
          >
            <img
              src={midPromo.imageUrl}
              alt={midPromo.title}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex flex-col justify-center px-6 sm:px-12 text-white">
              <span className="text-[11px] font-bold uppercase tracking-wider text-fkyellow">
                Special Collection
              </span>
              <h3 className="text-lg sm:text-2xl font-black mt-1">{midPromo.title}</h3>
              {midPromo.subtitle && (
                <p className="text-xs sm:text-sm text-gray-200 mt-1 max-w-md">{midPromo.subtitle}</p>
              )}
            </div>
          </Link>
        </section>
      )}

      {/* Electronics & Gadgets Showcase Rail */}
      {electronicsProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-fkblue" />
                <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                  Top Electronics & Flagship Mobiles
                </h2>
              </div>
              <Link
                href="/products?category=electronics"
                className="text-xs sm:text-sm font-bold text-fkblue hover:underline"
              >
                Explore Category →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 p-4">
              {electronicsProducts.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  title={product.title}
                  slug={product.slug}
                  images={product.images}
                  price={product.price}
                  discount_price={product.discount_price}
                  rating={product.rating}
                  review_count={product.review_count}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending Fashion Wardrobe Rail */}
      {fashionProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                  Trending Wardrobe & Lifestyle
                </h2>
              </div>
              <Link
                href="/products?category=fashion-apparel"
                className="text-xs sm:text-sm font-bold text-fkblue hover:underline"
              >
                Shop Fashion →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 p-4">
              {fashionProducts.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  title={product.title}
                  slug={product.slug}
                  images={product.images}
                  price={product.price}
                  discount_price={product.discount_price}
                  rating={product.rating}
                  review_count={product.review_count}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust & GST Assurance banner */}
      <section className="max-w-7xl mx-auto px-2 sm:px-4 pt-2">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-900 text-white rounded p-4 sm:p-6 shadow flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-10 h-10 text-fkyellow shrink-0" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">100% Buyer Protection & GST Tax Invoicing</h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Every purchase is protected with official GST tax invoices, 7-day hassle-free return window & verified sellers.
              </p>
            </div>
          </div>
          <Link
            href="/support"
            className="px-5 py-2 rounded-sm bg-fkyellow text-gray-900 font-bold text-xs sm:text-sm hover:bg-yellow-400 shrink-0 shadow"
          >
            24x7 Help Desk
          </Link>
        </div>
      </section>
    </div>
  );
}
