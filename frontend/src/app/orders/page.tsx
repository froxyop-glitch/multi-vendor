'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Truck,
  FileText,
  RotateCcw,
  XCircle,
  Clock,
  CheckCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tracking Modal State
  const [trackingData, setTrackingData] = useState<any>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);

  // Return Modal State
  const [returnItemId, setReturnItemId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('Quality issue');
  const [returnComments, setReturnComments] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      if (!user) return;
      setIsLoading(true);
      const res = await apiRequest('/orders/my-orders');
      if (res.success && res.orders) {
        setOrders(res.orders);
      }
      setIsLoading(false);
    }
    loadOrders();
  }, [user]);

  const openTracking = async (orderItemId: string) => {
    const res = await apiRequest(`/orders/items/${orderItemId}/tracking`);
    if (res.success) {
      setTrackingData(res);
      setShowTrackingModal(true);
    }
  };

  const handleCancelItem = async (orderItemId: string) => {
    if (!confirm('Are you sure you want to cancel this order item?')) return;
    const res = await apiRequest(`/orders/items/${orderItemId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Customer requested cancellation' }),
    });
    if (res.success) {
      alert(res.message);
      // Reload orders
      const reload = await apiRequest('/orders/my-orders');
      if (reload.success) setOrders(reload.orders);
    } else {
      alert(res.message || 'Cancellation failed.');
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnItemId) return;
    setIsSubmittingReturn(true);
    const res = await apiRequest(`/orders/items/${returnItemId}/return`, {
      method: 'POST',
      body: JSON.stringify({
        reason: returnReason,
        comments: returnComments,
      }),
    });
    setIsSubmittingReturn(false);
    if (res.success) {
      alert(res.message);
      setReturnItemId(null);
      setReturnComments('');
      const reload = await apiRequest('/orders/my-orders');
      if (reload.success) setOrders(reload.orders);
    } else {
      alert(res.message || 'Return request failed.');
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <Package className="w-16 h-16 text-gray-300 mx-auto" />
        <h2 className="text-xl font-bold text-gray-800">Please log in to view your orders</h2>
        <Link href="/" className="inline-block px-6 py-2.5 bg-fkblue text-white rounded font-bold text-xs">
          Go to Home & Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">My Orders ({orders.length})</h1>
        <Link href="/support" className="text-xs text-fkblue hover:underline font-bold">
          Need Help with an Order?
        </Link>
      </div>

      {isLoading ? (
        <div className="bg-white rounded p-12 text-center text-gray-500 font-semibold">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded border border-gray-200 p-12 text-center space-y-3">
          <Package className="w-16 h-16 text-gray-300 mx-auto" />
          <h2 className="text-base font-bold text-gray-800">No orders placed yet</h2>
          <p className="text-xs text-gray-500">Discover great electronics and lifestyle products today!</p>
          <Link href="/products" className="inline-block px-6 py-2 bg-fkblue text-white rounded font-bold text-xs">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
              {/* Order Header */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between text-xs text-gray-600 gap-2">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Order ID</span>
                    <span className="font-mono font-bold text-gray-900">#{order.id.slice(0, 12)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Order Date</span>
                    <span className="font-semibold text-gray-800">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Total</span>
                    <span className="font-bold text-gray-900">₹{order.total_amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    order.payment_status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {order.payment_method} • {order.payment_status}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-gray-100 p-4 space-y-4">
                {order.items.map((it: any) => (
                  <div key={it.id} className="pt-4 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={it.productImage}
                        alt={it.productTitle}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded border p-1 bg-gray-50 shrink-0"
                      />
                      <div>
                        <Link
                          href={`/product/${it.productSlug || it.product_id}`}
                          className="text-xs sm:text-sm font-bold text-gray-900 hover:text-fkblue line-clamp-2"
                        >
                          {it.productTitle}
                        </Link>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Qty: <span className="font-bold">{it.quantity}</span> • Price: ₹{it.price_at_purchase}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${
                            it.item_status === 'DELIVERED'
                              ? 'bg-green-100 text-green-800'
                              : it.item_status === 'SHIPPED'
                              ? 'bg-blue-100 text-blue-800'
                              : it.item_status === 'CANCELLED' || it.item_status === 'REFUNDED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {it.item_status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Item Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                      {/* Track Button */}
                      <button
                        onClick={() => openTracking(it.id)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-fkblue rounded text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Track Courier</span>
                      </button>

                      {/* PDF Invoice Download */}
                      <a
                        href={`http://localhost:5000/api/v1/invoices/item/${it.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>GST Invoice (PDF)</span>
                      </a>

                      {/* Cancel flow */}
                      {(it.item_status === 'PROCESSING' || it.item_status === 'PACKED') && (
                        <button
                          onClick={() => handleCancelItem(it.id)}
                          className="px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 rounded text-xs font-bold transition-colors"
                        >
                          Cancel
                        </button>
                      )}

                      {/* Return flow */}
                      {it.item_status === 'DELIVERED' && (
                        <button
                          onClick={() => setReturnItemId(it.id)}
                          className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Return Item</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Shipment Tracking Modal */}
      {showTrackingModal && trackingData && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Live Courier Tracking</h3>
                <p className="text-xs text-gray-500">{trackingData.productTitle}</p>
              </div>
              <button
                onClick={() => setShowTrackingModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-blue-50 p-3 rounded text-xs space-y-1">
              <p className="text-gray-700">
                Courier: <span className="font-bold text-gray-900">{trackingData.courierName || 'BlueDart Surface'}</span>
              </p>
              <p className="text-gray-700">
                AWB Tracking No: <span className="font-mono font-bold text-fkblue">{trackingData.awbTrackingNumber || 'N/A'}</span>
              </p>
              <p className="text-gray-700">
                Current Status: <span className="font-bold uppercase text-green-700">{trackingData.itemStatus}</span>
              </p>
            </div>

            {/* Tracking Timeline */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Transit Milestones</h4>
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-200">
                {trackingData.events?.map((ev: any, idx: number) => (
                  <div key={idx} className="relative text-xs">
                    <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-fkblue ring-4 ring-blue-100" />
                    <p className="font-bold text-gray-900">{ev.status_title}</p>
                    <p className="text-gray-500 text-[11px]">{ev.remarks} • {ev.location}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(ev.event_time).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowTrackingModal(false)}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {returnItemId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">Initiate Return & Refund</h3>
            <p className="text-xs text-gray-500">
              Pick up will be arranged within 2 business days. Full refund will be disbursed back to your payment source.
            </p>

            <form onSubmit={handleReturnSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Reason for Return</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded bg-white"
                >
                  <option value="Quality issue">Quality not as expected</option>
                  <option value="Defective or damaged">Defective or damaged in transit</option>
                  <option value="Wrong item received">Wrong item or variant delivered</option>
                  <option value="Size or fit issue">Size or fit mismatch</option>
                  <option value="Changed mind">No longer needed</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Additional Details</label>
                <textarea
                  rows={3}
                  required
                  value={returnComments}
                  onChange={(e) => setReturnComments(e.target.value)}
                  placeholder="Describe the issue with the item..."
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnItemId(null)}
                  className="px-4 py-2 border rounded text-gray-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReturn}
                  className="px-5 py-2 bg-fkblue text-white rounded font-bold hover:bg-fkblue-dark"
                >
                  {isSubmittingReturn ? 'Submitting...' : 'Confirm Return Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
