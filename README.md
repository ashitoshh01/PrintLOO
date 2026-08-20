# PrintLOO 🖨️✨

> **Smart Queue & Print Automation Platform for Modern Xerox Shops**  
> *Transforming traditional print shops into high-efficiency, zero-wait smart printing hubs.*

---

[![Turborepo](https://img.shields.io/badge/Monorepo-Turborepo-ef4444?style=for-the-badge&logo=turborepo)](https://turbo.build/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-000000?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/Backend-NestJS-E0234E?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Queue-Redis%20%26%20BullMQ-DC382D?style=for-the-badge&logo=redis)](https://redis.io/)
[![Socket.io](https://img.shields.io/badge/Realtime-Socket.IO-010101?style=for-the-badge&logo=socket.io)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](#license)

---

## 📌 Executive Summary

**PrintLOO** is a multi-tenant SaaS platform that modernizes local xerox and document printing stores by bringing the entire printing lifecycle online. Think of it as **Swiggy / Zomato for your local print shop**. 

Instead of forcing customers to stand in crowded physical queues for printing just 1–2 pages, PrintLOO enables customers to remotely upload documents, configure print settings, pay online, track real-time queue position with accurate ETA, and collect their prints effortlessly when ready.

---

## 🚀 Key Features

### 👤 Customer App (`apps/web`)
* **Remote File Upload**: Secure upload for PDFs, JPGs, and PNGs with automatic page count detection and file validation.
* **Dynamic Print Configuration**: Flexible selection of color mode (B&W / Color), paper side (Single / Duplex), paper size (A4 / A3 / Legal), and copy count.
* **Instant Price Calculation**: Server-side dynamic cost evaluation based on the selected shop's configured pricing rules.
* **Razorpay Payment Integration**: Seamless online payment checkout with server-side signature verification before queue entry.
* **Real-time Queue & ETA Tracker**: Live WebSocket updates displaying `Token Number`, `Jobs Ahead`, and dynamic `Estimated Completion Time`.
* **File Preview**: Interactive document preview prior to order payment.

### 🏪 Shop Owner & Operator Dashboard
* **Real-Time Queue Management**: Live order stream feed categorizing orders by status (`Pending`, `Queued`, `Processing`, `Printing`, `Completed`).
* **Order Orchestration**: Quick actions to accept, pause, retry, or manually print incoming jobs.
* **Dynamic Pricing Engine**: Granular control over per-page rates based on print mode, duplexing, and document type.
* **Multi-Printer Setup**: Manage shop printer inventory and toggle printer online/offline states and capabilities.
* **Revenue & Performance Analytics**: Overview of daily orders, gross revenue, peak activity hours, and print volume breakdowns.
* **Tenant Isolation**: Multi-tenant database design where all business resources are strictly isolated by `shopId`.

---

## 🏗️ System Architecture

```
                    ┌─────────────────────────┐
                    │     Customer Browser    │
                    └────────────┬────────────┘
                                 │ HTTP / WebSockets
                                 ▼
                    ┌─────────────────────────┐
                    │   Next.js 14 Frontend   │
                    │       (apps/web)        │
                    └────────────┬────────────┘
                                 │ REST API / WS Gateway
                                 ▼
                    ┌─────────────────────────┐
                    │      NestJS API         │
                    │       (apps/api)        │
                    └──────┬───────────┬──────┘
                           │           │
            ┌──────────────┴─┐       ┌─┴──────────────┐
            │ PostgreSQL DB  │       │  Redis Queue   │
            │ (Prisma ORM)   │       │   (BullMQ)     │
            └────────────────┘       └────────┬───────┘
                                              │
                                              ▼
                                   ┌─────────────────────┐
                                   │  Local Print Agent  │
                                   │ (Shop Computer App) │
                                   └──────────┬──────────┘
                                              │ OS Print Spooler
                                              ▼
                                   ┌─────────────────────┐
                                   │  Physical Printer   │
                                   └─────────────────────┘
```

---

## 🔄 Order Lifecycle Engine

Each print order progresses statefully through defined statuses:

```
  [ PENDING ] ──► (Payment Verified) ──► [ QUEUED ]
                                            │
                                            ▼
  [ COMPLETED ] ◄── [ PRINTING ] ◄── [ PROCESSING ]
        ▲
        └────────────── [ FAILED ] (Auto / Manual Retry)
```

1. **PENDING**: Order created & file uploaded; awaiting payment confirmation.
2. **QUEUED**: Razorpay payment verified server-side; order assigned a `tokenNumber` and pushed into Redis/BullMQ queue.
3. **PROCESSING**: Background worker locks the order, prepares file stream, and determines printer assignment.
4. **PRINTING**: Order sent to shop printer via local print agent or manual operator action.
5. **COMPLETED**: Print operation confirmed; customer receives readiness notification.
6. **FAILED**: Printing error encountered; eligible for manual/automated retry.

---

## 🛠️ Tech Stack & Monorepo Structure

PrintLOO is structured as a **Turborepo monorepo**:

```
PrintLOO/
 ├── apps/
 │    ├── api/                  # NestJS Backend (REST API, WebSockets, Prisma, BullMQ)
 │    │    ├── prisma/          # Database Schema & Migrations
 │    │    ├── src/
 │    │    │    ├── modules/    # Auth, Shops, Printers, Pricing, Orders, Payments, Queue, Analytics
 │    │    │    └── gateways/   # Socket.IO Real-time Events
 │    │    └── uploads/         # Local File Storage Directory
 │    └── web/                  # Next.js 14 Frontend (App Router, Tailwind CSS, Zustand)
 │         ├── src/
 │         │    ├── app/        # Next.js Routes (Customer Portal, Shop Admin Dashboard)
 │         │    ├── components/ # UI Components (Shadcn/Radix UI, Forms, Queue Indicators)
 │         │    └── store/      # Zustand Global State Management
 ├── Description_Implementation.md
 ├── Execution_Plan.md
 ├── Problem_Solution.md
 ├── SETUP_INSTRUCTIONS.md
 ├── printloo_print_agent_guide.md
 ├── package.json               # Monorepo Scripts & Workspaces
 └── turbo.json                 # Turborepo Task Pipeline Configuration
```

### Core Technologies
* **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn UI / Radix UI, Zustand, Socket.IO Client.
* **Backend**: NestJS, TypeScript, Prisma ORM, PostgreSQL, Redis, BullMQ, Socket.IO WebSockets.
* **Payments**: Razorpay Node SDK & Webhooks.
* **Document Processing**: `pdf-lib` for metadata parsing and page validation.

---

## ⚡ Quick Start Guide

### Prerequisites
Ensure the following tools are installed on your machine:
* **Node.js** (v18.0.0 or higher)
* **PostgreSQL** (v14 or higher)
* **Redis Server** (running locally or via Docker/WSL)

---

### 1. Repository Setup & Dependencies

Clone the repository and install dependencies at the root level:

```bash
git clone https://github.com/your-username/PrintLOO.git
cd PrintLOO
npm install
```

---

### 2. Database Creation

Create a PostgreSQL database named `printloo`:

```bash
psql -U postgres -c "CREATE DATABASE printloo;"
```

---

### 3. Environment Variables Configuration

#### Backend Environment Configuration (`apps/api/.env`)
Create `apps/api/.env` with the following configuration:

```env
# Database & Cache
DATABASE_URL="postgresql://postgres:password@localhost:5432/printloo?schema=public"
REDIS_URL="redis://localhost:6379"

# Authentication Secrets
JWT_SECRET="printloo_jwt_secret_key_change_in_production"
JWT_REFRESH_SECRET="printloo_refresh_secret_key_change_in_production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID="rzp_test_your_key_here"
RAZORPAY_KEY_SECRET="your_razorpay_secret_here"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret_here"

# File Upload & Server Settings
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE_MB=25
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

#### Frontend Environment Configuration (`apps/web/.env.local`)
Create `apps/web/.env.local` with the following configuration:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_your_key_here"
```

---

### 4. Database Migration & Seeding

Apply database schema migrations and seed initial development data:

```bash
# Run database migrations
npm run db:migrate

# (Optional) Seed test shops, users, and printers
npm run db:seed
```

---

### 5. Running the Application

Launch both frontend and backend dev servers concurrently using Turborepo:

```bash
npm run dev
```

* **Frontend Dashboard**: `http://localhost:3000`
* **NestJS API Endpoint**: `http://localhost:3001/api`
* **Swagger / Health Check**: `http://localhost:3001/api/health`

---

## 📑 Core Database Schema Highlights

The database models are designed with **strict tenant isolation** using `shopId`:

* `User`: Customer, Operator, Shop Admin, and Super Admin accounts.
* `Shop`: Shop identity, operating hours, geolocation, and general configuration settings.
* `Printer`: Multi-printer records linked to shops with feature flags (`supportsColor`, `supportsDuplex`, `isOnline`).
* `PricingRule`: Per-shop configurable pricing rates mapping (`colorMode`, `sides`) to price per page.
* `PrintOrder`: Print jobs containing document meta, print configuration, status, and generated token numbers.
* `Payment`: Razorpay transactions linked 1:1 with print orders with verification timestamps.
* `QueueJob`: Active job queue position state linked to PostgreSQL orders.

---

## 🖨️ Local Print Automation Agent

The PrintLOO SaaS ecosystem supports a dedicated **Local Print Agent** designed to run inside shop hardware.

* **Purpose**: Bridges cloud queue instructions with physical USB/LAN printers attached to shop computers.
* **Mechanism**: Polls backend/listens over WebSockets, downloads print files securely, executes print jobs via native print drivers (`pdf-to-printer`), and notifies backend of job status changes.
* For full implementation specifications, consult [`printloo_print_agent_guide.md`](./printloo_print_agent_guide.md).

---

## 📜 Available Scripts

Run these commands from the root directory:

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `turbo run dev` | Start development servers for Web and API in parallel. |
| `npm run build` | `turbo run build` | Build production bundles for all applications. |
| `npm run lint` | `turbo run lint` | Execute ESLint across the monorepo codebase. |
| `npm run db:migrate` | `cd apps/api && npx prisma migrate dev` | Run Prisma database migrations. |
| `npm run db:seed` | `cd apps/api && npx prisma db seed` | Seed database with demo data. |
| `npm run db:studio` | `cd apps/api && npx prisma studio` | Launch Prisma Studio GUI database browser. |

---

## 🗺️ Product Roadmap

* [x] **V1 MVP Core**: Remote file upload, dynamic pricing, Razorpay payment verification, basic queue tracking, shop admin dashboard.
* [x] **V2 Real-time Engine**: WebSocket live status streaming, order ETAs, analytics dashboard, multi-printer configuration.
* [ ] **V3 Local Print Automation**: Executable Windows/Linux print agent for zero-click automatic printing.
* [ ] **V4 SaaS Scaling**: Multi-tenant subscription plans (Starter/Pro/Enterprise), AI queue optimization, automated invoice generation.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Made with ❤️ for local xerox shop owners & daily print customers.
</p>
