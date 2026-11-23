'use client';

import React from 'react';
import Link from 'next/link';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  iconOrImageUrl: string;
}

interface CategoryBarProps {
  categories: CategoryItem[];
}

export default function CategoryBar({ categories }: CategoryBarProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between sm:justify-center sm:gap-10 py-3 overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="flex flex-col items-center gap-1.5 group min-w-[70px] shrink-0"
            >
              <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center p-1 group-hover:scale-105 group-hover:border-fkblue transition-all">
                <img
                  src={cat.iconOrImageUrl}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <span className="text-xs font-semibold text-gray-700 group-hover:text-fkblue transition-colors text-center whitespace-nowrap">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
