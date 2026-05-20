# PrintLOO

> Smart Queue & Print Automation Platform for Modern Xerox Shops

PrintLOO is a modern SaaS platform designed to digitize and automate local xerox and print shops by eliminating physical waiting queues and streamlining the entire printing workflow.

Users can:
- Upload files remotely
- Configure print settings
- Pay online
- Join a live print queue
- Track realtime order status
- Collect prints without unnecessary waiting

---

# Problem

Traditional xerox shops often face:
- long waiting queues
- crowding near counters
- manual workflow management
- payment delays
- poor customer experience

Even customers needing only 1–2 pages must wait in physical lines.

PrintLOO solves this by bringing the entire printing workflow online.

---

# Features

## Customer Features
- Remote file uploads
- Dynamic print configuration
- Instant price calculation
- Online payment integration
- Live queue tracking
- Realtime print status updates

---

## Shop Features
- Realtime order dashboard
- Queue management
- Manual & automated print workflow
- Analytics & revenue tracking
- Multi-printer support

---

# Tech Stack

## Frontend
- Next.js
- TypeScript
- Tailwind CSS
- ShadCN UI

## Backend
- NestJS
- PostgreSQL
- Prisma ORM
- Redis
- BullMQ
- WebSockets

---

# Architecture

```txt
Customer
   ↓
Next.js Frontend
   ↓
NestJS API
   ↓
PostgreSQL
   ↓
Redis Queue
   ↓
Print Workers
   ↓
Local Print Agent
   ↓
Printer
