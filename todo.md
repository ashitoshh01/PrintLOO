# 📋 PrintLOO Production Roadmap & TODO List

---

## 🎯 High-Level Tasks Overview

- [x] **1. Database Migration to Neon DB (Cloud PostgreSQL)**
- [x] **2. Cloudinary Integration for Document & Media Uploads**
- [x] **3. Production-Ready Razorpay Integration**
- [ ] **4. Production Deployment & Environment Verification**

---

## 🐘 1. Deploy Database on Neon DB

Migrate the database from local PostgreSQL (`localhost:5432`) to a managed, auto-scaling Cloud PostgreSQL database hosted on [Neon.tech](https://neon.tech).

### Action Items:
- [x] Create a Neon DB project and copy the PostgreSQL connection string (`postgresql://neondb_owner:npg_9xWuypGr4jaU@52.76.128.157/neondb?sslmode=require...`).
- [x] Update `DATABASE_URL` in `apps/api/.env`.
- [x] Run Prisma migration deploy & client generation:
  ```bash
  cd apps/api
  npx prisma migrate deploy
  npx prisma generate
  ```
- [x] Seed the production/cloud database with initial shop and service data:
  ```bash
  npx prisma db seed
  ```
- [x] Test database connections from NestJS API and verify data persistence.

---

## ☁️ 2. Integrate Cloudinary for Uploads

Replace local storage (`./uploads`) with [Cloudinary](https://cloudinary.com/) for reliable cloud document and asset storage with fast CDN delivery.

### Action Items:
- [x] Install Cloudinary SDK and file stream helper in NestJS API (`cloudinary`, `pdf-parse`).
- [x] Add Cloudinary configuration keys to `apps/api/.env`:
  ```env
  CLOUDINARY_URL=cloudinary://599358312394127:ic36jCF60CtjAZsuD1QbYS03eFE@depohq5yg
  ```
- [x] Implement Cloudinary provider in `apps/api/src/modules/uploads/uploads.service.ts`.
- [x] Update `UploadsService` to stream uploaded PDF/image buffers directly to Cloudinary folder (`printloo/<shopId>`).
- [x] Update uploads controller and response format to include `fileId`, `fileUrl` (Cloudinary CDN), `pageCount`, and `fileName`.
- [x] Test document uploads end-to-end from Next.js frontend to verify file availability.

---

## 💳 3. Integrate Razorpay Properly

Finalize the Razorpay payment gateway integration for seamless online payments and order queuing.

### Action Items:
- [x] Set up Razorpay API keys in both backend and frontend environment files:
  * Backend (`apps/api/.env`):
    ```env
    RAZORPAY_KEY_ID=rzp_test_TMv5vJIv0i5Vdi
    RAZORPAY_KEY_SECRET=G3FQh2rz1siQfpYc21VSIw64
    RAZORPAY_WEBHOOK_SECRET=G3FQh2rz1siQfpYc21VSIw64
    ```
  * Frontend (`apps/web/.env.local`):
    ```env
    NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_TMv5vJIv0i5Vdi
    ```
- [x] Frontend: Inject and load the Razorpay checkout script (`https://checkout.razorpay.com/v1/checkout.js`) in `RootLayout`.
- [x] Frontend: Connect the order checkout modal to trigger `createRazorpayOrder` API and open the Razorpay popup.
- [x] Backend: Ensure `verifyPayment` validates the HMAC signature correctly before setting order status to `QUEUED`.
- [x] Backend: Ensure `createRazorpayOrder` returns order amount in paise (`rzpOrder.amount`) matching Razorpay Checkout SDK requirements.
- [x] Backend: Implement Webhook handler (`/api/payments/webhook`) to handle payment signature verification.
- [x] Test payment flow end-to-end with Razorpay test credentials.

---

## 🚀 4. Deployment & Infrastructure

- [ ] Deploy Next.js Frontend (`apps/web`) to Vercel / Netlify.
- [ ] Deploy NestJS API (`apps/api`) to Render / Railway / DigitalOcean.
- [ ] Provision Redis on Upstash / Render for background print queues.
- [ ] End-to-end audit: Location shop discovery ➔ Upload file to Cloudinary ➔ Razorpay checkout ➔ Live print queue.
