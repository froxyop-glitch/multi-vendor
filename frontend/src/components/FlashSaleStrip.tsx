'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, Clock, Zap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface FlashSaleItem {
  id: string;
  productId: string;
  title: string;
  slug: string;
  image: string;
  regularPrice: number;
  discountPrice: number;
  flashPrice: number;
  flashStockLimit: number;
  soldCount: number;
  percentSold: number;
}

interface FlashSaleData {
  id: string;
  title: string;
  bannerColor: string;
  startsAt: string;
  endsAt: string;
  items: FlashSaleItem[];
}

interface FlashSaleStripProps {
  flashSale?: FlashSaleData | null;
}

export default function FlashSaleStrip({ flashSale }: FlashSaleStripProps) {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!flashSale?.endsAt) return;

    const calculateRemaining = () => {
      const diff = new Date(flashSale.endsAt).getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    };

    calculateRemaining();
    const timer = setInterval(calculateRemaining, 1000);
    return () => clearInterval(timer);
  }, [flashSale?.endsAt]);

  if (!flashSale || !flashSale.items || flashSale.items.length === 0) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 my-4">
      <div className="bg-white rounded border border-rose-200 shadow-sm overflow-hidden">
        {/* Header Bar */}
        <div
          className="flex flex-wrap items-center justify-between px-4 py-3 text-white gap-2"
          style={{ backgroundColor: flashSale.bannerColor || '#e11d48' }}
        >
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-fkyellow fill-fkyellow animate-bounce" />
            <h3 className="font-black text-base sm:text-lg tracking-wide">{flashSale.title}</h3>
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <span className="flex items-center gap-1 opacity-90">
              <Clock className="w-4 h-4" />
              {t('endsIn')}:
            </span>
            <div className="flex items-center gap-1 font-mono font-bold text-gray-900">
              <span className="bg-white px-2 py-0.5 rounded shadow-sm">{pad(timeLeft.hours)}</span>:
              <span className="bg-white px-2 py-0.5 rounded shadow-sm">{pad(timeLeft.minutes)}</span>:
              <span className="bg-white px-2 py-0.5 rounded shadow-sm text-rose-600">
                {pad(timeLeft.seconds)}
              </span>
            </div>
          </div>
        </div>

        {/* Flash Sale Product Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 p-4">
          {flashSale.items.map((item) => {
            const discountPercent = Math.round(
              ((item.regularPrice - item.flashPrice) / item.regularPrice) * 100
            );

            return (
              <Link
                key={item.id}
                href={`/product/${item.slug || item.productId}`}
                className="group flex flex-col justify-between p-2 rounded hover:shadow-md transition-all border border-gray-100 bg-white"
              >
                <div className="relative aspect-square w-full rounded overflow-hidden bg-gray-50 flex items-center justify-center p-2">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-1 left-1 bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow">
                    <Zap className="w-2.5 h-2.5 fill-white" />
                    {discountPercent}% OFF
                  </div>
                </div>

                <div className="mt-2 flex-1 flex flex-col justify-between">
                  <p className="text-xs font-medium text-gray-800 line-clamp-2 group-hover:text-fkblue transition-colors">
                    {item.title}
                  </p>

                  <div className="mt-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-gray-900">
                        ₹{item.flashPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] text-gray-400 line-through">
                        ₹{item.regularPrice.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Progress Bar of Sold Items */}
                    <div className="mt-1.5">
                      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all"
                          style={{ width: `${item.percentSold}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                        {item.percentSold}% Sold ({item.soldCount}/{item.flashStockLimit})
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
