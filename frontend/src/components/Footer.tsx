'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, HelpCircle, Award, Truck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 text-xs mt-12 border-t border-gray-800">
      {/* Trust Badges */}
      <div className="border-b border-gray-800 bg-gray-950 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="flex flex-col items-center gap-1">
            <Award className="w-6 h-6 text-fkyellow" />
            <span className="font-bold text-gray-200">100% Authentic Products</span>
            <span className="text-[11px] text-gray-500">Directly sourced from verified sellers</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Truck className="w-6 h-6 text-fkyellow" />
            <span className="font-bold text-gray-200">Express India Delivery</span>
            <span className="text-[11px] text-gray-500">Serviceable across Tier 1, 2, 3 pincodes</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck className="w-6 h-6 text-fkyellow" />
            <span className="font-bold text-gray-200">Safe & Secure Payments</span>
            <span className="text-[11px] text-gray-500">Razorpay, UPI, NetBanking & COD</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <HelpCircle className="w-6 h-6 text-fkyellow" />
            <span className="font-bold text-gray-200">24x7 Help Center</span>
            <span className="text-[11px] text-gray-500">Dedicated support ticketing & live chat</span>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div>
          <h4 className="text-gray-300 font-bold uppercase tracking-wider mb-3 text-[11px]">ABOUT</h4>
          <ul className="space-y-2 text-gray-400">
            <li><Link href="/" className="hover:text-white transition-colors">Contact Us</Link></li>
            <li><Link href="/" className="hover:text-white transition-colors">About ShopEzy</Link></li>
            <li><Link href="/" className="hover:text-white transition-colors">Careers</Link></li>
            <li><Link href="/" className="hover:text-white transition-colors">Corporate Information</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-gray-300 font-bold uppercase tracking-wider mb-3 text-[11px]">HELP & SUPPORT</h4>
          <ul className="space-y-2 text-gray-400">
            <li><Link href="/orders" className="hover:text-white transition-colors">Payments & Orders</Link></li>
            <li><Link href="/orders" className="hover:text-white transition-colors">Shipping & Tracking</Link></li>
            <li><Link href="/orders" className="hover:text-white transition-colors">Cancellation & Returns</Link></li>
            <li><Link href="/support" className="hover:text-white transition-colors">Live Support Desk</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-gray-300 font-bold uppercase tracking-wider mb-3 text-[11px]">PORTALS</h4>
          <ul className="space-y-2 text-gray-400">
            <li><Link href="/seller/dashboard" className="text-green-400 font-semibold hover:text-green-300">Seller Dashboard</Link></li>
            <li><Link href="/admin" className="text-purple-400 font-semibold hover:text-purple-300">Admin Control Panel</Link></li>
            <li><Link href="/orders" className="hover:text-white transition-colors">Customer Orders</Link></li>
            <li><Link href="/wishlist" className="hover:text-white transition-colors">Wishlist</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-gray-300 font-bold uppercase tracking-wider mb-3 text-[11px]">CONSUMER POLICY</h4>
          <ul className="space-y-2 text-gray-400">
            <li><Link href="/" className="hover:text-white transition-colors">Cancellation & Returns</Link></li>
            <li><Link href="/" className="hover:text-white transition-colors">Terms of Use</Link></li>
            <li><Link href="/" className="hover:text-white transition-colors">Security & Privacy</Link></li>
            <li><Link href="/" className="hover:text-white transition-colors">GST Compliance & Invoicing</Link></li>
          </ul>
        </div>

        <div className="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-gray-800 pt-6 md:pt-0 md:pl-6">
          <h4 className="text-gray-300 font-bold uppercase tracking-wider mb-3 text-[11px]">REGISTERED OFFICE</h4>
          <p className="text-gray-400 leading-relaxed text-[11px]">
            ShopEzy Commerce India Pvt. Ltd.<br />
            12 M.G. Road, Buxa Feeder Road,<br />
            Alipurduar, West Bengal - 736123<br />
            CIN: U51909WB2026PTC123456<br />
            GSTIN: 19AAACS8899P1Z3
          </p>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 py-4 bg-gray-950 text-center text-gray-500 text-[11px]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 ShopEzy. Inspired by Flipkart & Modern SaaS Marketplaces. All rights reserved.</p>
          <div className="flex items-center gap-4 text-gray-400 font-semibold">
            <span>UPI</span>
            <span>RuPay</span>
            <span>Visa</span>
            <span>Mastercard</span>
            <span>NetBanking</span>
            <span>COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
