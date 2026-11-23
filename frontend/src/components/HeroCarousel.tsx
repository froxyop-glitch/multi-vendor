'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BannerItem {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  redirectLink: string;
  position: string;
}

interface HeroCarouselProps {
  banners: BannerItem[];
}

export default function HeroCarousel({ banners }: HeroCarouselProps) {
  const heroBanners = banners.filter((b) => b.position === 'HERO_CAROUSEL');
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroBanners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [heroBanners.length]);

  if (heroBanners.length === 0) return null;

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + heroBanners.length) % heroBanners.length);
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % heroBanners.length);
  };

  const active = heroBanners[current];

  return (
    <div className="relative w-full max-w-7xl mx-auto my-3 px-2 sm:px-4">
      <div className="relative h-48 sm:h-72 md:h-84 lg:h-96 w-full overflow-hidden rounded shadow-sm bg-gray-900 group">
        <Link href={active.redirectLink || '/products'} className="relative block w-full h-full">
          <img
            src={active.imageUrl}
            alt={active.title}
            className="w-full h-full object-cover object-center transition-all duration-700 ease-out brightness-90 group-hover:brightness-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 sm:p-10 text-white">
            <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-md">
              {active.title}
            </h2>
            {active.subtitle && (
              <p className="mt-1 sm:mt-2 text-xs sm:text-base text-gray-200 font-medium max-w-xl drop-shadow">
                {active.subtitle}
              </p>
            )}
            <div className="mt-3">
              <span className="inline-flex items-center px-4 py-1.5 rounded-sm bg-fkyellow text-gray-900 font-bold text-xs sm:text-sm hover:bg-yellow-400 transition-colors shadow">
                Shop Now →
              </span>
            </div>
          </div>
        </Link>

        {/* Carousel Arrow Controls */}
        {heroBanners.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-r shadow-md transition-all focus:outline-none"
              aria-label="Previous Banner"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-l shadow-md transition-all focus:outline-none"
              aria-label="Next Banner"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
          {heroBanners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === current ? 'w-6 bg-fkyellow' : 'w-2 bg-white/60 hover:bg-white'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
