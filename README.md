# NEO EMS — Employee Management System

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Monorepo-Turborepo-ef4444?logo=turborepo)](https://turbo.build/)
[![NestJS](https://img.shields.io/badge/Backend-NestJS%2010-ea2845?logo=nestjs)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014%20App%20Router-black?logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016-336791?logo=postgresql)](https://www.postgresql.org/)
[![BullMQ](https://img.shields.io/badge/Workers-BullMQ%20+%20Redis%207-dc2626?logo=redis)](https://bullmq.io/)
[![Docker](https://img.shields.io/badge/Containers-Docker%20Compose-2496ed?logo=docker)](https://www.docker.com/)

An enterprise-grade, production-ready Employee Management System architected as a TypeScript monorepo using **pnpm workspaces** and **Turborepo**.

---

## 🚀 Live Demo on Google Cloud Run

The application is deployed and actively serving production traffic on **Google Cloud Run**:

- **Live Application**: [https://ndems-app-knbmj7xqka-uc.a.run.app](https://ndems-app-knbmj7xqka-uc.a.run.app)
- **Login Portal**: [https://ndems-app-knbmj7xqka-uc.a.run.app/login](https://ndems-app-knbmj7xqka-uc.a.run.app/login)
- **Regional Service URL**: [https://ndems-app-479560345714.us-central1.run.app](https://ndems-app-479560345714.us-central1.run.app)
- **REST API Base**: [https://ndems-app-knbmj7xqka-uc.a.run.app/api/v1](https://ndems-app-knbmj7xqka-uc.a.run.app/api/v1)

### Quick Demo Accounts (Password: `Password123!`)
- 👑 **Super Admin**: `superadmin@ems.local`
- 📋 **HR Manager**: `hradmin@ems.local`
- 👔 **Manager (Shahriar Rahman)**: `manager@ems.local`
- 💻 **Employee (Sadia Rahman)**: `sadia.rahman@ems.local`

## 🏛️ System Architecture

```
                                  +---------------------------------------+
                                  |         Next.js App Router            |
                                  |     (Tailwind CSS, Modern UI,         |
                                  |   RBAC Auth Context, Charts)           |
                                  +-------------------+-------------------+
                                                      |
                                          HTTP / REST | /api/v1
                                                      v
+-----------------------+         +-------------------+-------------------+         +-----------------------+
|                       |         |       NestJS API Gateway & Core       |         |                       |
|   PostgreSQL 16       |<------->| (Global Prefix /api/v1, Swagger,      |<------->|    MinIO Object S3    |
|  (with Relational     | Prisma  |  RBAC/PBAC Guards, Argon2/Bcrypt,     | S3 SDK  | (Documents, Resumes,  |
|   Tables)             |         |  Audit Logs, Decimal Payroll)         |         |  Avatars, Policies)   |
|                       |         +-------------------+-------------------+         |                       |
+-----------------------+                             |                             +-----------------------+
                                          BullMQ / Redis |
                                                      v
+-----------------------+         +-------------------+-------------------+
|                       |         |          BullMQ Worker                |
|        Redis 7        |<------->| (Async Payroll Runs, Notifications,   |
| (Cache, Rate Limiter, |         |  Audit Offloading, Graceful Shutdown) |
|  BullMQ Job Queues)   |         |                                       |
+-----------------------+         +---------------------------------------+
```

---

## 🚀 Key Modules & Capabilities

1. **Authentication & Authorization (Phase 2)**:
   - Argon2 / PBKDF2 password hashing with salt.
   - Dual-token lifecycle: Short-lived JWT Access Tokens (15m) + Long-lived Cryptographic Refresh Tokens (7d).
   - Refresh token rotation with compromised family reuse detection.
   - Role-Based Access Control (RBAC) & Permission-Based Access Control (PBAC).
   - Rate limiting via `@nestjs/throttler` and comprehensive Login Audit logging.

2. **Employee & Organizational Structures (Phase 3)**:
   - Hierarchical departments and multilevel designations.
   - Employee records with auto-generated sequential numbers (`EMP-YYYY-XXXX`).
   - Manager-subordinate reporting hierarchies.
   - Multi-attribute search, filtering, and pagination.
   - Career history tracking and immutable audit trails with before/after state diffs.

3. **Attendance & Leave Management (Phase 4)**:
   - Daily interactive Clock-In / Clock-Out widget with live working hours tracking.
   - Shift grace periods with automatic late arrival and half-day status computation.
   - Transaction-safe leave booking with atomic balance reservations.
   - Manager approval workflows and holiday calendar synchronization.

4. **Payroll & Performance (Phase 5)**:
   - Salary structures with percentage and fixed earnings and deductions.
   - Decimal-safe monetary arithmetic avoiding floating-point rounding discrepancies.
   - Idempotent monthly payroll run generation preventing duplicate disbursements.
   - Itemized payslips with access control enforcement.
   - Bi-annual performance review cycles, OKRs, goal tracking, and 360 feedback.

5. **DevOps, Observability & Production (Phase 6)**:
   - Multi-stage Dockerfiles with non-root security execution (`node`).
   - Production Docker Compose with Nginx reverse proxy.
   - Declarative Kubernetes manifests (Deployments, Services, HPA, PDB, Ingress).
   - GitHub Actions CI/CD workflows for linting, testing, Docker builds, and deployments.
   - Prometheus metrics endpoint and backup/restore scripts.

---

## ⚡ Quickstart Guide

### Prerequisites
- **Node.js**: >= 20.0.0
- **pnpm**: >= 9.0.0 (`npm install -g pnpm`)
- **Docker & Docker Compose** (for local PostgreSQL, Redis, and MinIO)

### 1. Clone & Install Dependencies
```bash
git clone <repo-url> ems
cd ems
pnpm install
```

*(On Windows PowerShell, use `pnpm.cmd install`)*

### 2. Configure Environment
```bash
cp .env.example .env
```
The default `.env` is already configured for local Docker development with zero external paid API keys required.

### 3. Launch Development Infrastructure
Start PostgreSQL, Redis 7, MinIO, and pgAdmin:
```bash
pnpm docker:dev:up
```

### 4. Setup Database Schema & Seed Data
Generate Prisma Client and seed the database with demo accounts:
```bash
pnpm --filter @ems/database db:generate
pnpm --filter @ems/database db:push
pnpm --filter @ems/database db:seed
```

### 5. Start Development Servers
Run the full monorepo concurrently:
```bash
pnpm dev
```
- **Web Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)
- **OpenAPI / Swagger Docs**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- **MinIO Console**: [http://localhost:9001](http://localhost:9001) (User: `minio_admin` / `minio_secure_password_123!`)
- **pgAdmin**: [http://localhost:5050](http://localhost:5050) (User: `admin@ems.local` / `admin_password_123!`)

---

## 🔑 Pre-Seeded Demo Accounts

All demo accounts use password: `Password123!`

| Role | Email | Permissions Scope |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@ems.local` | Universal access, audit logs, system configurations |
| **HR Admin** | `hradmin@ems.local` | HR Manager: Employee CRUD, departments, leave management, payroll runs |
| **Manager** | `manager@ems.local` | Shahriar Rahman: Team timesheet review, leave approvals, performance reviews |
| **Employee** | `sadia.rahman@ems.local` | Sadia Rahman: Clock in/out, view payslips, request leaves, performance tracking |

---

## 🧪 Testing & Verification

Run the test suite across all monorepo packages:
```bash
# Run unit and integration tests
pnpm test

# Run tests with code coverage
pnpm test:cov

# Typecheck TypeScript across all packages
pnpm typecheck

# Lint check
pnpm lint
```

---

## 🚢 Production Deployment Checklist

1. [ ] **Secrets Rotation**: Generate unique 64-char keys for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (`openssl rand -base64 48`).
2. [ ] **Database Setup**: Deploy managed PostgreSQL (AWS RDS / GCP Cloud SQL).
3. [ ] **Object Storage**: Point `S3_ENDPOINT` to AWS S3 or Google Cloud Storage with IAM bucket access policies.
4. [ ] **Database Migrations**: Run `pnpm --filter @ems/database prisma migrate deploy` in the deployment pipeline.
6. [ ] **Container Security**: Ensure images are built with non-root user (`node`).
7. [ ] **Kubernetes Ingress**: Configure TLS certificates via cert-manager and domain DNS records.
8. [ ] **Monitoring**: Verify Prometheus scrape endpoints (`/api/v1/health/liveness`) and configure alert thresholds.
