# Scresh — Cooperative Digitalization Platform

Scresh is a multi-tenant cooperative digitalization platform built for the TechnoScape 2026 final. It connects member identity, financing governance, and commodity operations across a network of cooperatives while keeping each tenant's data isolated.

The flagship operational module, **Scresh**, turns vegetable stock into traceable, scannable, finance-ready inventory.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Roles and Permissions](#roles-and-permissions)
- [Database](#database)
- [Demo Accounts](#demo-accounts)
- [AI Freshness Scan](#ai-freshness-scan)
- [Testing](#testing)
- [Deployment Notes](#deployment-notes)

---

## Overview

The platform is built around three demo-ready scenarios:

1. **Scenario A — Financing:** Members apply for financing; credit officers assess risk and submit applications; managers approve or reject them.
2. **Scenario C — Scresh Operations:** Staff register vegetable batches, run AI freshness scans, move stock, and prioritize distribution based on grade and shelf life.
3. **Scenario E — Audit & Governance:** Supervisors review flagged loan changes, audit trails, and version histories with masked member data.

Each role sees a tailored mobile-first dashboard. Tenant isolation is enforced at the application and database layers.

---

## Key Features

- **Multi-tenant architecture** with cooperative registration, module activation, and tenant-scoped data.
- **Role-based access control** for staff, credit officers, managers, supervisors, partners, and admins.
- **Scresh module:**
  - Batch registration with weight reconciliation.
  - AI-powered freshness scan with animated segmentation overlay.
  - Grade A/B/C/D classification, confidence score, and shelf-life estimate.
  - Stock movements and distribution priority.
- **Credit workflow:**
  - Credit officer submissions.
  - Manager approval/rejection table.
  - Loan version history and audit logs.
- **Supervisor audit dashboard** with anomaly flags and masked audit trails.
- **Admin user list** for platform oversight.

---

## Tech Stack

### Frontend

![Next.js](https://img.shields.io/badge/Next.js_16-000000?logo=next.js&logoColor=white&style=for-the-badge)
![React](https://img.shields.io/badge/React_19-20232A?logo=react&logoColor=61DAFB&style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=for-the-badge)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?logo=tailwind-css&logoColor=white&style=for-the-badge)

### Backend & Runtime

![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white&style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white&style=for-the-badge)
![jose](https://img.shields.io/badge/JWT_(jose)-000000?logo=jsonwebtokens&logoColor=white&style=for-the-badge)
![bcryptjs](https://img.shields.io/badge/bcryptjs-3178C6?style=for-the-badge)

### Database

![PostgreSQL](https://img.shields.io/badge/PostgreSQL_14+-4169E1?logo=postgresql&logoColor=white&style=for-the-badge)
![pg](https://img.shields.io/badge/pg_(native)-4169E1?logo=postgresql&logoColor=white&style=for-the-badge)

### AI & External Services

![FastAPI](https://img.shields.io/badge/FastAPI_AI_Service-009688?logo=fastapi&logoColor=white&style=for-the-badge)

### Testing

![Bun Test](https://img.shields.io/badge/Bun_Test_Runner-f9f1d8?logo=bun&logoColor=000000&style=for-the-badge)

---

## Prerequisites

- [Bun](https://bun.sh) (recommended) or Node.js 20+
- PostgreSQL 14+ running locally or via Docker
- (Optional) Access to the AI inference service for the freshness scan feature

---

## Getting Started

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Scresh
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env` (or edit the provided `.env`) and set:

   ```env
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/scresh
   SESSION_SECRET=replace-with-at-least-32-random-characters
   SESSION_COOKIE_NAME=scresh_session
   AI_SERVICE_URL=http://your-ai-service-url
   AI_SERVICE_TOKEN=your-ai-service-token
   ```

4. **Create the database**

   ```bash
   createdb scresh
   ```

5. **Run migrations and seed data**

   ```bash
   bun run db:migrate
   bun run db:seed
   ```

6. **Start the development server**

   ```bash
   bun dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) and log in with one of the demo accounts below.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `SESSION_SECRET` | Yes | Secret used to sign session cookies. Must be at least 32 characters in production. |
| `SESSION_COOKIE_NAME` | Yes | Name of the session cookie. |
| `AI_SERVICE_URL` | Yes* | Base URL of the external AI inference service. |
| `AI_SERVICE_TOKEN` | Yes* | Bearer token for the AI inference service. |
| `AI_SERVICE_TIMEOUT_MS` | No | Request timeout for AI inference. Defaults to `120000`. |
| `NODE_ENV` | No | Set to `production` for production builds. |

*Required only if using the AI freshness scan feature.

---

## Project Structure

```text
Scresh/
├── app/                    # Next.js App Router pages, grouped by role
│   ├── (auth)/             # Login and registration
│   ├── (staff)/            # Staff warehouse operations (Scresh scan, batches, movements)
│   ├── (credit)/           # Credit officer dashboard
│   ├── (manager)/          # Manager dashboard and approvals
│   ├── (supervisor)/       # Supervisor audit dashboard
│   ├── (partner)/          # Financing partner portal (stub)
│   ├── (admin)/            # Admin user list
│   └── api/                # API routes
├── components/             # Shared React components
├── lib/
│   ├── auth/               # Authentication DAL and session helpers
│   ├── domain/             # Domain types: roles, permissions, RBAC
│   └── server/
│       ├── db/             # PostgreSQL client
│       ├── repositories/   # Data access layer
│       └── services/       # Business logic and service container
├── db/
│   ├── schema.sql          # Database schema
│   └── seed.sql            # Demo seed data for all scenarios
├── scripts/
│   └── db.mjs              # CLI helper for migrate/seed/reset
├── reference/              # PRD, design docs, and planning artifacts
└── docs/                   # Generated specs and plans
```

---

## Roles and Permissions

| Role | Home | Primary Capabilities |
|------|------|----------------------|
| `staff` | `/staff` | Scan freshness, register batches, move stock, create reservations. |
| `credit` | `/credit` | View member profiles, assess credit risk, submit loan applications. |
| `manager` | `/manager` | Approve loans and stock corrections, view operational dashboards. |
| `supervisor` | `/supervisor` | Read audit trails and anomaly dashboards with masked PII. |
| `partner` | `/partner` | View filtered portfolio summaries (currently a stub). |
| `admin` | `/admin` | List users and manage platform-wide access. |

Permission checks are enforced at the route level via `requireRole` and at the data layer via tenant-scoped repositories.

---

## Database

The PostgreSQL schema is defined in `db/schema.sql`. It includes tables for:

- `tenants` and `tenant_modules`
- `users`, `user_roles`, and `sessions`
- `members`
- `loans`, `loan_versions`, `loan_change_requests`
- `scresh_batches`, `scresh_movements`
- `partner_portfolio_reports`
- `audit_logs`, `audit_anomalies`

### Useful commands

```bash
# Apply schema
bun run db:migrate

# Seed demo data
bun run db:seed

# Reset schema + seed
bun run db:reset
```

The seed file (`db/seed.sql`) provides demo data for all three judging scenarios, including 100 financing loans, 100 Scresh batches, and 100 audit records per scenario.

---

## Demo Accounts

All seeded accounts share the password:

```text
Password123
```

| Email | Role | Tenant |
|-------|------|--------|
| `siti.melati@koperasi.id` | Staff | Koperasi Melati Jaya |
| `rani.melati@koperasi.id` | Credit Officer | Koperasi Melati Jaya |
| `budi.melati@koperasi.id` | Manager | Koperasi Melati Jaya |
| `dina.supervisor@koperasi.id` | Supervisor | Koperasi Melati Jaya |
| `admin.melati@koperasi.id` | Admin | Koperasi Melati Jaya |
| `petugas.lembang@koperasi.id` | Staff | Koperasi Sayur Segar Lembang |

---

## AI Freshness Scan

The Scresh scan flow sends the captured image to an external FastAPI inference service that returns:

- Segmentation mask or overlay
- Freshness grade (A/B/C/D)
- Confidence score
- Estimated shelf life
- Recommended action

When a transparent PNG mask is returned, the UI renders an animated sparkle effect clipped to the detected produce area.

---

## Testing

```bash
# Run all tests
bun test

# Run scan module tests only
bun test app/\(staff\)/staff/scan
```

---

## Deployment Notes

- Set `NODE_ENV=production` and a strong `SESSION_SECRET`.
- Use a managed PostgreSQL instance and ensure `DATABASE_URL` is set.
- Deploy the AI inference service separately and configure `AI_SERVICE_URL` + `AI_SERVICE_TOKEN`.
- Run `bun run build` to verify the production build before deploying.
- Run `bun run db:migrate` and `bun run db:seed` on the production database before first use.

---

Built for the TechnoScape 2026 final demo.
