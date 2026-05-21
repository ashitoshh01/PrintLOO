# PrintLOO — Master Project Guide

> Smart Queue & Print Automation Platform for Modern Xerox Shops

---

## What Is PrintLOO?

PrintLOO is a **multi-tenant SaaS platform** that modernizes local xerox/print shops by digitizing the entire printing workflow — from file upload to printing — and eliminating physical waiting queues.

Think of it as **Swiggy/Zomato for your local print shop.** Instead of standing in a crowd for 2 pages, you upload remotely, pay online, track your order live, and show up only when it's ready.

---

## The Problem Being Solved

Traditional xerox shops are stuck in the past:

- Customers crowd near counters even for tiny jobs (1-2 pages)
- No queue visibility — you don't know how long you'll wait
- Everything is manual: file collection, pricing, payment, order tracking
- Operators get overwhelmed during peak hours
- Customers leave and go elsewhere → shops lose revenue
- No way to place an order without physically being present

This is a **real, daily problem** affecting thousands of people across India — students, office workers, government applicants — near colleges, courts, banks, and government offices.

---

## The Solution

A web-based SaaS platform where customers can:

1. Upload files remotely (PDF, JPG, PNG)
2. Configure print settings (B&W/Color, duplex, copies, paper size)
3. See instant, auto-calculated pricing
4. Pay online (before entering the queue)
5. Join a live digital queue
6. Track order status in realtime

Shops get a **real-time dashboard** to manage orders, monitor queues, handle payments, and eventually automate the printing process entirely.

---

## Tech Stack (Why Each Was Chosen)

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js + TypeScript | SSR, SEO, mobile responsive, fast |
| UI | Tailwind CSS + ShadCN | Modern, consistent design system |
| State | Zustand | Lightweight, simple state management |
| Backend | NestJS + TypeScript | Scalable, queue-ready, enterprise patterns |
| Database | PostgreSQL | Relational, transactional, analytics-ready |
| ORM | Prisma | Type-safe queries, clean migrations |
| Queue | Redis + BullMQ | Background job processing, retries, priority |
| Realtime | Socket.IO (via NestJS) | Live queue updates, dashboard sync |
| Payments | Razorpay | India-focused payment gateway |
| Storage | Local → AWS S3 / Cloudflare R2 | Start simple, scale later |

**Why NOT MongoDB?** This system is highly relational — orders, payments, queues, shops, users, printers all link to each other. PostgreSQL is the right call.

---

## System Architecture

```
Customer (Browser)
        ↓
   Next.js Frontend
        ↓
   Load Balancer (production)
        ↓
   NestJS API Server
        ↓
   PostgreSQL Database
        ↓
   Redis Queue (BullMQ)
        ↓
   Queue Workers (background)
```

### Multi-Tenant Design

Every xerox shop = one **tenant**. Complete isolation between shops.

Every critical database table includes a `shop_id` column. One backend serves all shops simultaneously with their data completely separated.

---

## Core Features Breakdown

### Customer-Facing

| Feature | Description |
|---|---|
| File Upload | PDF, JPG, PNG. Validated for size, type, page count. |
| Print Configuration | B&W or Color, single/duplex, copies count, A4/A3/Legal |
| Dynamic Pricing | Auto-calculated from shop's configured price rules |
| Online Payment | Razorpay. Payment verified server-side before queue entry |
| Live Queue Tracker | "Now Printing: #31 / Your Token: #36 / ETA: 7 mins" |
| File Preview | Preview before payment to reduce complaints |

### Shop Dashboard

| Feature | Description |
|---|---|
| Realtime Queue View | Live feed of pending, active, and completed jobs |
| Order Controls | Pause, retry, cancel, override manual print |
| Revenue Analytics | Daily revenue, order count, print type breakdown, peak hours |
| Shop Settings | Configure pricing, operating hours, queue capacity |

---

## Database Design (Core Tables)

```
users          → id, name, email, role, shop_id, created_at
shops          → id, name, location, contact, settings
printers       → id, shop_id, name, supports_color, supports_duplex
print_orders   → id, shop_id, user_id, file_url, config (JSON), status, token_number
payments       → id, order_id, razorpay_id, amount, status, verified_at
queue_jobs     → id, order_id, shop_id, position, status, created_at
```

Every table with `shop_id` is **tenant-isolated**.

---

## Queue States

Every order moves through these states:

```
PENDING → QUEUED → PROCESSING → PRINTING → COMPLETED
                                         ↘ FAILED (retry available)
```

ETA is calculated dynamically based on current queue length and average job duration.

---

## Pricing Engine

Prices are **not hardcoded**. They're stored in the database per shop and configurable by the shop owner.

Example default structure:

| Print Type | Price |
|---|---|
| B&W Single Side | ₹2 |
| B&W Duplex | ₹3 |
| Color Single Side | ₹10 |
| Color Duplex | ₹20 |

Future: bulk discounts, night pricing.

---

## Security Considerations

| Concern | Approach |
|---|---|
| File uploads | Type validation, size limits, virus scan (future) |
| Payment verification | Always verify server-side via Razorpay webhook. Never trust frontend |
| File access | Signed URLs — private files not publicly accessible |
| Rate limiting | Prevent spam uploads and DDoS on API endpoints |
| Auth | JWT + refresh tokens, bcrypt password hashing |
| Tenant isolation | Every query scoped by `shop_id` |

---

## Product Roadmap

### V1 — MVP (Build First)
- File uploads
- Print configuration
- Dynamic pricing
- Razorpay payment
- Queue management (manual printing from dashboard)
- Shop admin dashboard

### V2 — Enhanced Experience
- Realtime queue updates (WebSockets)
- Revenue analytics
- File preview before payment

### V3 — SaaS Scale
- Multi-shop onboarding
- Subscription billing per shop (Starter / Pro / Enterprise)
- Advanced analytics

---

## Exact Execution Order — Phase by Phase

### Phase 0 — System Design (Before Writing Any Code)

- [ ] Define all user roles: Customer, Operator, Shop Admin, Super Admin
- [ ] Finalize DB schema with all tables and relationships
- [ ] Draw architecture diagram (API ↔ Queue)
- [ ] Plan monorepo structure (Turborepo with `apps/web`, `apps/api`)
- [ ] Decide all environment variables and config contracts

**Deliverable:** Architecture doc + DB schema diagram + folder structure decided

---

### Phase 1 — Project Setup

- [ ] Init monorepo with Turborepo (or set up separately to start simpler)
- [ ] Frontend: Next.js + TypeScript + Tailwind + ShadCN + Zustand
- [ ] Backend: NestJS + Prisma + PostgreSQL connection
- [ ] Setup Redis locally
- [ ] Configure ESLint, Prettier, Husky, Commitlint
- [ ] Git branching: `main` / `develop` / `feature/*`

**Deliverable:** Both apps running locally with "Hello World"

---

### Phase 2 — Authentication & Roles

- [ ] Customer signup / login / forgot password
- [ ] Shop admin login
- [ ] JWT auth with refresh tokens
- [ ] Role-based guards in NestJS (`customer`, `operator`, `admin`, `super_admin`)
- [ ] Protected routes on frontend

**Deliverable:** Auth working end-to-end for all roles

---

### Phase 3 — Shop Management

- [ ] Shop creation API + form (name, location, contact)
- [ ] Printer configuration (add printers, set capabilities)
- [ ] Shop settings (operating hours, queue capacity)
- [ ] Super admin can onboard/deactivate shops

**Deliverable:** Shops and printers can be registered and managed

---

### Phase 4 — File Upload System

- [ ] Upload endpoint in NestJS (validate type + size)
- [ ] Store locally first (disk), migrate to S3 later
- [ ] Extract metadata (page count, file size)
- [ ] Return signed URL for preview
- [ ] Frontend: drag-drop upload UI with progress

**Deliverable:** Files upload, validate, store, and are previewable

---

### Phase 5 — Print Configuration Engine

- [ ] Config options: B&W/Color, single/duplex, copies, paper size
- [ ] Validate against printer capabilities (e.g., no duplex if printer doesn't support it)
- [ ] Store config as JSON on the order
- [ ] Frontend: clean config UI with live validation

**Deliverable:** User can configure print options, invalid combos are blocked

---

### Phase 6 — Pricing Engine

- [ ] Pricing rules stored in DB per shop (not hardcoded)
- [ ] Pricing calculation API: takes config → returns price
- [ ] Frontend: shows live price as user changes settings

**Deliverable:** Dynamic, shop-configurable pricing that updates in real time

---

### Phase 7 — Payment Integration

- [ ] Razorpay: create order → initiate payment → verify webhook server-side
- [ ] Mark order as paid only after server-side verification
- [ ] Trigger queue entry only after payment confirmed
- [ ] Frontend: Razorpay checkout flow

**Deliverable:** Full payment flow working. Order enters queue only after payment confirmed.

---

### Phase 8 — Queue Management System

- [ ] BullMQ queue setup with Redis
- [ ] On payment success → add job to queue
- [ ] Queue states: PENDING → QUEUED → PROCESSING → PRINTING → COMPLETED / FAILED
- [ ] ETA calculation based on position and average job time
- [ ] Retry logic for failed jobs

**Deliverable:** Orders flow through queue with correct states and ETA

---

### Phase 9 — Admin Dashboard

- [ ] Real-time queue view (pending, active, completed)
- [ ] Order controls: pause, retry, cancel
- [ ] Manual print trigger (operator clicks "Print" → sends to printer)
- [ ] Basic analytics: daily revenue, order count, print type breakdown

**Deliverable:** Operators can manage the queue and handle orders from dashboard

---

### Phase 10 — Realtime Features (WebSockets)

- [ ] Socket.IO integration in NestJS
- [ ] Customer: live queue position and ETA updates
- [ ] Dashboard: live order feed without page refresh
- [ ] Animated order status transitions on frontend

**Deliverable:** Everything updates in real time without polling

---

### Phase 11 — Multi-Shop SaaS

- [ ] Subscription plans: Starter / Professional / Enterprise
- [ ] Billing integration (Razorpay Subscriptions)
- [ ] Usage limits per plan (orders/month, printers, etc.)
- [ ] Super admin panel: onboard shops, monitor usage, deactivate

**Deliverable:** Platform runs as a paid SaaS with multiple paying shops

---

### Phase 12 — DevOps & Monitoring

- [ ] Dockerize: frontend, backend, Redis, workers
- [ ] Docker Compose for local dev
- [ ] Deploy backend on Railway / Render / EC2
- [ ] Deploy frontend on Vercel
- [ ] CI/CD with GitHub Actions (test → build → deploy)
- [ ] Monitoring: Grafana + Prometheus
- [ ] Centralized logging: API logs, payment logs, worker logs

**Deliverable:** Production-grade infrastructure, deployed and monitored

---

### Phase 13 — Production Optimization

- [ ] Horizontal API scaling (multiple NestJS instances + load balancer)
- [ ] Independent queue worker scaling
- [ ] DB indexing + query optimization + connection pooling
- [ ] Redis caching for queue stats and analytics
- [ ] CDN for static assets

**Deliverable:** Platform handles real-world traffic at scale

---

## Folder Structure

### Frontend (`apps/web`)

```
src/
 ├── app/           ← Next.js App Router pages
 ├── components/    ← Reusable UI components
 ├── hooks/         ← Custom React hooks
 ├── store/         ← Zustand state stores
 ├── services/      ← API call functions
 ├── types/         ← Shared TypeScript types
 └── utils/         ← Helper functions
```

### Backend (`apps/api`)

```
src/
 ├── modules/       ← Feature modules (auth, orders, shops, payments...)
 ├── common/        ← Guards, interceptors, decorators
 ├── config/        ← App config and env
 ├── prisma/        ← Prisma schema and migrations
 ├── queues/        ← BullMQ queue definitions
 ├── workers/       ← Queue job processors
 ├── gateways/      ← WebSocket gateways
 └── utils/         ← Shared utilities
```

## What NOT To Do

- ❌ Don't build automation before the MVP queue is stable
- ❌ Don't build microservices at the start — monolith first
- ❌ Don't hardcode pricing — it must be DB-driven from day one
- ❌ Don't trust frontend payment success — always verify server-side
- ❌ Don't start with fancy UI — core logic first
- ❌ Don't use MongoDB — this system is relational
- ❌ Don't build everything in Phase 1 — layer by layer

---

## MVP Definition (What Counts as "Done")

A valid MVP allows a shop to:
1. Receive file uploads from customers online
2. Auto-calculate pricing
3. Accept and verify online payments
4. Manage a digital print queue
5. Allow manual printing from the dashboard

That alone solves the core problem. Everything else is an enhancement.

---

## What This Project Demonstrates (Resume Value)

| Skill Area | What It Shows |
|---|---|
| Backend Engineering | Queues, workers, background jobs, WebSockets, REST APIs |
| SaaS Architecture | Multi-tenancy, tenant isolation, subscription billing |
| System Design | Load balancing, distributed workers, event-driven architecture |
| DevOps | Docker, CI/CD, monitoring, logging, deployment |
| Product Thinking | Solving a real operational problem with scalable software |
| Payments | Razorpay integration with proper server-side verification |
| Realtime Systems | Socket.IO live updates, ETA calculation |

---

## Quick Reference — Things to Remember

| Thing | Decision |
|---|---|
| Monorepo tool | Turborepo |
| Auth method | JWT + Refresh Tokens |
| Password hashing | bcrypt |
| File storage (MVP) | Local disk |
| File storage (prod) | AWS S3 or Cloudflare R2 |
| Supported file types | PDF, JPG, PNG only |
| Payment gateway | Razorpay |
| Queue system | Redis + BullMQ |
| Realtime | Socket.IO |
| DB | PostgreSQL via Prisma |
| Tenant isolation | `shop_id` on every critical table |

---

*PrintLOO — Transforming ordinary xerox shops into efficient smart printing centers.*