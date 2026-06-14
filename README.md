<<<<<<< HEAD
# EcoRefund AI — Production-Grade Multi-Tenant SaaS Platform

> **Waste Deposit, QR Tracking & Refund Platform for Zoos, Hospitals, Malls, Airports, Railways, Stadiums & Smart Cities**

---

## Table of Contents
1. [Architecture Overview](#architecture)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Design](#database-design)
5. [User Roles & Permissions](#roles)
6. [QR Workflow](#qr-workflow)
7. [Staff Login Control Feature](#staff-login-control)
8. [Quick Start](#quick-start)
9. [API Reference](#api)
10. [Security Checklist](#security)
11. [Deployment Guide](#deployment)

---

## Architecture Overview <a name="architecture"></a>

```
┌─────────────────────────────────────────────────────────┐
│                    EcoRefund AI                          │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌────────────┐ │
│  │   React UI   │───▶│  ASP.NET 8   │───▶│ SQL Server │ │
│  │  TypeScript  │    │  Web API     │    │  (EF Core) │ │
│  │  Material UI │    │  Clean Arch  │    │            │ │
│  └──────────────┘    │  CQRS/MediatR│    └────────────┘ │
│                      └──────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

**Clean Architecture Layers:**
```
Domain ──▶ Application ──▶ Infrastructure ──▶ API
 (core)     (use cases)      (data/services)   (presentation)
```

**Multi-Tenant Isolation:**
Every database table has `OrganizationId`. A Mysuru Zoo user **can never** see Apollo Hospital data — enforced at the API and EF query filter level.

---

## Tech Stack <a name="tech-stack"></a>

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Material UI |
| State | Redux Toolkit |
| Backend | ASP.NET Core 8 Web API |
| Pattern | Clean Architecture + CQRS + MediatR |
| ORM | Entity Framework Core 8 |
| Database | SQL Server 2022 |
| Auth | JWT + Refresh Tokens (BCrypt passwords) |
| QR | QRCoder |
| Reports | ClosedXML (Excel) + QuestPDF (PDF) |
| Container | Docker + docker-compose |

---

## Project Structure <a name="project-structure"></a>

```
QR_Waste_Management_System/
├── backend/
│   ├── EcoRefund.sln
│   └── src/
│       ├── EcoRefund.Domain/           # Entities, Enums
│       │   ├── Entities/
│       │   │   ├── Organization.cs     # Multi-tenant anchor
│       │   │   ├── User.cs             # IsLoginEnabled flag
│       │   │   ├── QrCode.cs           # QR lifecycle
│       │   │   ├── Item.cs             # Registered items
│       │   │   ├── Deposit.cs          # Collected deposits
│       │   │   ├── Refund.cs           # Processed refunds
│       │   │   ├── ScanAttempt.cs      # Fraud tracking
│       │   │   └── AuditLog.cs         # Full audit trail
│       │   └── Enums/
│       │       ├── UserRole.cs         # 6 roles
│       │       ├── QrStatus.cs         # Generated→Refunded→Invalid
│       │       └── ...
│       ├── EcoRefund.Application/      # CQRS Use Cases
│       │   ├── Features/
│       │   │   ├── Auth/               # Login + RefreshToken
│       │   │   ├── Organizations/      # Register org
│       │   │   ├── Users/              # CreateUser + ToggleAccess
│       │   │   ├── QrCodes/            # GenerateQr + ScanQr
│       │   │   └── Refunds/            # ProcessRefund
│       │   └── Common/
│       │       ├── Interfaces/         # IJwtService, IQrService...
│       │       └── Models/             # Result<T>, PagedResult<T>
│       ├── EcoRefund.Infrastructure/   # Concrete Implementations
│       │   ├── Persistence/
│       │   │   ├── ApplicationDbContext.cs
│       │   │   └── Configurations/     # EF Fluent API configs
│       │   └── Services/
│       │       ├── JwtService.cs
│       │       ├── QrService.cs        # QR generation + PDF labels
│       │       ├── PasswordService.cs  # BCrypt
│       │       └── AuditService.cs
│       └── EcoRefund.API/             # Controllers + Middleware
│           ├── Controllers/
│           │   ├── AuthController.cs
│           │   ├── OrganizationsController.cs
│           │   ├── UsersController.cs   # Staff login toggle
│           │   ├── QrCodesController.cs
│           │   ├── RefundsController.cs
│           │   ├── LocationsController.cs
│           │   └── ReportsController.cs # Excel/PDF exports
│           ├── Middleware/
│           │   └── ErrorHandlingMiddleware.cs
│           └── Program.cs
│
├── frontend/
│   └── ecorefund-ui/
│       └── src/
│           ├── api/                    # Axios API clients
│           ├── store/                  # Redux state
│           ├── hooks/                  # useAuth, usePermissions
│           ├── pages/
│           │   ├── Landing.tsx         # Public landing
│           │   ├── Login.tsx           # Role selector + login
│           │   ├── Register.tsx        # Org registration
│           │   ├── super-admin/
│           │   ├── org-admin/
│           │   │   └── StaffAccessControl.tsx  ← KEY FEATURE
│           │   ├── entry-staff/
│           │   │   └── GenerateQr.tsx
│           │   ├── exit-staff/
│           │   │   └── ScanAndRefund.tsx
│           │   └── dashboards/
│           └── components/
│               └── common/
│                   ├── AppLayout.tsx   # Sidebar + TopBar
│                   └── ProtectedRoute.tsx
│
├── database/
│   ├── 01_CreateDatabase.sql          # All tables + indexes
│   └── 02_SeedData.sql                # Initial seed data
│
├── docker-compose.yml
└── README.md
```

---

## Database Design <a name="database-design"></a>

### Core Tables

```sql
Organizations     -- Multi-tenant anchor (IsLoginEnabled for org-wide block)
Users             -- All roles; IsLoginEnabled = admin can disable staff login
Locations         -- Entry/Exit gates, branches per org
ItemTypes         -- Plastic Bottle, Can, etc. per org
Items             -- Registered items with QR association
QrCodes           -- QR lifecycle: Generated→Active→Refunded→INVALID
Deposits          -- Collected deposit records
Refunds           -- Processed refund records
ScanAttempts      -- Every scan logged (fraud detection)
AuditLogs         -- Complete audit trail
```

### ER Relationships
```
Organization ─┬─▶ Users (many)
              ├─▶ Locations (many)
              ├─▶ ItemTypes (many)
              ├─▶ Items (many)
              └─▶ QrCodes (many)

Item ──────── 1-to-1 ──▶ QrCode
Item ──────── 1-to-1 ──▶ Deposit
Item ──────── 1-to-1 ──▶ Refund
QrCode ────── 1-to-many ──▶ ScanAttempts
```

---

## User Roles & Permissions <a name="roles"></a>

| Role | Value | Capabilities |
|------|-------|-------------|
| **Super Admin** | 1 | Everything — all orgs, suspend orgs, disable org login |
| **Org Admin** | 2 | Full org control, create staff, **toggle staff login** |
| **Manager** | 3 | Generate QR, scan QR, view reports |
| **Entry Staff** | 4 | Generate QR codes, collect deposits |
| **Exit Staff** | 5 | Scan QR codes, process refunds |
| **Auditor** | 6 | View all logs, export reports (read-only) |

---

## QR Lifecycle <a name="qr-workflow"></a>

```
GENERATED
    │
    ▼
 ACTIVE  ←── (QR label printed & attached to item)
    │
    ▼ (Exit Staff scans)
 [Validate]
    │
    ├── Already Refunded? ──▶ "QR ALREADY REDEEMED" (blocked)
    ├── Wrong Org?        ──▶ "Wrong Organization" (blocked)
    ├── Expired?          ──▶ "QR Expired" (blocked)
    └── Valid             ──▶ REFUNDED → status = INVALID
                                         (future scans blocked forever)
```

**Fraud Prevention:**
- Every scan attempt is logged in `ScanAttempts`
- QR status set to `Refunded/Invalid` immediately after processing
- Cross-organization QR scans are blocked at handler level
- Failed login attempts tracked with 15-minute lockout after 5 failures

---

## Staff Login Control Feature <a name="staff-login-control"></a>

This is the key "Admin advantage" feature.

### How it works:

**Org Admin** can go to `Staff Access Control` page and toggle any staff member's login access:

```
[Staff Member]        [Role]         [Login Access]
Ravi Kumar           Entry Staff    ✅ Toggle ON/OFF
Priya Sharma         Exit Staff     ✅ Toggle ON/OFF  ← Admin controls this
Suresh Babu          Auditor        ✅ Toggle ON/OFF
```

**When disabled:**
- Staff sees: `"Login access has been disabled for your account. Please contact your Organization Admin."`
- Account is NOT deleted, data is preserved
- Admin can re-enable at any time

**API:**
```http
PATCH /api/v1/users/{id}/toggle-login
Authorization: Bearer {OrgAdminToken}
Body: { "isLoginEnabled": false, "reason": "Staff on leave" }
```

**Who can toggle what:**
| Actor | Target |
|-------|--------|
| SuperAdmin | Any user (except themselves) |
| OrgAdmin | Any staff in their org (NOT other admins) |

---

## Quick Start <a name="quick-start"></a>

### Prerequisites
- .NET 8 SDK
- Node.js 20+
- SQL Server 2022 or LocalDB
- Docker (optional)

### Option 1: Docker (One Command — Recommended for friends)

**Requirements:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

```bash
# 1. Clone the repository
git clone <repo-url>
cd QR_Waste_Management_System

# 2. Start everything (DB + API + Frontend) with one command
docker-compose up --build

# 3. Wait ~2 minutes for SQL Server to initialize on first run
#    You'll see: "Super Admin seeded: superadmin@ecorefund.ai"
```

**URLs after startup:**

| Service | URL |
|---------|-----|
| Web App (Frontend) | http://localhost:3000 |
| API (Swagger UI)   | http://localhost:5100/swagger |
| SQL Server (SSMS)  | localhost,1433  · SA / EcoRefund@2024! |

**To stop:**
```bash
docker-compose down          # stop containers
docker-compose down -v       # stop + delete database (fresh start)
```

---

### Option 2: Run Locally (Without Docker)

**Requirements:** .NET 8 SDK, Node.js 20+, SQL Server 2022 / LocalDB

**Backend:**
```bash
cd backend/src/EcoRefund.API
dotnet run
# Runs on http://localhost:5100
# Auto-creates all tables + seeds SuperAdmin on first run
```

**Frontend (new terminal):**
```bash
cd frontend/ecorefund-ui
npm install
npm start
# Runs on http://localhost:5173
```

---

### Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@ecorefund.ai | SuperAdmin@123 |

> After login, register an organization at `/register`, then create staff via **Staff Management** in the sidebar.

---

## API Reference <a name="api"></a>

Base URL: `https://localhost:7001/api/v1`

### Authentication
```http
POST /auth/login
Body: { "email": "...", "password": "...", "role": 2 }

POST /auth/refresh-token
Body: { "accessToken": "...", "refreshToken": "..." }
```

### Organization
```http
POST   /organizations/register          (Public)
GET    /organizations                   (SuperAdmin)
GET    /organizations/{id}/dashboard    (OrgAdmin)
PATCH  /organizations/{id}/toggle-login (SuperAdmin)
```

### Users & Staff Control
```http
POST   /users                           (OrgAdmin creates staff)
GET    /users                           (OrgAdmin views staff)
PATCH  /users/{id}/toggle-login         (OrgAdmin/SuperAdmin)
GET    /users/login-status              (OrgAdmin - access control view)
POST   /users/{id}/reset-password       (OrgAdmin/SuperAdmin)
```

### QR Operations
```http
POST   /qrcodes/generate                (EntryStaff)
POST   /qrcodes/scan                    (ExitStaff)
GET    /qrcodes/{id}/print              (PDF label download)
GET    /qrcodes                         (History)
```

### Refunds
```http
POST   /refunds/process                 (ExitStaff)
GET    /refunds                         (Reports)
GET    /refunds/summary                 (Statistics)
```

### Reports (Excel Export)
```http
GET    /reports/refunds/excel?from=2024-01-01&to=2024-12-31
GET    /reports/deposits/excel
GET    /reports/audit/excel
```

---

## Security Checklist <a name="security"></a>

- [x] JWT with 8-hour expiry + 7-day refresh tokens
- [x] BCrypt password hashing (cost factor 12)
- [x] Role-based authorization on every endpoint
- [x] Tenant isolation — `OrganizationId` enforced in every query
- [x] Cross-tenant QR scan blocked at handler level
- [x] QR immediately invalidated after refund (no double-spend)
- [x] All scan attempts logged (fraud detection)
- [x] Account lockout after 5 failed attempts (15 min)
- [x] Admin can disable staff login without deleting account
- [x] Complete audit trail for all operations
- [x] Global error handling middleware
- [x] CORS configured for specific origins
- [x] SQL injection prevented via EF Core parameterized queries
- [x] Input validation with FluentValidation
- [x] Soft deletes (IsDeleted flag) — no hard data removal

---

## Deployment Guide <a name="deployment"></a>

### Azure App Service
```bash
# Backend
az webapp create --name ecorefund-api --plan MyPlan --runtime "DOTNET|8.0"
az webapp deployment source config-zip --name ecorefund-api --src publish.zip

# Frontend (Static Web Apps)
az staticwebapp create --name ecorefund-ui --source ./frontend/ecorefund-ui/dist
```

### IIS (Windows Server)
1. Build: `dotnet publish -c Release -o ./publish`
2. Create IIS site pointing to `./publish`
3. Install ASP.NET Core Hosting Bundle
4. Update `appsettings.json` with production connection string and JWT key

### Environment Variables (Production)
```
ConnectionStrings__DefaultConnection=Server=...
Jwt__SecretKey=<minimum-32-char-random-key>
Jwt__Issuer=EcoRefundAI
Jwt__Audience=EcoRefundAI
AllowedOrigins=https://yourdomain.com
```

---

## Organization Types Supported

Zoo, Museum, Cinema Hall, Hospital, College, Stadium, Airport, Railway Station, Mall, Amusement Park, Event Organizer, Smart City, Government, Other

## Item Types (Default per Org)

Plastic Bottle (₹20), Plastic Bag (₹10), Food Container (₹30), Can (₹15), Glass Bottle (₹25), Custom Items

## Refund Methods

Cash, UPI, Coupon Code, Digital Wallet, Bank Transfer

---

*Built with Clean Architecture · CQRS · Multi-Tenant SaaS · JWT Security · QR Fraud Prevention*
=======
# EcoRefund
Transforming plastic waste management through QR technology for efficient tracking, collection, and recycling.
>>>>>>> 081b54ca6045455674807b122564f62d91a436c6
