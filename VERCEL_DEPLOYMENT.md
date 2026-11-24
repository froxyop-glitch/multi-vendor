# Vercel Deployment Guide for ShopEzy

This monorepo contains the **Backend API**, **Frontend Web App**, and **Mobile App**. Deploying on Vercel is seamless by creating two Vercel projects (one for the Backend REST API and one for the Next.js Frontend).

---

## 🚀 1. Deploying the Backend (`/backend`) to Vercel

The backend has been adapted for Vercel Serverless Functions with:
- Dedicated Vercel serverless entrypoint: [`backend/api/index.ts`](backend/api/index.ts)
- Automatic URL routing: [`backend/vercel.json`](backend/vercel.json)
- Zero-crash serverless filesystem handling (writes to `/tmp` in AWS Lambda)
- Safe non-blocking serverless export (bypasses `server.listen` when `VERCEL` env is active)
- Automated Prisma client generation on build (`postinstall: prisma generate`)

### Step-by-Step Backend Setup on Vercel:

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..."** -> **"Project"**.
2. Select the repository **`froxyop-glitch/test-project`**.
3. In the **Project Configuration** screen:
   - **Project Name:** `shopezy-backend-api` (or your preferred name)
   - **Framework Preset:** `Other`
   - **Root Directory:** Click **Edit** and choose **`backend`**
4. **Build and Output Settings:**
   - **Build Command:** `npm run build` (or leave default)
   - **Output Directory:** Leave blank
   - **Install Command:** `npm install` (or leave default)
5. **Environment Variables:**
   Add the following environment variables in the Vercel project settings:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: `super-secret-jwt-key-2026-flipkart-shopezy-secure` (or your custom secure key)
   - `FRONTEND_URL`: `https://<your-frontend-domain>.vercel.app` (or `*`)
   - `DATABASE_URL` *(Optional)*: Your PostgreSQL connection string (if using external PostgreSQL like Supabase/Neon/Railway; if omitted, the backend runs in high-performance zero-config mode)
   - `RAZORPAY_KEY_ID` *(Optional)*: `rzp_test_sample_key_id`
   - `RAZORPAY_KEY_SECRET` *(Optional)*: `rzp_test_sample_secret`
6. Click **Deploy**.

Once deployed, your API will be live at `https://<your-backend-domain>.vercel.app/`.
- Health check: `https://<your-backend-domain>.vercel.app/health`
- Storefront config: `https://<your-backend-domain>.vercel.app/api/v1/store/config`
- Products catalog: `https://<your-backend-domain>.vercel.app/api/v1/products`

---

## 🌐 2. Deploying the Frontend (`/frontend`) to Vercel

1. In Vercel, click **"Add New..."** -> **"Project"**.
2. Select the repository **`froxyop-glitch/test-project`**.
3. In the **Project Configuration** screen:
   - **Project Name:** `shopezy-storefront`
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Click **Edit** and select **`frontend`**
4. **Environment Variables:**
   - `NEXT_PUBLIC_API_URL`: `https://<your-backend-domain>.vercel.app/api/v1`
5. Click **Deploy**.
