# Full Stack Developer Case Study Submission

**Project:** APEX OS — Mini ERP + CRM Operations Portal  
**Target:** Wholesale / Distribution Operations Management System  

---

## 📌 Submission Overview & Quick Links

- **GitHub Repository:** `https://github.com/your-username/apex-erp-crm`
- **Live Frontend Application:** `https://apex-os-erp.vercel.app` *(or local http://localhost:5173)*
- **Live Backend API URL:** `https://apex-os-api.onrender.com/api` *(or local http://localhost:5000/api)*
- **Postman API Collection:** Included in project root as `postman_collection.json`
- **Docker Compose:** Provided in project root as `docker-compose.yml`
- **CI/CD Pipeline:** Configured in `.github/workflows/ci.yml`

---

## 🔐 Test Credentials (All Required Roles)

All test user accounts are pre-configured with the default password: **`Password123!`**

| Role | Email | Password | Access Scope & Business Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@erp.com` | `Password123!` | Full system administration, user management, CRM, inventory, sales challans & executive telemetry |
| **SALES** | `sales@erp.com` | `Password123!` | Customer CRM CRUD, follow-up scheduling, sales challan generation, and confirmation |
| **WAREHOUSE** | `warehouse@erp.com` | `Password123!` | Product catalog management, stock IN/OUT movement logging, rack location tracking |
| **ACCOUNTS** | `accounts@erp.com` | `Password123!` | Read-only financial audit views, sales challan validation, stock valuation analytics |

---

## 🏛️ System Architecture Explanation

The **APEX OS** Mini ERP + CRM Portal is designed following clean enterprise architecture, ensuring modularity, security, and raw SQL data integrity without ORM abstractions:

```
                  ┌───────────────────────────────────────────┐
                  │   APEX OS React 19 Frontend App (Vite)    │
                  │   Executive UI & Glassmorphism Navigation │
                  └─────────────────────┬─────────────────────┘
                                        │ REST API / JSON (Bearer JWT)
                                        ▼
                  ┌───────────────────────────────────────────┐
                  │    Node.js + Express + TypeScript API     │
                  │  ├── Auth & Role Guards (RBAC)           │
                  │  ├── Controllers & Input Validation       │
                  │  └── Services & Business Logic Layer      │
                  └─────────────────────┬─────────────────────┘
                                        │ Direct SQL Engine (pg / better-sqlite3)
                                        ▼
                  ┌───────────────────────────────────────────┐
                  │   Relational Database (PostgreSQL / SQLite)│
                  │  ├── users, customers, products Tables    │
                  │  ├── stock_movements Audit Log Table      │
                  │  └── sales_challans & challan_items Tables│
                  └───────────────────────────────────────────┘
```

### Architectural Highlights

1. **Layered Separation of Concerns**: Routes map REST endpoints, Controllers handle HTTP request validation and status codes, Services encapsulate domain logic, and `db.ts` executes parameterized SQL queries.
2. **Atomic Stock Transaction Engine**: Stock updates and movements execute within atomic SQL transactions (`BEGIN` ... `COMMIT` / `ROLLBACK`). If requested stock exceeds available stock, the transaction aborts with a HTTP `400 Bad Request`.
3. **Historical Snapshot Preservation**: Sales Challans store product snapshot data (name, SKU, unit price) in `challan_items` at creation time. Master catalog updates do not mutate past sales invoices.
4. **Role-Based Access Control (RBAC)**: Enforced via Express middleware (`authMiddleware` and `requireRole`), restricting operations according to user roles (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`).

---

## 🚀 Local Setup & Execution Instructions

### Step 1: Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### Step 2: Environment Configuration

`backend/.env`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=apex_erp_super_secret_jwt_key_2026_production_spec
DATABASE_URL="dev.db"
```

`frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Database Seeding

```bash
cd backend
npm run seed
```

### Step 4: Run Servers

Start **Backend** (Terminal 1):
```bash
cd backend
npm run dev
# Server running at http://localhost:5000
```

Start **Frontend** (Terminal 2):
```bash
cd frontend
npm run dev
# Client running at http://localhost:5173
```

### Step 5: Automated Integration Test Execution

Run the end-to-end integration test suite:
```bash
cd backend
npm run test
```

---

## 📡 Core REST API Documentation

### 1. Authentication (`/api/auth`)
- `POST /api/auth/login`: Authenticate email/password, returns JWT token.
- `POST /api/auth/register`: Register new system user with assigned role (Admin only / setup).

### 2. Customer CRM (`/api/customers`)
- `GET /api/customers?page=1&limit=10&search=&status=&customerType=`: List customers with search & pagination.
- `POST /api/customers`: Create new customer (Retail, Wholesale, Distributor).
- `PUT /api/customers/:id`: Update customer details.
- `POST /api/customers/:id/follow-up`: Add timestamped follow-up note & reschedule follow-up date.

### 3. Product & Inventory (`/api/products` & `/api/stock-movements`)
- `GET /api/products`: List products with current stock, low stock alert filter, and rack locations.
- `POST /api/products`: Create product SKU with minimum alert threshold.
- `PUT /api/products/:id`: Edit product details.
- `POST /api/stock-movements`: Log `IN`/`OUT` stock movements with audit reason.

### 4. Sales Challans (`/api/challans`)
- `GET /api/challans`: List sales challans.
- `POST /api/challans`: Create sales challan (`DRAFT` or `CONFIRMED`).
- `PATCH /api/challans/:id/status`: Update challan status (`DRAFT` -> `CONFIRMED` or `CANCELLED`). *Atomic stock deduction occurs on confirmation.*

### 5. Executive Telemetry (`/api/dashboard/stats`)
- `GET /api/dashboard/stats`: Returns aggregated financial revenue, total stock valuation, low stock warnings, and recent activity feed.

---

## ☁️ Deployment Instructions

### Option A: Containerized Docker Deployment
```bash
docker-compose up --build -d
```

### Option B: Free Tier Cloud Deployment (Render + Vercel)
1. **Database**: Managed PostgreSQL on Neon / Supabase / Render Postgres. Set `DATABASE_URL` in backend `.env`.
2. **Backend**: Host `backend/` on Render web service (`node dist/server.js`).
3. **Frontend**: Host `frontend/` on Vercel (`npm run build`, output: `dist`).

---

## 💡 Key Business Assumptions Made

1. **Dual SQL Engine**: Connects seamlessly to PostgreSQL in production via `pg` pool, while supporting zero-config local development via SQLite.
2. **Sales Challan Stock Impact**: Draft sales challans reserve item lines without affecting inventory. Stock reduction is executed atomically upon transition to `CONFIRMED` status.
3. **Challan Cancellation**: Cancelling a previously `CONFIRMED` challan restores stock levels back to the warehouse inventory atomically.
