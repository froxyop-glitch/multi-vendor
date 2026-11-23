'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, CheckCircle2, CreditCard, Banknote, Truck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, totalPayable, shippingFee, couponDiscount, couponCode, refreshCart } = useCart();

  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || 'Rahul Sen',
    phone: user?.phone || '+91 9123456780',
    street: user?.address || 'Station Road, Alipurduar Junction',
    city: 'Alipurduar',
    state: 'West Bengal',
    pincode: '736123',
  });

  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'COD'>('RAZORPAY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState<any>(null);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Cart is empty.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (paymentMethod === 'COD') {
        const res = await apiRequest('/orders/cod', {
          method: 'POST',
          body: JSON.stringify({
            shippingAddress,
            couponCode,
            pincode: shippingAddress.pincode,
          }),
        });

        if (res.success && res.orderId) {
          setOrderConfirmed(res.order);
          await refreshCart();
        } else {
          alert(res.message || 'Failed to place COD order.');
        }
      } else {
        // Razorpay / UPI flow
        const prepRes = await apiRequest('/payments/create-order', {
          method: 'POST',
          body: JSON.stringify({
            couponCode,
            pincode: shippingAddress.pincode,
          }),
        });

        if (!prepRes.success) {
          alert(prepRes.message || 'Payment initiation failed.');
          setIsSubmitting(false);
          return;
        }

        // Verify simulated / live payment
        const verifyRes = await apiRequest('/payments/verify', {
          method: 'POST',
          body: JSON.stringify({
            razorpayOrderId: prepRes.razorpayOrderId,
            razorpayPaymentId: `pay_sim_${Date.now()}`,
            razorpaySignature: 'mock_sig_valid',
            shippingAddress,
            couponCode,
            pincode: shippingAddress.pincode,
          }),
        });

        if (verifyRes.success && verifyRes.orderId) {
          setOrderConfirmed(verifyRes.order);
          await refreshCart();
        } else {
          alert(verifyRes.message || 'Payment verification failed.');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Checkout failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderConfirmed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-gray-900">Order Confirmed!</h1>
        <p className="text-xs text-gray-600">
          Thank you, <span className="font-bold">{shippingAddress.fullName}</span>. Your order has been placed with order ID{' '}
          <span className="font-mono font-bold text-fkblue">#{orderConfirmed.id}</span>.
        </p>
        <p className="text-xs text-gray-500">
          A receipt has been dispatched to your email and tracking notifications will follow as your items ship.
        </p>

        <div className="pt-4 flex justify-center gap-3">
          <button
            onClick={() => router.push('/orders')}
            className="px-6 py-2.5 bg-fkblue text-white rounded font-bold text-xs shadow hover:bg-fkblue-dark"
          >
            View My Orders & Track Delivery
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 border border-gray-300 rounded font-bold text-xs text-gray-700 hover:bg-gray-100"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Secure Checkout</h1>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Address & Payment Method */}
        <div className="lg:col-span-8 space-y-4">
          {/* Step 1: Delivery Address */}
          <div className="bg-white rounded border border-gray-200 shadow-sm p-4 sm:p-5 space-y-3">
            <h2 className="text-xs font-bold text-fkblue uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-fkblue text-white text-[11px] font-bold flex items-center justify-center">1</span>
              <span>DELIVERY ADDRESS</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.fullName}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">10-Digit Mobile Number</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.phone}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-gray-700 block mb-1">Street Address / Landmark</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.street}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">City / District</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">State</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.state}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Pincode (6 Digits)</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={shippingAddress.pincode}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, pincode: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3 py-2 border rounded font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Payment Option */}
          <div className="bg-white rounded border border-gray-200 shadow-sm p-4 sm:p-5 space-y-3">
            <h2 className="text-xs font-bold text-fkblue uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-fkblue text-white text-[11px] font-bold flex items-center justify-center">2</span>
              <span>PAYMENT OPTIONS</span>
            </h2>

            <div className="space-y-2 text-xs">
              <label
                className={`flex items-start gap-3 p-3.5 border rounded cursor-pointer transition-colors ${
                  paymentMethod === 'RAZORPAY' ? 'border-fkblue bg-blue-50/50 ring-1 ring-fkblue' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="payment_choice"
                  checked={paymentMethod === 'RAZORPAY'}
                  onChange={() => setPaymentMethod('RAZORPAY')}
                  className="mt-0.5 accent-fkblue"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-fkblue" />
                    <span className="font-bold text-gray-900">Online Payment (UPI, Cards, NetBanking via Razorpay)</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Fast, instant & secure checkout. Supports Google Pay, PhonePe, Paytm, and all Major Credit/Debit cards.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3.5 border rounded cursor-pointer transition-colors ${
                  paymentMethod === 'COD' ? 'border-fkblue bg-blue-50/50 ring-1 ring-fkblue' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="payment_choice"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="mt-0.5 accent-fkblue"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-green-700" />
                    <span className="font-bold text-gray-900">Cash on Delivery (COD)</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Pay with Cash or QR Code at your doorstep upon delivery.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right: Order Summary & Place Order */}
        <div className="lg:col-span-4 bg-white rounded border border-gray-200 shadow-sm p-4 space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b pb-2">
            ORDER SUMMARY ({items.length} items)
          </h3>

          <div className="space-y-2 text-xs divide-y divide-gray-100 max-h-56 overflow-y-auto pr-1">
            {items.map((it) => (
              <div key={it.cartItemId || it.productId} className="pt-2 first:pt-0 flex justify-between gap-2">
                <span className="text-gray-700 line-clamp-1">{it.productTitle} × {it.quantity}</span>
                <span className="font-bold text-gray-900 shrink-0">₹{it.subtotal.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-xs border-t pt-3">
            <div className="flex justify-between text-gray-600">
              <span>Delivery Charges</span>
              <span>{shippingFee === 0 ? <span className="text-green-700 font-bold">FREE</span> : `₹${shippingFee}`}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-green-700 font-bold">
                <span>Coupon Applied ({couponCode})</span>
                <span>- ₹{couponDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="border-t border-dashed pt-2 flex justify-between font-black text-base text-gray-900">
              <span>Total Payable</span>
              <span>₹{totalPayable.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || items.length === 0}
            className="w-full py-3 bg-fkyellow-dark hover:bg-orange-600 text-white font-black text-sm uppercase rounded shadow transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'PROCESSING ORDER...' : 'CONFIRM & PLACE ORDER'}
          </button>

          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 justify-center">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>256-Bit SSL Encrypted Gateway</span>
          </div>
        </div>
      </form>
    </div>
  );
}
