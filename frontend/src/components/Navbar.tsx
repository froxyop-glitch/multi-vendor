'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  Heart,
  User as UserIcon,
  Globe,
  ChevronDown,
  Store,
  ShieldAlert,
  LogOut,
  Package,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, Language } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { apiRequest } from '../lib/api';

export default function Navbar() {
  const router = useRouter();
  const { user, logout, quickSwitchAccount } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { totalCount: cartCount } = useCart();
  const { totalCount: wishlistCount } = useWishlist();

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [matchedProducts, setMatchedProducts] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setMatchedProducts([]);
      return;
    }

    const timer = setTimeout(async () => {
      const res = await apiRequest(`/discovery/autocomplete?q=${encodeURIComponent(query)}`);
      if (res.success) {
        setSuggestions(res.suggestions || []);
        setMatchedProducts(res.products || []);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setShowSearchDropdown(false);
    router.push(`/products?search=${encodeURIComponent(query.trim())}`);
  };

  const handleSelectSuggestion = (term: string) => {
    setQuery(term);
    setShowSearchDropdown(false);
    router.push(`/products?search=${encodeURIComponent(term)}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-fkblue text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Plus badge */}
          <Link href="/" className="flex flex-col items-start leading-none group shrink-0">
            <span className="text-2xl font-black italic tracking-wide text-white flex items-center gap-1">
              ShopEzy
              <span className="text-fkyellow text-sm font-bold not-italic">★</span>
            </span>
            <span className="text-[11px] font-semibold text-gray-200 italic flex items-center gap-0.5 group-hover:text-fkyellow transition-colors">
              Explore <span className="text-fkyellow font-bold">Plus</span>
              <Sparkles className="w-2.5 h-2.5 text-fkyellow fill-fkyellow" />
            </span>
          </Link>

          {/* Autocomplete Search Bar */}
          <div ref={searchRef} className="relative flex-1 max-w-2xl mx-2">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                placeholder={t('searchPlaceholder')}
                className="w-full h-10 pl-4 pr-11 rounded-sm bg-white text-gray-900 placeholder-gray-500 text-sm focus:outline-none shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-10 w-11 flex items-center justify-center text-fkblue hover:text-fkblue-dark transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5 stroke-[2.5]" />
              </button>
            </form>

            {/* Rich Thumbnail Search Dropdown */}
            {showSearchDropdown && (suggestions.length > 0 || matchedProducts.length > 0) && (
              <div className="absolute top-11 left-0 right-0 bg-white text-gray-900 rounded-b shadow-xl border border-gray-200 z-50 overflow-hidden divide-y divide-gray-100">
                {matchedProducts.length > 0 && (
                  <div className="p-2">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 pb-1">
                      Matching Products
                    </p>
                    <div className="space-y-1">
                      {matchedProducts.map((p) => (
                        <Link
                          key={p.id}
                          href={`/product/${p.slug || p.id}`}
                          onClick={() => setShowSearchDropdown(false)}
                          className="flex items-center gap-3 p-1.5 hover:bg-gray-50 rounded transition-colors group"
                        >
                          <img
                            src={p.image}
                            alt={p.title}
                            className="w-10 h-10 object-contain rounded bg-gray-100 p-0.5 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-fkblue">
                              {p.title}
                            </p>
                            <p className="text-xs font-bold text-gray-900">₹{p.price.toLocaleString('en-IN')}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {suggestions.length > 0 && (
                  <div className="p-2">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 pb-1">
                      Search Suggestions
                    </p>
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectSuggestion(s)}
                        className="w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100 hover:text-fkblue rounded flex items-center gap-2"
                      >
                        <Search className="w-3.5 h-3.5 text-gray-400" />
                        <span>{s}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Navigation & Controls */}
          <div className="flex items-center gap-4 text-sm font-medium">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-1 hover:text-gray-200 py-1.5 px-2 rounded transition-colors"
                title="Switch Language"
              >
                <Globe className="w-4 h-4 text-fkyellow" />
                <span className="font-bold uppercase text-xs">{language}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showLangDropdown && (
                <div className="absolute right-0 top-10 w-36 bg-white text-gray-800 rounded shadow-lg border border-gray-200 z-50 py-1">
                  <button
                    onClick={() => {
                      setLanguage('en');
                      setShowLangDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-fkblue-light flex items-center justify-between ${
                      language === 'en' ? 'text-fkblue font-bold bg-gray-50' : ''
                    }`}
                  >
                    <span>English</span>
                    <span className="text-[10px] text-gray-400">EN</span>
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('hi');
                      setShowLangDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-fkblue-light flex items-center justify-between ${
                      language === 'hi' ? 'text-fkblue font-bold bg-gray-50' : ''
                    }`}
                  >
                    <span>हिन्दी</span>
                    <span className="text-[10px] text-gray-400">HI</span>
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('bn');
                      setShowLangDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-fkblue-light flex items-center justify-between ${
                      language === 'bn' ? 'text-fkblue font-bold bg-gray-50' : ''
                    }`}
                  >
                    <span>বাংলা</span>
                    <span className="text-[10px] text-gray-400">BN</span>
                  </button>
                </div>
              )}
            </div>

            {/* Account / Login Menu */}
            <div className="relative">
              {user ? (
                <button
                  onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                  className="flex items-center gap-1.5 bg-white text-fkblue px-3 py-1.5 rounded-sm font-semibold hover:bg-gray-100 transition-colors shadow-sm"
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                  className="bg-white text-fkblue px-5 py-1.5 rounded-sm font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm"
                >
                  {t('login')}
                </button>
              )}

              {showAccountDropdown && (
                <div className="absolute right-0 top-10 w-64 bg-white text-gray-800 rounded shadow-2xl border border-gray-200 z-50 divide-y divide-gray-100 py-1">
                  {user ? (
                    <div className="px-4 py-2.5 bg-gray-50">
                      <p className="text-xs text-gray-500 font-medium">Signed in as</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-100 text-fkblue">
                          {user.role}
                        </span>
                        {user.adminSubRole && (
                          <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-purple-100 text-purple-700">
                            {user.adminSubRole}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {/* Role Specific Shortcuts */}
                  <div className="py-1">
                    {user?.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        onClick={() => setShowAccountDropdown(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        <span>Super Admin Control Panel</span>
                      </Link>
                    )}

                    {(user?.role === 'SELLER' || user?.role === 'ADMIN') && (
                      <Link
                        href="/seller/dashboard"
                        onClick={() => setShowAccountDropdown(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-green-700 hover:bg-green-50"
                      >
                        <Store className="w-4 h-4" />
                        <span>Seller Dashboard</span>
                      </Link>
                    )}

                    <Link
                      href="/orders"
                      onClick={() => setShowAccountDropdown(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                    >
                      <Package className="w-4 h-4 text-gray-500" />
                      <span>{t('orders')}</span>
                    </Link>

                    <Link
                      href="/wishlist"
                      onClick={() => setShowAccountDropdown(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                    >
                      <Heart className="w-4 h-4 text-gray-500" />
                      <span>{t('wishlist')}</span>
                    </Link>

                    <Link
                      href="/support"
                      onClick={() => setShowAccountDropdown(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                    >
                      <HelpCircle className="w-4 h-4 text-gray-500" />
                      <span>{t('needHelp')}</span>
                    </Link>
                  </div>

                  {/* 1-Click Test Role Switcher */}
                  <div className="p-3 bg-amber-50">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      Quick 1-Click Role Switcher
                    </p>
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      <button
                        onClick={async () => {
                          await quickSwitchAccount('ADMIN');
                          setShowAccountDropdown(false);
                          router.push('/admin');
                        }}
                        className="px-2 py-1 bg-white hover:bg-purple-100 text-purple-800 font-semibold border rounded text-left truncate"
                      >
                        Super Admin
                      </button>
                      <button
                        onClick={async () => {
                          await quickSwitchAccount('MANAGER');
                          setShowAccountDropdown(false);
                          router.push('/admin');
                        }}
                        className="px-2 py-1 bg-white hover:bg-blue-100 text-blue-800 font-semibold border rounded text-left truncate"
                      >
                        Manager
                      </button>
                      <button
                        onClick={async () => {
                          await quickSwitchAccount('SELLER_1');
                          setShowAccountDropdown(false);
                          router.push('/seller/dashboard');
                        }}
                        className="px-2 py-1 bg-white hover:bg-green-100 text-green-800 font-semibold border rounded text-left truncate"
                      >
                        Seller: TechWorld
                      </button>
                      <button
                        onClick={async () => {
                          await quickSwitchAccount('SELLER_2');
                          setShowAccountDropdown(false);
                          router.push('/seller/dashboard');
                        }}
                        className="px-2 py-1 bg-white hover:bg-green-100 text-green-800 font-semibold border rounded text-left truncate"
                      >
                        Seller: UrbanStyle
                      </button>
                      <button
                        onClick={async () => {
                          await quickSwitchAccount('CUSTOMER');
                          setShowAccountDropdown(false);
                          router.push('/');
                        }}
                        className="px-2 py-1 bg-white hover:bg-amber-100 text-amber-900 font-semibold border rounded text-left truncate"
                      >
                        Customer (Rahul)
                      </button>
                      <button
                        onClick={async () => {
                          await quickSwitchAccount('FINANCE');
                          setShowAccountDropdown(false);
                          router.push('/admin');
                        }}
                        className="px-2 py-1 bg-white hover:bg-indigo-100 text-indigo-900 font-semibold border rounded text-left truncate"
                      >
                        Finance Officer
                      </button>
                    </div>
                  </div>

                  {user && (
                    <div className="p-1">
                      <button
                        onClick={() => {
                          logout();
                          setShowAccountDropdown(false);
                          router.push('/');
                        }}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t('logout')}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Wishlist Icon */}
            <Link
              href="/wishlist"
              className="relative flex items-center gap-1 hover:text-fkyellow transition-colors py-1 px-1.5"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Icon with badge */}
            <Link
              href="/cart"
              className="relative flex items-center gap-1.5 hover:text-fkyellow transition-colors py-1 px-2 font-bold"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-fkyellow text-fkblue text-[11px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">{t('cart')}</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
