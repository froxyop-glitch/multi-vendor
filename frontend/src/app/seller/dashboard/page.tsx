'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  LayoutDashboard,
  Package,
  Truck,
  RotateCcw,
  Wallet,
  FileSpreadsheet,
  MessageCircleQuestion,
  PlusCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'inventory' | 'orders' | 'returns' | 'wallet' | 'invoices' | 'qna'
  >('overview');

  const [stats, setStats] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState<string | null>(null);
  const [dispatchCourier, setDispatchCourier] = useState('BlueDart Air Express');
  const [dispatchAwb, setDispatchAwb] = useState('');

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('5000');

  // New Product Form
  const [newProdTitle, setNewProdTitle] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('cat_electronics');
  const [newProdPrice, setNewProdPrice] = useState('4999');
  const [newProdDiscountPrice, setNewProdDiscountPrice] = useState('3499');
  const [newProdStock, setNewProdStock] = useState('50');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [hasVariants, setHasVariants] = useState(false);

  useEffect(() => {
    async function loadSellerData() {
      if (!user) return;
      setIsLoading(true);
      const [anRes, prodRes, ordRes, retRes, walRes, invRes, qnaRes] = await Promise.all([
        apiRequest('/seller/analytics'),
        apiRequest('/seller/products'),
        apiRequest('/seller/orders'),
        apiRequest('/seller/returns'),
        apiRequest('/seller/wallet'),
        apiRequest('/seller/invoices'),
        apiRequest('/seller/qna'),
      ]);

      if (anRes.success) setStats(anRes.stats);
      if (prodRes.success) setProducts(prodRes.products || []);
      if (ordRes.success) setOrders(ordRes.orders || []);
      if (retRes.success) setReturns(retRes.returns || []);
      if (walRes.success) setWallet(walRes);
      if (invRes.success) setInvoices(invRes.invoices || []);
      if (qnaRes.success) setQuestions(qnaRes.questions || []);
      setIsLoading(false);
    }

    loadSellerData();
  }, [user]);

  const handleStockUpdate = async (productId: string, newStock: number, variantId?: string) => {
    const res = await apiRequest(`/seller/products/${productId}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stockQuantity: newStock, variantId }),
    });
    if (res.success) {
      const prodRes = await apiRequest('/seller/products');
      if (prodRes.success) setProducts(prodRes.products);
    }
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showDispatchModal) return;

    const res = await apiRequest(`/seller/orders/${showDispatchModal}/dispatch`, {
      method: 'POST',
      body: JSON.stringify({
        courierName: dispatchCourier,
        awbTrackingNumber: dispatchAwb || `AWB-${Math.floor(10000000 + Math.random() * 90000000)}`,
      }),
    });

    if (res.success) {
      alert(res.message);
      setShowDispatchModal(null);
      const ordRes = await apiRequest('/seller/orders');
      if (ordRes.success) setOrders(ordRes.orders);
    } else {
      alert(res.message || 'Dispatch failed.');
    }
  };

  const handleDeliverConfirm = async (orderItemId: string) => {
    if (!confirm('Confirm delivery of this item to the customer?')) return;
    const res = await apiRequest(`/seller/orders/${orderItemId}/deliver`, {
      method: 'POST',
    });
    if (res.success) {
      alert(res.message);
      const [ordRes, anRes, walRes] = await Promise.all([
        apiRequest('/seller/orders'),
        apiRequest('/seller/analytics'),
        apiRequest('/seller/wallet'),
      ]);
      if (ordRes.success) setOrders(ordRes.orders);
      if (anRes.success) setStats(anRes.stats);
      if (walRes.success) setWallet(walRes);
    } else {
      alert(res.message || 'Delivery confirmation failed.');
    }
  };

  const handleReturnAction = async (returnId: string, action: 'APPROVE' | 'REJECT') => {
    const note = prompt(`Enter note for ${action.toLowerCase()}ing this return:`);
    const res = await apiRequest(`/seller/returns/${returnId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, sellerNote: note }),
    });
    if (res.success) {
      alert(res.message);
      const [retRes, walRes] = await Promise.all([
        apiRequest('/seller/returns'),
        apiRequest('/seller/wallet'),
      ]);
      if (retRes.success) setReturns(retRes.returns);
      if (walRes.success) setWallet(walRes);
    } else {
      alert(res.message || 'Action failed.');
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/seller/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount: parseFloat(withdrawAmount) }),
    });
    if (res.success) {
      alert(res.message);
      setShowWithdrawModal(false);
      const walRes = await apiRequest('/seller/wallet');
      if (walRes.success) setWallet(walRes);
    } else {
      alert(res.message || 'Withdrawal request failed.');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/seller/products', {
      method: 'POST',
      body: JSON.stringify({
        title: newProdTitle,
        categoryId: newProdCategory,
        price: parseFloat(newProdPrice),
        discountPrice: parseFloat(newProdDiscountPrice),
        stockQuantity: parseInt(newProdStock, 10),
        description: newProdDesc,
        hasVariants,
        specifications: { Warranty: '1 Year Brand Warranty' },
      }),
    });
    if (res.success) {
      alert('Product created successfully!');
      setShowAddProductModal(false);
      const prodRes = await apiRequest('/seller/products');
      if (prodRes.success) setProducts(prodRes.products);
    } else {
      alert(res.message || 'Could not create product.');
    }
  };

  if (!user || (user.role !== 'SELLER' && user.role !== 'ADMIN')) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <Store className="w-16 h-16 text-gray-300 mx-auto" />
        <h2 className="text-xl font-bold text-gray-800">Seller Dashboard Access Required</h2>
        <p className="text-xs text-gray-500">Please switch to a verified Seller account to manage store inventory.</p>
        <Link href="/" className="inline-block px-6 py-2.5 bg-fkblue text-white rounded font-bold text-xs">
          Return to Storefront
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded border border-gray-200 shadow-sm mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-green-50 text-green-700 rounded border border-green-200">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {user.sellerProfile?.store_name || 'Seller Dashboard'}
            </h1>
            <p className="text-xs text-gray-500">
              GSTIN: {user.sellerProfile?.gstin_or_tax_id || '19ABCDE1234F1Z5'} • State: {user.sellerProfile?.registered_state || 'West Bengal'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddProductModal(true)}
            className="px-4 py-2 bg-fkblue hover:bg-fkblue-dark text-white rounded font-bold text-xs flex items-center gap-1.5 shadow"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Navigation Sidebar */}
        <aside className="md:col-span-3 bg-white rounded border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full text-left px-4 py-3 text-xs font-bold flex items-center gap-2.5 transition-colors ${
              activeTab === 'overview' ? 'bg-blue-50 text-fkblue border-l-4 border-fkblue' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview & Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full text-left px-4 py-3 text-xs font-bold flex items-center gap-2.5 transition-colors ${
              activeTab === 'inventory' ? 'bg-blue-50 text-fkblue border-l-4 border-fkblue' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Inventory & Variants ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full text-left px-4 py-3 text-xs font-bold flex items-center gap-2.5 transition-colors ${
              activeTab === 'orders' ? 'bg-blue-50 text-fkblue border-l-4 border-fkblue' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Orders & Dispatch ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('returns')}
            className={`w-full text-left px-4 py-3 text-xs font-bold flex items-center gap-2.5 transition-colors ${
              activeTab === 'returns' ? 'bg-blue-50 text-fkblue border-l-4 border-fkblue' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Returns & Refunds ({returns.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('wallet')}
            className={`w-full text-left px-4 py-3 text-xs font-bold flex items-center gap-2.5 transition-colors ${
              activeTab === 'wallet' ? 'bg-blue-50 text-fkblue border-l-4 border-fkblue' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Wallet & Payouts</span>
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`w-full text-left px-4 py-3 text-xs font-bold flex items-center gap-2.5 transition-colors ${
              activeTab === 'invoices' ? 'bg-blue-50 text-fkblue border-l-4 border-fkblue' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>GST Tax Invoices ({invoices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('qna')}
            className={`w-full text-left px-4 py-3 text-xs font-bold flex items-center gap-2.5 transition-colors ${
              activeTab === 'qna' ? 'bg-blue-50 text-fkblue border-l-4 border-fkblue' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MessageCircleQuestion className="w-4 h-4" />
            <span>Customer Q&A ({questions.length})</span>
          </button>
        </aside>

        {/* Tab Content Panes */}
        <div className="md:col-span-9 bg-white rounded border border-gray-200 shadow-sm p-4 sm:p-6 min-h-[500px]">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-gray-900">Performance & Revenue Overview</h2>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded bg-green-50 border border-green-200">
                  <span className="text-[11px] font-bold text-green-800 uppercase">Available Balance</span>
                  <p className="text-xl font-black text-green-950 mt-1">₹{stats?.availableBalance?.toLocaleString('en-IN') || 0}</p>
                  <span className="text-[10px] text-green-700">Ready for instant payout</span>
                </div>

                <div className="p-4 rounded bg-amber-50 border border-amber-200">
                  <span className="text-[11px] font-bold text-amber-800 uppercase">Pending Clearance</span>
                  <p className="text-xl font-black text-amber-950 mt-1">₹{stats?.pendingClearanceBalance?.toLocaleString('en-IN') || 0}</p>
                  <span className="text-[10px] text-amber-700">Released upon delivery</span>
                </div>

                <div className="p-4 rounded bg-blue-50 border border-blue-200">
                  <span className="text-[11px] font-bold text-fkblue uppercase">Total 30-Day Revenue</span>
                  <p className="text-xl font-black text-blue-950 mt-1">₹{stats?.totalRevenue?.toLocaleString('en-IN') || 0}</p>
                  <span className="text-[10px] text-blue-700">{stats?.totalOrders || 0} orders processed</span>
                </div>

                <div className="p-4 rounded bg-purple-50 border border-purple-200">
                  <span className="text-[11px] font-bold text-purple-800 uppercase">Total Disbursed</span>
                  <p className="text-xl font-black text-purple-950 mt-1">₹{stats?.totalWithdrawn?.toLocaleString('en-IN') || 0}</p>
                  <span className="text-[10px] text-purple-700">Settled to bank accounts</span>
                </div>
              </div>

              {/* Order Status Breakdown */}
              <div className="border rounded p-4 bg-gray-50 space-y-3">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Fulfillment Pipeline</h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white p-3 rounded border">
                    <span className="text-2xl font-black text-amber-600">{stats?.processingCount || 0}</span>
                    <p className="text-xs font-semibold text-gray-600 mt-1">Pending Packing</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <span className="text-2xl font-black text-blue-600">{stats?.shippedCount || 0}</span>
                    <p className="text-xs font-semibold text-gray-600 mt-1">In Transit</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <span className="text-2xl font-black text-green-600">{stats?.deliveredCount || 0}</span>
                    <p className="text-xs font-semibold text-gray-600 mt-1">Delivered Successfully</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVENTORY & VARIANTS */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-base font-bold text-gray-900">Catalog & Stock Controls</h2>
                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="px-3 py-1.5 bg-fkblue text-white rounded text-xs font-bold flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>
              </div>

              <div className="divide-y divide-gray-200">
                {products.map((p) => (
                  <div key={p.id} className="py-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3">
                        <img src={p.images[0]} alt={p.title} className="w-16 h-16 object-contain rounded border p-1 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-gray-900 line-clamp-1">{p.title}</p>
                          <p className="text-[11px] text-gray-500">
                            Category: {p.categoryName} • HSN: {p.hsn_code} • GST: {p.gst_rate_percent}%
                          </p>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-sm font-black text-gray-900">₹{p.discount_price}</span>
                            <span className="text-xs text-gray-400 line-through">₹{p.price}</span>
                          </div>
                        </div>
                      </div>

                      {/* Main Stock Input */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-gray-600">Stock:</label>
                        <input
                          type="number"
                          value={p.stock_quantity}
                          onChange={(e) => handleStockUpdate(p.id, parseInt(e.target.value, 10))}
                          className="w-20 px-2 py-1 text-xs border rounded font-mono font-bold"
                        />
                      </div>
                    </div>

                    {/* Product Variant Matrix */}
                    {p.variants && p.variants.length > 0 && (
                      <div className="pl-4 border-l-2 border-blue-200 space-y-2 bg-gray-50 p-2.5 rounded">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                          Variant Matrix & Inline SKU Stock
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {p.variants.map((v: any) => (
                            <div key={v.id} className="flex items-center justify-between p-2 bg-white rounded border">
                              <div>
                                <span className="font-bold text-gray-800">
                                  {Object.values(v.attributes).join(' / ')}
                                </span>
                                <span className="text-[10px] text-gray-400 block font-mono">{v.sku}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold">₹{v.discount_price}</span>
                                <input
                                  type="number"
                                  value={v.stock_quantity}
                                  onChange={(e) => handleStockUpdate(p.id, parseInt(e.target.value, 10), v.id)}
                                  className="w-16 px-1.5 py-0.5 text-xs border rounded font-mono text-center"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS & DISPATCH */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-900">Orders Awaiting Dispatch & Delivery</h2>

              <div className="space-y-3">
                {orders.map((o) => (
                  <div key={o.id} className="p-4 rounded border border-gray-200 bg-white space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                      <div>
                        <span className="font-bold text-gray-900">Item #{o.id.slice(0, 8)}</span>
                        <span className="text-gray-500 ml-2">Order Date: {new Date(o.orderDate).toLocaleDateString('en-IN')}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        o.item_status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {o.item_status}
                      </span>
                    </div>

                    <div className="flex gap-3 items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={o.productImage} alt={o.productTitle} className="w-14 h-14 object-contain rounded border p-1" />
                        <div>
                          <p className="font-bold text-gray-900">{o.productTitle}</p>
                          <p className="text-gray-500">Qty: {o.quantity} • Earning: ₹{o.seller_net_earning}</p>
                          <p className="text-gray-500">Customer: {o.customerName} ({o.customerPhone})</p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {o.item_status === 'PROCESSING' && (
                          <button
                            onClick={() => {
                              setShowDispatchModal(o.id);
                              setDispatchAwb(`BLUEDART-${Math.floor(10000000 + Math.random() * 90000000)}`);
                            }}
                            className="px-4 py-2 bg-fkblue text-white rounded font-bold text-xs hover:bg-fkblue-dark"
                          >
                            Dispatch Shipment
                          </button>
                        )}

                        {o.item_status === 'SHIPPED' && (
                          <button
                            onClick={() => handleDeliverConfirm(o.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded font-bold text-xs hover:bg-green-700"
                          >
                            Confirm Delivery & Release Funds
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: RETURNS & REFUNDS */}
          {activeTab === 'returns' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-900">Returns & Refund Approvals</h2>

              {returns.length === 0 ? (
                <p className="text-xs text-gray-500 py-8 text-center">No active returns currently pending.</p>
              ) : (
                <div className="space-y-3">
                  {returns.map((r) => (
                    <div key={r.id} className="p-4 rounded border border-gray-200 bg-white space-y-2 text-xs">
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="font-bold text-gray-900">{r.productTitle}</span>
                        <span className="font-bold text-xs uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          {r.status}
                        </span>
                      </div>
                      <p className="text-gray-700">Reason: <span className="font-bold">{r.reason}</span></p>
                      <p className="text-gray-600">Buyer Comments: "{r.comments}"</p>
                      <p className="text-gray-600">Refund Amount: ₹{r.refund_amount}</p>

                      {r.status === 'REQUESTED' && (
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            onClick={() => handleReturnAction(r.id, 'REJECT')}
                            className="px-3 py-1.5 border border-red-300 text-red-600 rounded font-bold hover:bg-red-50"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleReturnAction(r.id, 'APPROVE')}
                            className="px-4 py-1.5 bg-green-600 text-white rounded font-bold hover:bg-green-700"
                          >
                            Approve & Process Refund
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: WALLET & PAYOUTS */}
          {activeTab === 'wallet' && wallet && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-base font-bold text-gray-900">Ledger & Payout Settlements</h2>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold shadow"
                >
                  Request Payout Withdrawal
                </button>
              </div>

              {/* Balance Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-green-50 rounded border border-green-200">
                  <span className="text-[11px] font-bold text-green-800 uppercase">Available for Withdrawal</span>
                  <p className="text-2xl font-black text-green-950 mt-1">₹{wallet.wallet?.availableBalance?.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-4 bg-amber-50 rounded border border-amber-200">
                  <span className="text-[11px] font-bold text-amber-800 uppercase">Pending Clearance</span>
                  <p className="text-2xl font-black text-amber-950 mt-1">₹{wallet.wallet?.pendingClearanceBalance?.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded border border-gray-200">
                  <span className="text-[11px] font-bold text-gray-700 uppercase">Total Settled to Bank</span>
                  <p className="text-2xl font-black text-gray-900 mt-1">₹{wallet.wallet?.totalWithdrawn?.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Transactions Ledger */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Transaction Ledger</h3>
                <div className="divide-y border rounded overflow-hidden">
                  {wallet.transactions?.map((tx: any) => (
                    <div key={tx.id} className="p-3 bg-white flex justify-between items-center text-xs">
                      <div>
                        <p className="font-semibold text-gray-800">{tx.description}</p>
                        <p className="text-[10px] text-gray-400">{new Date(tx.created_at).toLocaleString('en-IN')}</p>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold ${tx.type.startsWith('CREDIT') ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type.startsWith('CREDIT') ? '+' : '-'} ₹{tx.amount.toLocaleString('en-IN')}
                        </span>
                        <p className="text-[10px] text-gray-400">Bal: ₹{tx.balance_after}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: GST INVOICES */}
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-base font-bold text-gray-900">GST Sales Register & Invoices</h2>
                <a
                  href="http://localhost:5000/api/v1/seller/invoices/csv"
                  download="gst_sales_register.csv"
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download GST Register (CSV)</span>
                </a>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border rounded">
                  <thead className="bg-gray-50 border-b text-gray-600 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="p-2.5">Invoice No</th>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Customer State</th>
                      <th className="p-2.5">Taxable</th>
                      <th className="p-2.5">GST Rate</th>
                      <th className="p-2.5">Total Value</th>
                      <th className="p-2.5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="p-2.5 font-mono font-bold text-fkblue">{inv.invoice_number}</td>
                        <td className="p-2.5">{new Date(inv.invoice_date).toLocaleDateString('en-IN')}</td>
                        <td className="p-2.5">{inv.billing_state}</td>
                        <td className="p-2.5">₹{inv.taxable_amount.toFixed(2)}</td>
                        <td className="p-2.5">{inv.gst_rate_percent}%</td>
                        <td className="p-2.5 font-bold">₹{inv.total_invoice_amount.toFixed(2)}</td>
                        <td className="p-2.5">
                          <a
                            href={`http://localhost:5000/api/v1/invoices/item/${inv.order_item_id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-fkblue font-bold hover:underline"
                          >
                            PDF View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: Q&A */}
          {activeTab === 'qna' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-900">Customer Inquiries on Your Products</h2>

              <div className="space-y-3">
                {questions.map((q) => (
                  <div key={q.id} className="p-3 bg-gray-50 rounded border text-xs space-y-2">
                    <p className="font-bold text-gray-900">{q.productTitle}: "{q.question_text}"</p>
                    {q.answer_text ? (
                      <p className="text-green-800 pl-3">Your Answer: {q.answer_text}</p>
                    ) : (
                      <button
                        onClick={async () => {
                          const reply = prompt('Enter your answer for this customer inquiry:');
                          if (reply) {
                            await apiRequest(`/seller/qna/${q.id}/reply`, {
                              method: 'POST',
                              body: JSON.stringify({ answerText: reply }),
                            });
                            const qnaRes = await apiRequest('/seller/qna');
                            if (qnaRes.success) setQuestions(qnaRes.questions);
                          }
                        }}
                        className="px-3 py-1 bg-fkblue text-white rounded font-bold text-xs ml-3"
                      >
                        Reply to Customer
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dispatch Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">Dispatch Shipment</h3>

            <form onSubmit={handleDispatch} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Courier Partner</label>
                <select
                  value={dispatchCourier}
                  onChange={(e) => setDispatchCourier(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="BlueDart Air Express">BlueDart Air Express</option>
                  <option value="Delhivery Surface">Delhivery Surface</option>
                  <option value="DTDC Express">DTDC Express</option>
                  <option value="Ecom Express">Ecom Express</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">AWB Tracking Number</label>
                <input
                  type="text"
                  required
                  value={dispatchAwb}
                  onChange={(e) => setDispatchAwb(e.target.value)}
                  className="w-full px-3 py-2 border rounded font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(null)}
                  className="px-3 py-1.5 border rounded font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-fkblue text-white rounded font-bold hover:bg-fkblue-dark"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">Request Payout Withdrawal</h3>

            <form onSubmit={handleWithdrawSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Amount to Withdraw (INR)</label>
                <input
                  type="number"
                  min={500}
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded font-bold text-sm"
                />
                <p className="text-[10px] text-gray-500 mt-1">1% TDS will be automatically deducted per IT regulations.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-3 py-1.5 border rounded font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-green-600 text-white rounded font-bold hover:bg-green-700"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-gray-900">Add New Product</h3>

            <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={newProdTitle}
                  onChange={(e) => setNewProdTitle(e.target.value)}
                  placeholder="e.g. Ultra Slim 4K Display Monitor"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="cat_electronics">Electronics</option>
                    <option value="cat_mobiles">Mobiles & Tablets</option>
                    <option value="cat_fashion">Fashion & Apparel</option>
                    <option value="cat_sports">Sports & Fitness</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">MRP Price (INR)</label>
                  <input
                    type="number"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Discount Price (INR)</label>
                  <input
                    type="number"
                    required
                    value={newProdDiscountPrice}
                    onChange={(e) => setNewProdDiscountPrice(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Product Description</label>
                <textarea
                  rows={3}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Key features and details..."
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 border rounded font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-fkblue text-white rounded font-bold hover:bg-fkblue-dark"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
