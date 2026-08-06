# 📋 PrintLOO Production Roadmap & TODO List

---

## 🎯 High-Level Tasks Overview

- [ ] **1. Database Migration to Neon DB (Cloud PostgreSQL)**
- [ ] **2. Cloudinary Integration for Document & Media Uploads**
- [ ] **3. Production-Ready Razorpay Integration**
- [ ] **4. Production Deployment & Environment Verification**

---

## 🐘 1. Deploy Database on Neon DB

Migrate the database from local PostgreSQL (`localhost:5432`) to a managed, auto-scaling Cloud PostgreSQL database hosted on [Neon.tech](https://neon.tech).

### Action Items:
- [ ] Create a Neon DB project and copy the PostgreSQL connection string (`postgresql://<user>:<password>@<ep-name>.neon.tech/printloo?sslmode=require`).
- [ ] Update `DATABASE_URL` and `DIRECT_URL` (if using pooling) in `apps/api/.env`.
- [ ] Run Prisma migration deploy:
  ```bash
  cd apps/api
  npx prisma migrate deploy
  ```
- [ ] Seed the production/cloud database with initial shop and service data:
  ```bash
  npx prisma db seed
  ```
- [ ] Test database connections from NestJS API and verify data persistence.

---

## ☁️ 2. Integrate Cloudinary for Uploads

Replace local storage (`./uploads`) with [Cloudinary](https://cloudinary.com/) for reliable cloud document and asset storage with fast CDN delivery.

### Action Items:
- [ ] Install Cloudinary SDK and file stream helper in NestJS API:
  ```bash
  cd apps/api
  npm install cloudinary streamifier
  npm install --save-dev @types/streamifier
  ```
- [ ] Add Cloudinary configuration keys to `apps/api/.env`:
  ```env
  CLOUDINARY_CLOUD_NAME=your_cloud_name
  CLOUDINARY_API_KEY=your_api_key
  CLOUDINARY_API_SECRET=your_api_secret
  ```
- [ ] Create a `CloudinaryModule` / service provider inside `apps/api/src/modules/uploads/`.
- [ ] Update `UploadsService` to stream uploaded PDF/image buffers directly to Cloudinary.
- [ ] Update the Prisma `File` model or responses to include `cloudinaryUrl` and `publicId`.
- [ ] Test document uploads end-to-end from the Next.js frontend to verify file availability.

---

## 💳 3. Integrate Razorpay Properly

Finalize the Razorpay payment gateway integration for seamless online payments and order queuing.

### Action Items:
- [ ] Set up Razorpay API keys in both backend and frontend environment files:
  * Backend (`apps/api/.env`):
    ```env
    RAZORPAY_KEY_ID=rzp_test_xxxxxx
    RAZORPAY_KEY_SECRET=xxxxxx
    RAZORPAY_WEBHOOK_SECRET=xxxxxx
    ```
  * Frontend (`apps/web/.env.local`):
    ```env
    NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxx
    ```
- [ ] Frontend: Inject and load the Razorpay checkout script (`https://checkout.razorpay.com/v1/checkout.js`).
- [ ] Frontend: Connect the order checkout modal to trigger `createRazorpayOrder` API and open the Razorpay popup.
- [ ] Backend: Ensure `verifyPayment` validates the HMAC signature correctly before setting order status to `QUEUED`.
- [ ] Backend: Implement full Webhook handler (`/api/payments/webhook`) to handle async payment notifications (`payment.captured`, `payment.failed`).
- [ ] Test payment flow end-to-end with Razorpay test credentials.

---

## 🚀 4. Deployment & Infrastructure

- [ ] Deploy Next.js Frontend (`apps/web`) to Vercel / Netlify.
- [ ] Deploy NestJS API (`apps/api`) to Render / Railway / DigitalOcean.
- [ ] Provision Redis on Upstash / Render for background print queues.
- [ ] End-to-end audit: Location shop discovery ➔ Upload file to Cloudinary ➔ Razorpay checkout ➔ Live print queue.
