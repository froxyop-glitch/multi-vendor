# ShopEzy — Enterprise Multi-Vendor E-Commerce Ecosystem

A production-grade, full-stack Multi-Vendor E-Commerce platform inspired by **Flipkart** and modern SaaS storefronts like **ShopEzy**. The ecosystem is composed of three unified applications sharing one central backend and PostgreSQL/Prisma ORM database:

1. **`/backend`**: Decoupled Node.js + Express + Prisma ORM + PostgreSQL / Zero-Config Database + Socket.IO REST API with JWT authentication, granular RBAC (`CUSTOMER`, `SELLER`, `ADMIN` with sub-roles `SUPER_ADMIN`, `MANAGER`, `SUPPORT_AGENT`, `FINANCE`), and immutable security audit logs.
2. **`/frontend`**: Next.js 14 (App Router) + React + Tailwind CSS web application featuring Customer Storefront, Multi-Vendor Seller Dashboard, and Centralized Super Admin Control Panel with dynamic CMS, multilingual support (EN, HI, BN), and Technical SEO.
3. **`/mobile`**: Cross-platform React Native (Expo + Expo Router + NativeWind + TypeScript) mobile application for Android & iOS connected to the same backend REST API and Socket.IO server.

---

## 🏗️ System Architecture & Directory Map

```
multivendor-ecommerce/
├── backend/                             # Central REST API & Real-time Server
│   ├── prisma/
│   │   ├── schema.prisma                # Normalized PostgreSQL schema (32 models, 17 enums)
│   │   ├── seedData.ts                  # Enterprise seed data (7 users, 16 products, etc.)
│   │   └── seed.ts                      # Idempotent DB seeder
│   ├── src/
│   │   ├── lib/
│   │   │   ├── store.ts                 # Zero-dependency local persistence layer
│   │   │   └── repository.ts            # Type-safe Prisma-compatible repository
│   │   ├── middleware/
│   │   │   └── auth.ts                  # JWT verification & granular RBAC guards
│   │   ├── routes/
│   │   │   ├── auth.routes.ts           # Login, registration, token refresh
│   │   │   ├── store.routes.ts          # Localized CMS, banners, categories, flash sales
│   │   │   ├── product.routes.ts        # Catalog, multi-variant matrices, reviews, Q&A
│   │   │   ├── discovery.routes.ts      # Live autocomplete, trending queries, FBT bundles
│   │   │   ├── logistics.routes.ts      # 6-digit Indian PIN delivery check (EDD, COD)
│   │   │   ├── seo.routes.ts            # Dynamic sitemap & robots data feed
│   │   │   ├── cart.routes.ts           # Cart calculation engine with live coupons & flash deals
│   │   │   ├── paymentOrder.routes.ts   # Razorpay/UPI checkout, COD, webhooks, cancellations
│   │   │   ├── seller.routes.ts         # Seller dashboard: dispatch, wallet payouts, GST invoices
│   │   │   ├── admin.routes.ts          # Super Admin CMS control panel & audit logs
│   │   │   └── support.routes.ts        # Helpdesk tickets & real-time messaging
│   │   ├── services/
│   │   │   ├── auditService.ts          # Immutable security audit log recorder
│   │   │   ├── notificationService.ts   # Expo push notifications & email receipts
│   │   │   ├── pdfInvoiceService.ts     # A4 GST Tax Invoice PDF generation (CGST/SGST vs IGST)
│   │   │   └── pricingService.ts        # Dynamic cart totals & discount calculation engine
│   │   ├── prisma.ts                    # Prisma client wrapper
│   │   ├── server.ts                    # Express + Socket.IO server
│   │   └── test_api.ts                  # Automated end-to-end test suite
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                            # Next.js 14 App Router Web Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx               # Root layout with Auth, Lang, Cart & Wishlist providers
│   │   │   ├── page.tsx                 # High-converting Storefront homepage
│   │   │   ├── products/page.tsx        # Filterable catalog with dynamic sort & pagination
│   │   │   ├── product/[id]/page.tsx    # PDP with variant matrix, pincode EDD, Q&A, reviews
│   │   │   ├── cart/page.tsx            # Cart manager with 1-click coupon application
│   │   │   ├── checkout/page.tsx        # Multi-step checkout (Razorpay / UPI / COD)
│   │   │   ├── orders/page.tsx          # Order tracking timeline, cancellations & GST PDFs
│   │   │   ├── wishlist/page.tsx        # Wishlist with 1-click move to cart
│   │   │   ├── support/page.tsx         # Real-time Socket.IO chat desk
│   │   │   ├── seller/dashboard/page.tsx# Complete Multi-Vendor Seller Portal
│   │   │   ├── admin/page.tsx           # Central Super Admin Control Panel with sub-role RBAC
│   │   │   ├── sitemap.ts               # Dynamic Technical SEO XML sitemap
│   │   │   └── robots.ts                # Dynamic robots.txt
│   │   ├── components/
│   │   │   ├── Navbar.tsx               # Header with live search autocomplete & role switcher
│   │   │   ├── AnnouncementBar.tsx      # Multilingual announcement ticker
│   │   │   ├── CategoryBar.tsx          # Flipkart-style visual category strip
│   │   │   ├── HeroCarousel.tsx         # Auto-advancing promotional banners
│   │   │   ├── FlashSaleStrip.tsx       # Live countdown timer & deals carousel
│   │   │   ├── ProductCard.tsx          # Reusable product card with rating & discount badges
│   │   │   └── Footer.tsx               # E-Commerce footer with policy links
│   │   ├── context/
│   │   │   ├── AuthContext.tsx          # Auth state with instant 1-click test role switcher
│   │   │   ├── LanguageContext.tsx      # Multilingual translation provider (EN, HI, BN)
│   │   │   ├── CartContext.tsx          # Global cart state sync
│   │   │   └── WishlistContext.tsx      # Global wishlist state sync
│   │   └── lib/
│   │       ├── api.ts                   # Axios client with bearer token interceptor
│   │       └── translations.ts          # EN, HI, BN string dictionary
│   ├── package.json
│   └── tailwind.config.ts
│
└── mobile/                              # Cross-Platform React Native (Expo) Mobile App
    ├── app/
    │   ├── _layout.tsx                  # Stack navigator & global context providers
    │   ├── (tabs)/
    │   │   ├── _layout.tsx              # Bottom tab bar (Home, Categories, Cart, Account)
    │   │   ├── index.tsx                # Mobile Storefront home (Banners, flash sales, grids)
    │   │   ├── categories.tsx           # Category exploration grid
    │   │   ├── cart.tsx                 # Shopping cart with quantity steppers & checkout CTA
    │   │   └── account.tsx              # User profile, language toggle, and 1-click role switcher
    │   ├── search.tsx                   # Dedicated search with live thumbnail autocomplete
    │   ├── product/[id].tsx             # Mobile PDP with variant selector, PIN checker, Q&A
    │   ├── checkout.tsx                 # Mobile checkout with coupon input & payment selector
    │   ├── orders.tsx                   # My Orders, shipment tracking modal, GST PDF links
    │   └── support/[ticketId].tsx       # Live Socket.IO mobile chat screen
    ├── src/
    │   ├── context/
    │   │   ├── AuthContext.tsx
    │   │   ├── CartContext.tsx
    │   │   └── WishlistContext.tsx
    │   ├── i18n/                        # Mobile i18n localization (EN, HI, BN)
    │   └── lib/api.ts                   # Axios client with Expo SecureStore
    ├── package.json
    ├── app.json
    └── tailwind.config.js
```

---

## 🔑 Test Credentials (Pre-Seeded)

The platform includes 7 pre-seeded test accounts covering every role and sub-role. You can log in using these credentials or use the **1-Click Role Switcher** located in the top navigation bar of both Web and Mobile apps:

| Email | Password | Role | Sub-Role / Store | State / PIN |
|---|---|---|---|---|
| `admin@shopezy.com` | `Password123!` | `ADMIN` | `SUPER_ADMIN` | All Modules Access |
| `manager@shopezy.com` | `Password123!` | `ADMIN` | `MANAGER` | CMS, Catalog, Logistics, Coupons |
| `support@shopezy.com` | `Password123!` | `ADMIN` | `SUPPORT_AGENT` | Support Chat, Reviews, Orders |
| `finance@shopezy.com` | `Password123!` | `ADMIN` | `FINANCE` | Payout Approvals, Tax Invoices |
| `techworld@seller.com` | `Password123!` | `SELLER` | TechWorld Electronics | West Bengal (`736123`) |
| `urbanstyle@seller.com` | `Password123!` | `SELLER` | UrbanStyle Apparel | Maharashtra (`400001`) |
| `customer@shopezy.com` | `Password123!` | `CUSTOMER` | Rahul Sen | Alipurduar, WB (`736123`) |

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js** v18+ or v20+
- **npm** v9+

### 2. Start the Backend API & Socket Server
```bash
cd backend
npm install
npm run seed     # Seeds 7 users, 16 products, flash deals, pincodes, orders
npm run build    # Compiles TypeScript to dist/
npm start        # Starts server on http://localhost:5000 (Socket.IO ws://localhost:5000)
```
*To run the automated 10-suite end-to-end integration test:*
```bash
npx ts-node src/test_api.ts
```

### 3. Start the Next.js Web Application
```bash
cd frontend
npm install
npm run build    # Verifies all 14 routes compile cleanly
npm run dev      # Starts web storefront on http://localhost:3000
```
Visit `http://localhost:3000` in your browser. Use the header **Role Switcher** to test:
- **Customer Storefront**: Browse catalog, check PIN delivery, apply coupons (`WELCOME10`, `FLAT200`), place orders.
- **Multi-Vendor Seller Dashboard**: Visit `http://localhost:3000/seller/dashboard` to manage stock, dispatch packages with AWB numbers, view wallet earnings, and request payouts.
- **Super Admin Control Panel**: Visit `http://localhost:3000/admin` to edit banners, configure site settings, manage serviceable PIN codes, approve seller payouts with UTR, and review security audit logs.

### 4. Start the React Native (Expo) Mobile App
```bash
cd mobile
npm install
npx expo start
```
- Press `a` for Android Emulator.
- Press `i` for iOS Simulator.
- Press `w` for Web Preview.
- Or scan the QR code using the **Expo Go** mobile app on your physical phone!

---

## ⚙️ Environment Variables

### `/backend/.env`
```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/shopezy_ecommerce?schema=public"
JWT_SECRET="shopezy_production_jwt_secret_key_2026_secure"
JWT_EXPIRES_IN="7d"
RAZORPAY_KEY_ID="rzp_test_placeholder"
RAZORPAY_KEY_SECRET="rzp_secret_placeholder"
EXPO_ACCESS_TOKEN=""
FRONTEND_URL="http://localhost:3000"
```

### `/frontend/.env.local`
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api/v1"
NEXT_PUBLIC_SOCKET_URL="http://localhost:5000"
NEXT_PUBLIC_SITE_NAME="ShopEzy"
```

### `/mobile/.env`
```env
EXPO_PUBLIC_API_URL="http://localhost:5000/api/v1"
EXPO_PUBLIC_SOCKET_URL="http://localhost:5000"
```
*(Note: If testing on Android emulator, use `http://10.0.2.2:5000/api/v1`)*

---

## 💡 Key Architectural Highlights

### 1. Indian GST Invoicing Engine
- In compliance with Indian GST laws, when a customer purchases an item, the backend checks:
  - **Intra-State Supply** (`seller_state === billing_state`, e.g. West Bengal to West Bengal): Auto-splits GST into **CGST** (half) + **SGST** (half).
  - **Inter-State Supply** (`seller_state !== billing_state`, e.g. Maharashtra to West Bengal): Applies full **IGST**.
- Generates publication-ready **A4 PDF Invoices** with seller GSTIN, HSN codes, and amount in words via `pdfkit`.

### 2. Multi-Vendor Wallet & Payout Ledger
- When an order is placed, the platform deducts its commission and credits `seller_net_earning` to `SellerProfiles.pending_clearance_balance`.
- Upon order delivery past the return window (or simulated delivery), balance moves to `available_balance`.
- Sellers can request payouts via Bank Transfer or UPI.
- Payout amounts are debited to `on_hold_payout_balance` until `FINANCE` or `SUPER_ADMIN` settles the payout with a UTR reference number or rejects it to restore funds.

### 3. Pincode Logistics & Estimated Delivery (EDD)
- Built-in 6-digit Indian Pincode engine (`736123` Alipurduar, `400001` Mumbai, `110001` Delhi, etc.) calculates shipping fee, cash-on-delivery (COD) availability, and estimated delivery days.

### 4. Granular RBAC & Immutable Security Audit Log
- Granular administrative sub-roles prevent unauthorized changes:
  - `SUPER_ADMIN`: Total access to CMS, catalog, finances, staff management, and audit logs.
  - `MANAGER`: Storefront content, banners, categories, products, pincodes, and coupons.
  - `SUPPORT_AGENT`: Live helpdesk tickets and verified buyer reviews.
  - `FINANCE`: Seller payout request settlements, UTR input, and GST Tax Invoices.
- Every administrative mutation automatically writes an immutable record to `AuditLogs` capturing actor ID, email, role, sub-role, action, IP address, user-agent, and metadata JSON diff.
