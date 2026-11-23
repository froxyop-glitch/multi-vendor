'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  LayoutDashboard,
  Settings,
  Image as ImageIcon,
  Layers,
  Tag,
  Zap,
  MapPin,
  Store,
  Package,
  ShoppingCart,
  Wallet,
  FileSpreadsheet,
  Users,
  ScrollText,
  Save,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';

export default function AdminControlPanel() {
  const { user } = useAuth();
  const subRole = user?.adminSubRole || 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<string>('overview');

  const [overview, setOverview] = useState<any>(null);
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [banners, setBanners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [flashSales, setFlashSales] = useState<any[]>([]);
  const [pincodes, setPincodes] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quick Forms
  const [newBanner, setNewBanner] = useState({ title: '', image_url: '', redirect_link: '', position: 'HERO_CAROUSEL' });
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', icon_or_image_url: '' });
  const [newCoupon, setNewCoupon] = useState({ code: '', discount_type: 'PERCENTAGE', discount_value: '10', min_order_amount: '499', valid_until: '2026-12-31' });
  const [newPincode, setNewPincode] = useState({ pincode: '', city: '', state: '', zone: 'METRO', estimated_days: 2, cod_available: true, extra_shipping_fee: 0 });

  useEffect(() => {
    async function loadAdminData() {
      if (!user || user.role !== 'ADMIN') return;
      setIsLoading(true);

      const [ovRes, cfgRes, banRes, catRes, cpnRes, fsRes, pinRes, selRes, catlRes, ordRes, payRes, stfRes, audRes] = await Promise.all([
        apiRequest('/admin/overview'),
        apiRequest('/admin/site-config'),
        apiRequest('/admin/banners'),
        apiRequest('/admin/categories'),
        apiRequest('/admin/coupons'),
        apiRequest('/admin/flash-sales'),
        apiRequest('/admin/pincodes'),
        apiRequest('/admin/sellers'),
        apiRequest('/admin/catalog'),
        apiRequest('/admin/orders'),
        apiRequest('/admin/payouts'),
        apiRequest('/admin/staff'),
        apiRequest('/admin/audit-logs'),
      ]);

      if (ovRes.success) setOverview(ovRes.stats);
      if (cfgRes.success) setSiteConfig(cfgRes.config);
      if (banRes.success) setBanners(banRes.banners || []);
      if (catRes.success) setCategories(catRes.categories || []);
      if (cpnRes.success) setCoupons(cpnRes.coupons || []);
      if (fsRes.success) setFlashSales(fsRes.flashSales || []);
      if (pinRes.success) setPincodes(pinRes.pincodes || []);
      if (selRes.success) setSellers(selRes.sellers || []);
      if (catlRes.success) setCatalog(catlRes.products || []);
      if (ordRes.success) setOrders(ordRes.orders || []);
      if (payRes.success) setPayouts(payRes.payouts || []);
      if (stfRes.success) setStaff(stfRes.staff || []);
      if (audRes.success) setAuditLogs(audRes.logs || []);

      setIsLoading(false);
    }

    loadAdminData();
  }, [user]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/admin/site-config', {
      method: 'PUT',
      body: JSON.stringify(siteConfig),
    });
    if (res.success) {
      alert('Global configurations and SEO settings saved successfully!');
      setSiteConfig(res.config);
    } else {
      alert(res.message || 'Failed to save config.');
    }
  };

  const handleSellerStatus = async (sellerId: string, status: string, rate?: number) => {
    const res = await apiRequest(`/admin/sellers/${sellerId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ approvalStatus: status, commissionRate: rate }),
    });
    if (res.success) {
      const selRes = await apiRequest('/admin/sellers');
      if (selRes.success) setSellers(selRes.sellers);
    }
  };

  const handlePayoutAction = async (payoutId: string, action: 'SETTLE' | 'REJECT') => {
    let utr = null;
    let note = '';
    if (action === 'SETTLE') {
      utr = prompt('Enter Bank UTR Reference Number:');
      if (!utr) return;
    } else {
      note = prompt('Enter rejection reason:') || 'Rejected by finance desk';
    }

    const res = await apiRequest(`/admin/payouts/${payoutId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, utrReferenceNumber: utr, adminNote: note }),
    });

    if (res.success) {
      alert(res.message);
      const payRes = await apiRequest('/admin/payouts');
      if (payRes.success) setPayouts(payRes.payouts);
    } else {
      alert(res.message || 'Action failed.');
    }
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/admin/banners', {
      method: 'POST',
      body: JSON.stringify(newBanner),
    });
    if (res.success) {
      const banRes = await apiRequest('/admin/banners');
      if (banRes.success) setBanners(banRes.banners);
      setNewBanner({ title: '', image_url: '', redirect_link: '', position: 'HERO_CAROUSEL' });
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(newCategory),
    });
    if (res.success) {
      const catRes = await apiRequest('/admin/categories');
      if (catRes.success) setCategories(catRes.categories);
      setNewCategory({ name: '', slug: '', icon_or_image_url: '' });
    }
  };

  const handleAddPincode = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/admin/pincodes', {
      method: 'POST',
      body: JSON.stringify(newPincode),
    });
    if (res.success) {
      const pinRes = await apiRequest('/admin/pincodes');
      if (pinRes.success) setPincodes(pinRes.pincodes);
      setNewPincode({ pincode: '', city: '', state: '', zone: 'METRO', estimated_days: 2, cod_available: true, extra_shipping_fee: 0 });
    }
  };

  const handleStaffRoleChange = async (userId: string, newRole: string) => {
    const res = await apiRequest(`/admin/staff/${userId}/sub-role`, {
      method: 'PATCH',
      body: JSON.stringify({ adminSubRole: newRole }),
    });
    if (res.success) {
      const stfRes = await apiRequest('/admin/staff');
      if (stfRes.success) setStaff(stfRes.staff);
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-gray-300 mx-auto" />
        <h2 className="text-xl font-bold text-gray-800">Super Admin Privileges Required</h2>
        <p className="text-xs text-gray-500">Only authorized administrators may access the central marketplace control panel.</p>
        <Link href="/" className="inline-block px-6 py-2.5 bg-fkblue text-white rounded font-bold text-xs">
          Return to Storefront
        </Link>
      </div>
    );
  }

  // Sub-role access matrix
  const isSuper = subRole === 'SUPER_ADMIN';
  const isManager = isSuper || subRole === 'MANAGER';
  const isFinance = isSuper || subRole === 'FINANCE';
  const isSupport = isSuper || subRole === 'SUPPORT_AGENT';

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded border border-gray-200 shadow-sm mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-700 rounded border border-purple-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Centralized Super Admin Control Panel</h1>
            <p className="text-xs text-gray-500">
              Logged in as <span className="font-bold">{user.name}</span> • Sub-Role: <span className="font-mono font-bold text-purple-700">{subRole}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-green-100 text-green-800">
            Audit Logging Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Role-Filtered Sidebar */}
        <aside className="md:col-span-3 bg-white rounded border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full text-left px-4 py-3 font-bold flex items-center gap-2 ${
              activeTab === 'overview' ? 'bg-purple-50 text-purple-800 border-l-4 border-purple-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          {isManager && (
            <button
              onClick={() => setActiveTab('cms')}
              className={`w-full text-left px-4 py-3 font-bold flex items-center gap-2 ${
                activeTab === 'cms' ? 'bg-purple-50 text-purple-800 border-l-4 border-purple-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Storefront & SEO CMS</span>
            </button>
          )}

          {isManager && (
            <button
              onClick={() => setActiveTab('banners_categories')}
              className={`w-full text-left px-4 py-3 font-bold flex items-center gap-2 ${
                activeTab === 'banners_categories' ? 'bg-purple-50 text-purple-800 border-l-4 border-purple-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Banners & Categories</span>
            </button>
          )}

          {isManager && (
            <button
              onClick={() => setActiveTab('promotions')}
              className={`w-full text-left px-4 py-3 font-bold flex items-center gap-2 ${
                activeTab === 'promotions' ? 'bg-purple-50 text-purple-800 border-l-4 border-purple-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Coupons & Flash Sales</span>
            </button>
          )}

          {isManager && (
            <button
              onClick={() => setActiveTab('pincodes')}
              className={`w-full text-left px-4 py-3 font-bold flex items-center gap-2 ${
                activeTab === 'pincodes' ? 'bg-purple-50 text-purple-800 border-l-4 border-purple-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Pincodes & Logistics</span>
            </button>
          )}

          {(isSuper || isManager) && (
            <button
              onClick={() => setActiveTab('sellers')}
              className={`w-full text-left px-4 py-3 font-bold flex items-center gap-2 ${
                activeTab === 'sellers' ? 'bg-purple-50 text-purple-800 border-l-4 border-purple-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Sellers & Approvals ({sellers.length})</span>
            </button>
          )}

          {(isManager || isSupport) && (
            <button
              onClick={() => setActiveTab('catalog')}
              className={`w-full text-left px-4 py-3 font-bold flex items-center gap-2 ${
                activeTab === 'catalog' ? 'bg-purple-50 text-purple-800 border-l-4 border-purple-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Catalog & Moderation</span>
            </button>
          )}

          {(isFinance || isSupport) && (
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-4 py-3 font-bold flex items-center gap-2 ${
                activeTab === 'orders' ? 'bg-purple-50 text-purple-800 border-l-4 border-purple-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Orders & Refunds ({orders.length})</span>
            </button>
          )}

          {isFinance && (
            <button
              onClick={() => setActiveTab('payouts')}
              className={`w-full text-left px-4 py-3 font-bold flex items-center gap-2 ${
                activeTab === 'payouts' ? 'bg-purple-50 text-purple-800 border-l-4 border-purple-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Seller Payout Settlements</span>
            </button>
          )}

          {isSuper && (
            <button
              onClick={() => setActiveTab('staff')}
              className={`w-full text-left px-4 py-3 font-bold flex items-center gap-2 ${
                activeTab === 'staff' ? 'bg-purple-50 text-purple-800 border-l-4 border-purple-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Staff Roles & RBAC</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('audit')}
            className={`w-full text-left px-4 py-3 font-bold flex items-center gap-2 ${
              activeTab === 'audit' ? 'bg-purple-50 text-purple-800 border-l-4 border-purple-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ScrollText className="w-4 h-4" />
            <span>Security Audit Logs</span>
          </button>
        </aside>

        {/* Panes */}
        <div className="md:col-span-9 bg-white rounded border border-gray-200 shadow-sm p-4 sm:p-6 min-h-[550px]">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && overview && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-gray-900">Platform GMV & Revenue Performance</h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-4 bg-purple-50 rounded border border-purple-200">
                  <span className="font-bold text-purple-800 uppercase block">Platform GMV</span>
                  <p className="text-xl font-black text-purple-950 mt-1">₹{overview.platformGMV?.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-4 bg-green-50 rounded border border-green-200">
                  <span className="font-bold text-green-800 uppercase block">Commission Earned</span>
                  <p className="text-xl font-black text-green-950 mt-1">₹{overview.platformCommission?.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded border border-blue-200">
                  <span className="font-bold text-blue-800 uppercase block">Active Sellers</span>
                  <p className="text-xl font-black text-blue-950 mt-1">{overview.approvedSellers} / {overview.totalSellers}</p>
                </div>
                <div className="p-4 bg-amber-50 rounded border border-amber-200">
                  <span className="font-bold text-amber-800 uppercase block">Pending Payouts</span>
                  <p className="text-xl font-black text-amber-950 mt-1">{overview.pendingPayoutRequestsCount}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STOREFRONT & SEO CMS */}
          {activeTab === 'cms' && siteConfig && (
            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-base font-bold text-gray-900">Storefront CMS & Global Logistics Config</h2>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded flex items-center gap-1.5 shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save CMS Settings</span>
                </button>
              </div>

              {/* Multilingual Announcement Texts */}
              <div className="p-3 bg-gray-50 rounded border space-y-3">
                <h3 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">
                  Multilingual Announcement Bar Text
                </h3>
                <div>
                  <label className="font-bold text-gray-600 block mb-1">English Announcement</label>
                  <input
                    type="text"
                    value={siteConfig.announcement_bar_text}
                    onChange={(e) => setSiteConfig({ ...siteConfig, announcement_bar_text: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-600 block mb-1">Hindi Announcement (हिन्दी)</label>
                  <input
                    type="text"
                    value={siteConfig.announcement_bar_hi}
                    onChange={(e) => setSiteConfig({ ...siteConfig, announcement_bar_hi: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-600 block mb-1">Bengali Announcement (বাংলা)</label>
                  <input
                    type="text"
                    value={siteConfig.announcement_bar_bn}
                    onChange={(e) => setSiteConfig({ ...siteConfig, announcement_bar_bn: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded"
                  />
                </div>
              </div>

              {/* Shipping & Tax Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Base Shipping Fee (INR)</label>
                  <input
                    type="number"
                    value={siteConfig.shipping_fee}
                    onChange={(e) => setSiteConfig({ ...siteConfig, shipping_fee: parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 border rounded"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Free Shipping Threshold</label>
                  <input
                    type="number"
                    value={siteConfig.free_shipping_threshold}
                    onChange={(e) => setSiteConfig({ ...siteConfig, free_shipping_threshold: parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 border rounded"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Global Commission (%)</label>
                  <input
                    type="number"
                    value={siteConfig.global_commission_percent}
                    onChange={(e) => setSiteConfig({ ...siteConfig, global_commission_percent: parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 border rounded"
                  />
                </div>
              </div>

              {/* Return Window & Legal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Return Window (Days)</label>
                  <input
                    type="number"
                    value={siteConfig.return_window_days}
                    onChange={(e) => setSiteConfig({ ...siteConfig, return_window_days: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-1.5 border rounded"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Platform GSTIN</label>
                  <input
                    type="text"
                    value={siteConfig.platform_gstin}
                    onChange={(e) => setSiteConfig({ ...siteConfig, platform_gstin: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded font-mono font-bold"
                  />
                </div>
              </div>

              {/* SEO Tags */}
              <div className="p-3 bg-gray-50 rounded border space-y-2">
                <h3 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">
                  Technical SEO & OpenGraph Settings
                </h3>
                <div>
                  <label className="font-bold text-gray-600 block mb-1">Meta Title</label>
                  <input
                    type="text"
                    value={siteConfig.meta_title}
                    onChange={(e) => setSiteConfig({ ...siteConfig, meta_title: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-600 block mb-1">Meta Description</label>
                  <textarea
                    rows={2}
                    value={siteConfig.meta_description}
                    onChange={(e) => setSiteConfig({ ...siteConfig, meta_description: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded"
                  />
                </div>
              </div>
            </form>
          )}

          {/* TAB 3: BANNERS & CATEGORIES */}
          {activeTab === 'banners_categories' && (
            <div className="space-y-6 text-xs">
              {/* Banners */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900">Banners CMS</h3>
                <form onSubmit={handleAddBanner} className="p-3 bg-gray-50 rounded border grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Banner Title"
                    required
                    value={newBanner.title}
                    onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                    className="px-2 py-1.5 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Image URL"
                    required
                    value={newBanner.image_url}
                    onChange={(e) => setNewBanner({ ...newBanner, image_url: e.target.value })}
                    className="px-2 py-1.5 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Redirect Link"
                    required
                    value={newBanner.redirect_link}
                    onChange={(e) => setNewBanner({ ...newBanner, redirect_link: e.target.value })}
                    className="px-2 py-1.5 border rounded"
                  />
                  <button type="submit" className="px-3 py-1.5 bg-purple-700 text-white rounded font-bold">
                    Add Banner
                  </button>
                </form>

                <div className="divide-y border rounded">
                  {banners.map((b) => (
                    <div key={b.id} className="p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={b.image_url} alt={b.title} className="w-16 h-8 object-cover rounded" />
                        <div>
                          <p className="font-bold text-gray-900">{b.title}</p>
                          <p className="text-[10px] text-gray-500">{b.position} • {b.redirect_link}</p>
                        </div>
                      </div>
                      <span className="font-bold text-green-700">Active</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-3 pt-4 border-t">
                <h3 className="text-sm font-bold text-gray-900">Categories CMS</h3>
                <form onSubmit={handleAddCategory} className="p-3 bg-gray-50 rounded border grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Category Name"
                    required
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="px-2 py-1.5 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Slug"
                    required
                    value={newCategory.slug}
                    onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                    className="px-2 py-1.5 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Image URL"
                    required
                    value={newCategory.icon_or_image_url}
                    onChange={(e) => setNewCategory({ ...newCategory, icon_or_image_url: e.target.value })}
                    className="px-2 py-1.5 border rounded"
                  />
                  <button type="submit" className="px-3 py-1.5 bg-purple-700 text-white rounded font-bold">
                    Add Category
                  </button>
                </form>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map((c) => (
                    <div key={c.id} className="p-2 bg-gray-50 border rounded flex items-center gap-2">
                      <img src={c.icon_or_image_url} alt={c.name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <p className="font-bold text-gray-900">{c.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{c.slug}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PINCODES */}
          {activeTab === 'pincodes' && (
            <div className="space-y-4 text-xs">
              <h2 className="text-base font-bold text-gray-900">Serviceable Pincodes & Logistics</h2>

              <form onSubmit={handleAddPincode} className="p-3 bg-gray-50 rounded border grid grid-cols-2 sm:grid-cols-5 gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="PIN (e.g. 736123)"
                  required
                  value={newPincode.pincode}
                  onChange={(e) => setNewPincode({ ...newPincode, pincode: e.target.value })}
                  className="px-2 py-1.5 border rounded font-mono font-bold"
                />
                <input
                  type="text"
                  placeholder="City"
                  required
                  value={newPincode.city}
                  onChange={(e) => setNewPincode({ ...newPincode, city: e.target.value })}
                  className="px-2 py-1.5 border rounded"
                />
                <input
                  type="text"
                  placeholder="State"
                  required
                  value={newPincode.state}
                  onChange={(e) => setNewPincode({ ...newPincode, state: e.target.value })}
                  className="px-2 py-1.5 border rounded"
                />
                <select
                  value={newPincode.zone}
                  onChange={(e) => setNewPincode({ ...newPincode, zone: e.target.value as any })}
                  className="px-2 py-1.5 border rounded"
                >
                  <option value="METRO">METRO</option>
                  <option value="TIER_1">TIER_1</option>
                  <option value="TIER_2_3">TIER_2_3</option>
                  <option value="REMOTE">REMOTE</option>
                </select>
                <button type="submit" className="px-3 py-1.5 bg-purple-700 text-white rounded font-bold">
                  Add Pincode
                </button>
              </form>

              <div className="divide-y border rounded overflow-hidden">
                {pincodes.map((pin) => (
                  <div key={pin.id} className="p-2.5 bg-white flex justify-between items-center">
                    <div>
                      <span className="font-mono font-bold text-fkblue">{pin.pincode}</span>
                      <span className="text-gray-700 ml-2 font-semibold">{pin.city}, {pin.state}</span>
                      <span className="text-gray-400 ml-2">Zone: {pin.zone} • {pin.estimated_days} Days</span>
                    </div>
                    <span className="font-bold text-green-700">Serviceable</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: SELLERS */}
          {activeTab === 'sellers' && (
            <div className="space-y-4 text-xs">
              <h2 className="text-base font-bold text-gray-900">Multi-Vendor Sellers Management</h2>

              <div className="space-y-3">
                {sellers.map((s) => (
                  <div key={s.id} className="p-4 rounded border bg-white space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">{s.store_name}</h3>
                        <p className="text-gray-500">{s.ownerName} ({s.ownerEmail}) • GSTIN: {s.gstin_or_tax_id}</p>
                        <p className="text-gray-500">Address: {s.registered_address}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        s.approval_status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {s.approval_status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-gray-600 font-semibold">
                        Commission: <span className="font-bold text-purple-700">{s.commission_rate || 10}%</span>
                      </span>

                      <div className="flex gap-2">
                        {s.approval_status !== 'APPROVED' && (
                          <button
                            onClick={() => handleSellerStatus(s.id, 'APPROVED', 10.0)}
                            className="px-3 py-1 bg-green-600 text-white rounded font-bold"
                          >
                            Approve Seller
                          </button>
                        )}
                        {s.approval_status === 'APPROVED' && (
                          <button
                            onClick={() => handleSellerStatus(s.id, 'SUSPENDED')}
                            className="px-3 py-1 border border-red-300 text-red-600 rounded font-bold hover:bg-red-50"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: PAYOUT SETTLEMENTS */}
          {activeTab === 'payouts' && (
            <div className="space-y-4 text-xs">
              <h2 className="text-base font-bold text-gray-900">Seller Payout Requests & Settlement Desk</h2>

              {payouts.length === 0 ? (
                <p className="text-xs text-gray-500 py-6 text-center">No payout requests currently.</p>
              ) : (
                <div className="space-y-3">
                  {payouts.map((p) => (
                    <div key={p.id} className="p-4 rounded border bg-white space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900">{p.sellerStoreName}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          p.status === 'SETTLED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {p.status}
                        </span>
                      </div>

                      <div className="flex gap-4 text-gray-600">
                        <p>Requested: <span className="font-bold text-gray-900">₹{p.amount_requested}</span></p>
                        <p>TDS 1%: <span className="font-bold text-gray-900">₹{p.tds_or_fee_deducted}</span></p>
                        <p>Net Payable: <span className="font-bold text-green-700">₹{p.net_payable_amount}</span></p>
                      </div>

                      {p.methodDetails && (
                        <p className="text-gray-500 font-mono text-[11px]">
                          Bank: {p.methodDetails.bank_name || 'UPI'} • A/C: {p.methodDetails.account_number_full || p.methodDetails.upi_id} • IFSC: {p.methodDetails.ifsc_code}
                        </p>
                      )}

                      {p.status === 'PENDING' && (
                        <div className="flex justify-end gap-2 pt-2 border-t">
                          <button
                            onClick={() => handlePayoutAction(p.id, 'REJECT')}
                            className="px-3 py-1 border border-red-300 text-red-600 rounded font-bold"
                          >
                            Reject & Restore
                          </button>
                          <button
                            onClick={() => handlePayoutAction(p.id, 'SETTLE')}
                            className="px-4 py-1 bg-green-600 text-white rounded font-bold hover:bg-green-700"
                          >
                            Settle with UTR
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: STAFF ROLES & RBAC */}
          {activeTab === 'staff' && (
            <div className="space-y-4 text-xs">
              <h2 className="text-base font-bold text-gray-900">Internal Staff Sub-Role Assignments</h2>

              <div className="divide-y border rounded overflow-hidden">
                {staff.map((s) => (
                  <div key={s.id} className="p-3 bg-white flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{s.name}</p>
                      <p className="text-[11px] text-gray-500">{s.email}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={s.adminSubRole || 'MANAGER'}
                        onChange={(e) => handleStaffRoleChange(s.id, e.target.value)}
                        className="px-2.5 py-1 border rounded bg-white font-bold text-purple-700"
                      >
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="SUPPORT_AGENT">SUPPORT_AGENT</option>
                        <option value="FINANCE">FINANCE</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4 text-xs">
              <h2 className="text-base font-bold text-gray-900">Immutable Security Audit Trail</h2>

              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-gray-50 rounded border text-[11px] space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-purple-700">{log.action}</span>
                      <span className="text-gray-400">{new Date(log.created_at).toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-gray-800 font-semibold">{log.summary}</p>
                    <p className="text-gray-500">
                      Actor: {log.actor_email} ({log.actor_role} • {log.actor_sub_role || 'N/A'}) • IP: {log.ip_address}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
