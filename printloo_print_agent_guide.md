
# PrintLOO Print Agent Architecture & Implementation Guide

## Introduction

This document explains how the PrintLOO automatic printing system works and how the local print automation agent should be implemented.

The goal of the print agent is to:
- automatically receive print jobs
- download files
- communicate with local printers
- execute print commands
- update print status

This architecture allows PrintLOO to automate the printing workflow while keeping the main SaaS platform scalable and cloud-based.

---

# Important Concept

The print automation system is NOT another website.

It is a:
> Local desktop/background application installed on the xerox shop computer.

This application acts as a bridge between:
- the cloud backend
- the local printer hardware

---

# System Architecture

```txt
Customer
   ↓
PrintLOO Website
   ↓
NestJS Backend
   ↓
Redis Queue
   ↓
Local Print Agent
   ↓
Printer
```

---

# Why Separate Applications?

The main website cannot directly control local printers because browsers block direct printer access for security reasons.

Therefore:
- website handles business logic
- print agent handles printer communication

This separation creates a clean and scalable architecture.

---

# Applications Overview

## 1. Main SaaS Application

Built using:
- Next.js
- NestJS
- PostgreSQL
- Redis

Responsibilities:
- authentication
- file uploads
- payments
- queue management
- realtime updates
- dashboards

---

## 2. PrintLOO Agent

A separate local application installed inside xerox shop computers.

Responsibilities:
- polling backend for jobs
- downloading files
- sending print commands
- updating job status
- printer communication

---

# Recommended Technology

## Use Node.js

Why?
- lightweight
- TypeScript ecosystem consistency
- easy backend integration
- simple deployment

Electron is unnecessary initially.

---

# Recommended Folder Structure

```txt
printloo-agent/
 ├── src/
 │    ├── index.ts
 │    ├── api.ts
 │    ├── printer.ts
 │    ├── config.ts
 │    └── types.ts
 ├── package.json
 └── tsconfig.json
```

---

# Core Workflow

```txt
Start Agent
   ↓
Connect To Backend
   ↓
Check For New Jobs
   ↓
Download PDF
   ↓
Send To Printer
   ↓
Update Status
```

---

# Step 1 — Initialize Project

```bash
mkdir printloo-agent
cd printloo-agent
npm init -y
```

---

# Step 2 — Install Dependencies

```bash
npm install axios pdf-to-printer dotenv
```

Development tools:

```bash
npm install typescript ts-node nodemon -D
```

---

# Step 3 — Backend Communication

Example:

```ts
import axios from "axios"

export async function fetchJobs() {
  const response = await axios.get(
    "https://api.printloo.com/jobs/pending"
  )

  return response.data
}
```

---

# Step 4 — Polling System

```ts
setInterval(async () => {
  const jobs = await fetchJobs()

  console.log(jobs)
}, 5000)
```

---

# Step 5 — File Download

```ts
import fs from "fs"
import axios from "axios"

export async function downloadFile(url: string) {
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  })

  const path = "./temp/order.pdf"

  response.data.pipe(fs.createWriteStream(path))

  return path
}
```

---

# Step 6 — Printing PDFs

Install package:

```bash
npm install pdf-to-printer
```

Example:

```ts
import { print } from "pdf-to-printer"

export async function printFile(path: string) {
  await print(path)
}
```

---

# Why PDF Only?

Initially support only:
- PDF
- JPG
- PNG

Avoid:
- DOCX
- PPT
- Excel

Reason:
PDF printing is predictable and consistent across systems.

---

# Print Metadata System

Example:

```json
{
  "fileUrl": "assignment.pdf",
  "copies": 2,
  "duplex": true,
  "color": false,
  "paperSize": "A4"
}
```

---

# Full Printing Flow

```txt
Check Jobs
   ↓
Download PDF
   ↓
Print PDF
   ↓
Notify Backend
```

---

# Updating Job Status

```ts
await axios.post(
  "https://api.printloo.com/jobs/completed",
  {
    orderId: job.id
  }
)
```

---

# Future Improvements

- WebSocket support
- Desktop UI
- Auto startup
- Multi-printer routing
- Printer health monitoring

---

# Deployment Strategy

The print agent is NOT deployed online.

It runs locally inside the xerox shop computer.

Only the main SaaS application is deployed online.

---

# Local Installation

Later versions can generate:

```txt
PrintLOO-Agent.exe
```

using:
- pkg
- nexe
- electron-builder

The shopkeeper:
1. downloads installer
2. installs locally
3. logs in
4. agent runs automatically

---

# Recommended Development Order

## Build FIRST
- uploads
- pricing
- payments
- queue
- dashboard

## Build LATER
- print agent
- automation
- printer routing

---

# Final Notes

The PrintLOO architecture combines:
- cloud software
- realtime systems
- local infrastructure
- hardware communication

This makes the project:
- scalable
- production-oriented
- technically impressive

The print agent should remain:
- lightweight
- reliable
- simple
