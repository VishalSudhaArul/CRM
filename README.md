# APEX OS — Mini ERP + CRM Operations Portal

> **Full Stack Developer Case Study Submission**  
> **Target Project:** Mini ERP + CRM Operations Portal  
> **Engineered with:** Node.js, Express.js, TypeScript, Raw SQL Database Engine (PostgreSQL / SQLite), React, and Vanilla/Tailwind CSS.

---

### 🌐 Live Deployment & Quick Links
- **Live Frontend App (Vercel):** [https://crm-swart-omega-24.vercel.app](https://crm-swart-omega-24.vercel.app)
- **Live Backend API (Render):** [https://crm-backend-lc33.onrender.com/api](https://crm-backend-lc33.onrender.com/api)
- **GitHub Repository:** [https://github.com/VishalSudhaArul/CRM](https://github.com/VishalSudhaArul/CRM)
- **Postman API Collection:** `postman_collection.json` (in project root)

---


## 📋 Table of Contents
1. [Project Overview & Key Business Flows](#-project-overview--key-business-flows)
2. [Tech Stack Architecture](#-tech-stack-architecture)
3. [Test User Credentials (All Roles)](#-test-user-credentials-all-roles)
4. [Local Setup & Quickstart Guide](#-local-setup--quickstart-guide)
5. [Environment Variables Management](#-environment-variables-management)
6. [Core Modules & Business Logic Implementation](#-core-modules--business-logic-implementation)
7. [API Endpoints Reference & Postman Collection](#-api-endpoints-reference--postman-collection)
8. [Deployment Instructions (Cloud & Free Tier)](#-deployment-instructions-cloud--free-tier)
9. [Key Technical Decisions & Assumptions](#-key-technical-decisions--assumptions)
10. [Known Limitations & Bonus Points](#-known-limitations--bonus-points)

---

## 🏢 Project Overview & Key Business Flows

**APEX OS** is an enterprise-grade Operations Portal built for wholesale, retail, and distributor supply chain management. It addresses the end-to-end operational workflow of a trading business:

- **RBAC Security Guard**: Role-based access control protecting modules across `ADMIN`, `SALES`, `WAREHOUSE`, and `ACCOUNTS` teams.
- **Customer CRM Lifecycle**: Manages leads, active wholesale buyers, distributor networks, follow-up dates, and timestamped customer notes.
- **Inventory Control**: Real-time SKU tracking with minimum stock alerts, warehouse rack locations, and audit logs.
- **Transactional Sales Challan Flow**: Auto-generating sequential sales challans with **historical product snapshot preservation** and **atomic anti-negative stock reduction**.
- **Executive Telemetry Dashboard**: Real-time aggregate revenue, active CRM accounts, low stock warnings, asset valuation, and live audit streams.

---

## 🛠️ Tech Stack Architecture

### Backend
- **Runtime & Framework**: Node.js v20+, Express.js, TypeScript
- **Database Engine**: Direct SQL Driver with **PostgreSQL** (`pg`) and zero-config **SQLite** (`better-sqlite3`) fallback (No ORM abstractions)
- **Security & Auth**: JSON Web Tokens (JWT), Bcrypt password hashing, CORS, input sanitization middleware
- **Architecture**: Clean Layered Architecture (Routes -> Controllers -> Services -> SQL Data Access Engine)

### Frontend
- **Framework**: React 19, TypeScript, Vite
- **Styling & UI**: Executive Glassmorphism & Modern CSS, Lucide Icons
- **HTTP Client**: Axios with automatic JWT Request Interceptor
- **UI Components**: Dynamic Island Header, Bento Cards, Command Launcher, Slide-Over Drawers, Modals, Search Filters, PDF Invoice Export

---

## 🔐 Test User Credentials (All Roles)

All test user accounts are seeded with the default password: **`Password123!`**

| Role | Email | Password | Permissions & Access Scope |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@erp.com` | `Password123!` | Full system administration, user management, CRM, inventory, challans, and analytics |
| **SALES** | `sales@erp.com` | `Password123!` | Customer CRM CRUD, follow-up scheduling, sales challan generation and status updates |
| **WAREHOUSE** | `warehouse@erp.com` | `Password123!` | Product catalog management, stock IN/OUT movement logging, inventory rack tracking |
| **ACCOUNTS** | `accounts@erp.com` | `Password123!` | Read-only financial audit views, sales challan validation, stock asset health monitoring |

---

## 🚀 Local Setup & Quickstart Guide

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 1. Clone & Set Up Backend

```bash
cd backend
npm install

# Seed initial test users, customers, and products using SQL engine
npm run seed

# Start backend server (Runs on http://localhost:5000)
npm run dev
```

### 2. Set Up Frontend

Open a new terminal window:

```bash
cd frontend
npm install

# Start frontend dev server (Runs on http://localhost:5173 or http://localhost:3000)
npm run dev
```

### 3. Automated End-to-End Integration Testing

Run the automated integration test suite to verify atomic stock transactions, anti-negative stock guards, and status transitions:

```bash
cd backend
npm run test
```

---

## 🔑 Environment Variables Management

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=apex_erp_super_secret_jwt_key_2026_production_spec
DATABASE_URL="dev.db"
```

*For PostgreSQL deployments (e.g., Supabase / Neon / Render / AWS RDS):*
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## ⚙️ Core Modules & Business Logic Implementation

### 1. Role-Based Authentication (RBAC)
- Middleware `authMiddleware` verifies JWT tokens in the `Authorization: Bearer <token>` header.
- Middleware `requireRole('ADMIN', 'SALES')` enforces role authorization per endpoint.

### 2. Anti-Negative-Stock Transaction Engine
- When a sales challan is set to `CONFIRMED` or a stock `OUT` movement is logged:
  - System executes inside an atomic SQL transaction (`BEGIN` ... `COMMIT` / `ROLLBACK`).
  - Checks if `currentStock >= requestedQuantity`.
  - If stock is insufficient, throws HTTP `400 Bad Request` specifying available vs requested amounts.
  - Decrements `currentStock` atomically and creates an audit `stock_movements` record.

### 3. Historical Product Snapshot Preservation
- When a Sales Challan is generated, line items store full product snapshots (`productName`, `productSku`, `unitPrice`, `quantity`, `totalPrice`) inside `challan_items`.
- This ensures historical billing integrity even if product names or prices change in the product catalog later.

---

## 📡 API Endpoints Reference & Postman Collection

A pre-configured **`postman_collection.json`** is included in the project root directory.

### Quick API Route Overview

| Module | Method | Endpoint | Access Roles | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login` | Public | Authenticates user & returns JWT token |
| **Auth** | `POST` | `/api/auth/register` | Admin / Public | Creates new user account |
| **Customers**| `GET` | `/api/customers` | All Roles | Lists customers (supports `search`, `status`, `customerType`, `page`) |
| **Customers**| `POST` | `/api/customers` | Admin, Sales | Creates new customer profile |
| **Customers**| `POST` | `/api/customers/:id/follow-up` | Admin, Sales | Adds timestamped follow-up note & updates follow-up date |
| **Products** | `GET` | `/api/products` | All Roles | Lists products with stock status and low-stock filters |
| **Products** | `POST` | `/api/products` | Admin, Warehouse | Adds new product to catalog |
| **Inventory**| `POST` | `/api/stock-movements` | Admin, Warehouse | Logs `IN`/`OUT` stock movement with audit reason |
| **Challans** | `GET` | `/api/challans` | All Roles | Lists sales challans |
| **Challans** | `POST` | `/api/challans` | Admin, Sales | Generates new sales challan (`DRAFT` or `CONFIRMED`) |
| **Challans** | `PATCH`| `/api/challans/:id/status` | Admin, Sales, Warehouse | Updates status (`CONFIRMED`, `CANCELLED`) |
| **Dashboard**| `GET` | `/api/dashboard/stats` | All Roles | Aggregates revenue, stock value, and system telemetry |

---

## 🌐 Deployment Instructions (Cloud & Free Tier)

### 1. Docker & Docker Compose Setup
Run full stack with PostgreSQL database locally or on any cloud server:
```bash
docker-compose up --build -d
```

### 2. Backend Deployment (Render / Railway / Fly.io / AWS)
1. Connect GitHub repository to **Render** or **Railway**.
2. Select Root Directory as `backend`.
3. Build Command: `npm install && npm run build`
4. Start Command: `node dist/server.js`
5. Set Environment Variables (`PORT`, `JWT_SECRET`, `DATABASE_URL`).

### 3. Frontend Deployment (Vercel / Netlify / Render)
1. Import repository to **Vercel** or **Netlify**.
2. Select Root Directory as `frontend`.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Set Environment Variable: `VITE_API_URL=https://your-backend-api.onrender.com/api`

---

## 💡 Key Technical Decisions & Assumptions

1. **Pure SQL Database Engine**: Built without ORM dependencies using direct PostgreSQL (`pg`) pool and SQLite fallback to demonstrate fundamental database query design, indexing, and transactional isolation.
2. **Snapshot-Based Invoicing**: Line item prices and details are snapshot at the time of challan issuance to prevent retroactive price modifications from corrupting past accounting records.
3. **Optimistic UI & Defensive Anti-Negative Stock Guard**: Atomic database transactions guarantee stock integrity even during concurrent order processing.

---

## 🎁 Bonus Features Included
- **Docker & Docker Compose**: Full containerized setup for PostgreSQL + Express + React.
- **GitHub Actions CI Workflow**: Automated build & test execution on commit (`.github/workflows/ci.yml`).
- **Export Invoice / Challan as PDF**: One-click printable PDF invoice generation in the Challan workspace.
- **Product Image URL support**: Upload and display product preview images in the inventory catalog.
