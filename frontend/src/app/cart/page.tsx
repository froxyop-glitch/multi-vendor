'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, Tag, ShieldCheck, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    items,
    totalPayable,
    itemsSubtotal,
    originalSubtotal,
    totalSavings,
    shippingFee,
    couponDiscount,
    couponCode,
    updateQuantity,
    removeItem,
    applyCoupon,
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const handleApply = async (code: string) => {
    const res = await applyCoupon(code);
    setCouponMessage({ text: res.message, error: !res.success });
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto" />
        <h2 className="text-xl font-bold text-gray-800">Missing Cart items?</h2>
        <p className="text-xs text-gray-500">Login to see the items you previously added</p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-fkblue text-white rounded font-bold text-xs shadow hover:bg-fkblue-dark"
        >
          Login
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4 bg-white rounded border border-gray-200 mt-6 shadow-sm">
        <ShoppingBag className="w-20 h-20 text-gray-300 mx-auto" />
        <h2 className="text-lg font-bold text-gray-800">Your Cart is Empty!</h2>
        <p className="text-xs text-gray-500">Explore our mega catalog and add great deals to your cart.</p>
        <Link
          href="/products"
          className="inline-block px-6 py-2.5 bg-fkblue text-white rounded font-bold text-xs shadow hover:bg-fkblue-dark"
        >
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-6">
      <h1 className="text-lg font-bold text-gray-900 mb-4">Shopping Cart ({items.length} items)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-8 bg-white rounded border border-gray-200 shadow-sm divide-y divide-gray-100">
          {items.map((item) => (
            <div key={item.cartItemId || item.productId} className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-4 items-center">
                <img
                  src={item.image}
                  alt={item.productTitle}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded border p-1 bg-gray-50 shrink-0"
                />
                <div>
                  <Link
                    href={`/product/${item.productId}`}
                    className="text-sm font-semibold text-gray-800 hover:text-fkblue line-clamp-2"
                  >
                    {item.productTitle}
                  </Link>

                  {item.variantSnapshot && Object.keys(item.variantSnapshot).length > 0 && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      {Object.entries(item.variantSnapshot).map(([k, v]) => (
                        <span key={k} className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px] font-medium">
                          {k}: {String(v)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-base font-bold text-gray-900">
                      ₹{item.unitPrice.toLocaleString('en-IN')}
                    </span>
                    {item.originalPrice > item.unitPrice && (
                      <span className="text-xs text-gray-400 line-through">
                        ₹{item.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                    {item.isFlashSaleActive && (
                      <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                        FLASH DEAL
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quantity Controls & Remove */}
              <div className="flex items-center gap-4 self-end sm:self-center">
                <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                  <button
                    onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                    className="px-2.5 py-1 text-xs font-bold text-gray-600 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-bold text-gray-800 bg-gray-50">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                    className="px-2.5 py-1 text-xs font-bold text-gray-600 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.cartItemId)}
                  className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Place Order CTA Row */}
          <div className="p-4 bg-gray-50 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Safe and Secure Payments</span>
            <button
              onClick={() => router.push('/checkout')}
              className="px-8 py-3 bg-fkyellow-dark hover:bg-orange-600 text-white font-black text-sm uppercase rounded shadow"
            >
              PLACE ORDER
            </button>
          </div>
        </div>

        {/* Right: Coupon & Price Details */}
        <div className="lg:col-span-4 space-y-4">
          {/* Coupon Box */}
          <div className="bg-white rounded border border-gray-200 shadow-sm p-4 space-y-3">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-fkblue" />
              <span>Apply Coupons & Save Extra</span>
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={inputCoupon}
                onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
                placeholder="Enter Coupon Code"
                className="flex-1 px-3 py-2 text-xs border rounded bg-gray-50 uppercase font-bold focus:outline-none focus:border-fkblue"
              />
              <button
                onClick={() => handleApply(inputCoupon)}
                disabled={!inputCoupon.trim()}
                className="px-4 py-2 bg-fkblue text-white text-xs font-bold rounded hover:bg-fkblue-dark disabled:opacity-50"
              >
                Apply
              </button>
            </div>

            {couponMessage && (
              <p className={`text-xs font-semibold ${couponMessage.error ? 'text-red-600' : 'text-green-700'}`}>
                {couponMessage.text}
              </p>
            )}

            {/* Quick 1-Click Coupons */}
            <div className="pt-2 border-t space-y-2">
              <div
                onClick={() => handleApply('WELCOME10')}
                className="p-2 border border-dashed border-blue-300 rounded bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-fkblue">WELCOME10</span>
                  <span className="text-[11px] font-bold text-green-700">Apply</span>
                </div>
                <p className="text-[10px] text-gray-600 mt-0.5">10% off up to ₹500 on first order</p>
              </div>

              <div
                onClick={() => handleApply('FLAT200')}
                className="p-2 border border-dashed border-green-300 rounded bg-green-50/50 cursor-pointer hover:bg-green-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-green-800">FLAT200</span>
                  <span className="text-[11px] font-bold text-green-700">Apply</span>
                </div>
                <p className="text-[10px] text-gray-600 mt-0.5">Flat ₹200 savings on orders above ₹1499</p>
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-white rounded border border-gray-200 shadow-sm p-4 space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b pb-2">
              PRICE DETAILS
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-700">
                <span>Price ({items.length} items)</span>
                <span>₹{originalSubtotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-green-700 font-semibold">
                <span>Discount</span>
                <span>- ₹{(originalSubtotal - itemsSubtotal).toLocaleString('en-IN')}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-700 font-semibold">
                  <span>Coupon Discount ({couponCode})</span>
                  <span>- ₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-700">
                <span>Delivery Charges</span>
                <span>{shippingFee === 0 ? <span className="text-green-700 font-bold">FREE</span> : `₹${shippingFee}`}</span>
              </div>

              <div className="border-t border-dashed pt-3 flex justify-between font-black text-base text-gray-900">
                <span>Total Amount</span>
                <span>₹{totalPayable.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {totalSavings > 0 && (
              <div className="p-2.5 bg-green-50 rounded text-xs font-bold text-green-800 border border-green-200 text-center">
                You will save ₹{totalSavings.toLocaleString('en-IN')} on this order!
              </div>
            )}

            <button
              onClick={() => router.push('/checkout')}
              className="w-full py-3 bg-fkyellow-dark hover:bg-orange-600 text-white font-black text-sm uppercase rounded shadow transition-colors"
            >
              PROCEED TO CHECKOUT
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 px-2">
            <ShieldCheck className="w-4 h-4 text-gray-400" />
            <span>Safe & Secure Payments. Easy returns with GST compliance.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
