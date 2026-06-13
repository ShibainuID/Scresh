# Product Requirements Document — 30-Hour Hackathon Build

**Project:** Modular Cooperative Digitalization Platform
**Event:** TechnoScape 2026 — Babak Final
**Build window:** 30 hours
**Document type:** Demo-focused PRD

---

## 1. Project Brief

A multi-tenant cooperative digitalization platform operated by a software company, serving many cooperatives with different business focuses through one shared infrastructure with strict data isolation between tenants.

The platform has two layers:

- **Centralized Core** — owned by the platform. Handles tenant & module registry, multi-level RBAC, immutable platform-wide audit trail, cross-cooperative member credit profiles, loan application & approval workflows, a government portal, and a financing partner portal.
- **Operational Modules** — adopted per cooperative based on its commodity. The flagship module built for this hackathon is **Scresh**, the vegetable cooperative module (batch tracking, AI freshness grading, cold-storage distribution, reservation management).

The central thesis: cooperatives don't just need an app — they need shared infrastructure that connects member identity, governance, and financing across a *network* of cooperatives, while each cooperative still runs its own operations in isolation.

The build is scoped to demonstrate three judging-case scenarios end-to-end:

- **Scenario A** — a member applies for financing across cooperatives (credit summary + approval workflow)
- **Scenario E** — an external supervisor inspects loan data changes (audit trail + version history + masked access)
- **Scenario C** — a vegetable cooperative receives and distributes perishable stock (Scresh full flow)

---

## 2. Problem Statement

The original MVP succeeded for a single cooperative but broke the moment it scaled to several:

1. **Data mixes across cooperatives.** A single-tenant design means tenant B's data contaminates tenant A's. Reports become untrustworthy.
2. **Reports are unreadable.** Stock is recorded as a single total number with no batch, supplier, quality, or movement history, so reports are number dumps rather than operational insight.
3. **No governance framework for financing partners.** When a financing partner requested portfolio data, the team didn't know what to send or how much was safe to share.
4. **No way to know a member across cooperatives.** A member with a clean record at one cooperative and arrears at another is evaluated from scratch every time — there is no shared identity or credit view.
5. **No accountable change history.** When loan data changes near a disbursement date, there's no immutable record of who changed what, when, and whether it was approved — leaving regulators unable to audit.

The platform must solve all five without compromising tenant isolation.

---

## 3. Target Users

| User | Role on platform | Primary needs |
|------|------------------|---------------|
| **Platform Admin** | Operates the platform | Verify cooperatives, activate modules, manage users, oversee system health |
| **Government Supervisor** (district/provincial) | External oversight | Aggregated performance dashboards, triggered read-only audit access, exportable audit reports — without seeing raw member data |
| **Cooperative Manager** | Runs one cooperative | Approve loans, approve stock corrections, view operational dashboards, control data sharing |
| **Operational Staff** (warehouse) | Daily field operations | Fast input via mobile, batch registration, weight check, freshness scan, barcode movement |
| **Financing Partner** | External lender | Verified, filtered portfolio reports — no access to raw operational data |
| **Cooperative Member** | End beneficiary | Apply for financing, see own profile, see what's shared about them |

---

## 4. Solution Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CENTRALIZED CORE                          │
│  Tenant & Module Registry · Multi-level RBAC                  │
│  Member Profile · Credit Summary Engine                       │
│  Loan Application & Approval Workflow                          │
│  Immutable Audit Trail (field-level) · Version History        │
│  Government Portal · Financing Partner Portal                  │
└───────────────┬─────────────────────────────┬────────────────┘
                │                             │
                ▼                             ▼
   ┌─────────────────────┐        ┌──────────────────────────┐
   │  MODULE: SCRESH      │        │  FUTURE MODULES (catalog) │
   │  (Vegetable coop)    │        │  Fertilizer · Rice ·      │
   │  Batch · Freshness · │        │  Livestock · Clean Water  │
   │  ColdStorage · FIFO  │        │  (placeholder in MVP)     │
   └─────────────────────┘        └──────────────────────────┘
```

**How the three scenarios resolve:**

- **Scenario A (financing):** Member applies at Cooperative A → system pulls a *consent-based credit summary* from other cooperatives (arrears flag, payment status, risk score — never raw data) → risk engine returns Low/Medium/High → routed through the approval workflow → decision recorded in audit trail.
- **Scenario E (supervision):** Every loan data change is auto-logged with before/after values, actor, timestamp, reason. Sensitive changes (loan amount) require manager approval before taking effect. A **rule-based anomaly engine** scores every loan against red-flag rules (large value jumps, changes near disbursement, dominant approvers, recurring staff-manager pairs) and surfaces the suspicious ones on a **dinas risk dashboard** with a plain-language reason. The supervisor triages the dashboard, clicks a flagged loan to drill into its masked audit trail, and exports an audit report.
- **Scenario C (Scresh):** Supplier delivery → Batch ID → weight reconciliation → AI freshness scan (grade A–D) → ScreshTag printed → cold-storage placement → FIFO+freshness distribution → barcode-scanned outbound movement → corrections via manager approval → verified portfolio feeds the financing portal.

---

## 5. MVP Features

> **Scoping principle:** In a 30-hour build judged on *Architecture, Features, Bug & Accuracy, Implementation*, a smaller set of features that actually run beats a large set that half-works. Everything in **Must Have** must be demonstrable live.

### 5.1 Must Have — for the demo

**Centralized Core**

- [ ] **Auth + multi-level RBAC** — 5 roles (admin, supervisor, manager, staff, member) with route-level permission guards. This is the spine; build it first.
- [ ] **Tenant isolation** — every core table carries `cooperative_id`; a tenant guard rejects cross-tenant reads. Demonstrable by logging in as two cooperatives and showing data never crosses.
- [ ] **Tenant & module registry** — register a cooperative, admin verifies it, activate the Scresh module for it.
- [ ] **Member profile** — identity, which cooperatives they belong to, loan history within a cooperative.
- [ ] **Loan application + approval workflow** — member applies → risk score computed → routed by risk tier → manager approves/rejects → recorded. (Scenario A)
- [ ] **Credit summary engine (consent-based)** — when applying at coop A, surface a *summary only* of the member's standing at other coops: active arrears (yes/no), payment status, current running loan count, risk score. No raw data crosses tenants. (Scenario A core differentiator)
- [ ] **Risk scoring (rule-based)** — Low / Medium / High from arrears, on-time ratio, running loan exposure. Low → auto-eligible; Medium → staff review then manager; High → manual manager approval. Rule-based is sufficient and *correct* here — do not over-engineer with ML.
- [ ] **Immutable audit trail (field-level)** — every change logs actor, timestamp, field, old value, new value, reason. Append-only. (Scenario E core)
- [ ] **Version history for loans** — loan v1 (5jt) → loan v2 (15jt), full chain visible.
- [ ] **Approval-gated sensitive changes** — changing a loan amount creates a *change request*; the value only updates after manager approval. (Scenario E)
- [ ] **Supervisor read-only audit access + data masking** — supervisor sees the audit trail for a flagged loan, with unrelated member PII masked.
- [ ] **Anomaly detection engine (rule-based) + dinas risk dashboard** — the system actively flags suspicious loan changes for the supervisor instead of making them hunt through raw logs. A rule-based engine scores each loan/change against red-flag rules and surfaces high-risk ones on a dinas dashboard with a plain-language reason. Clicking a row drills into the full audit trail. *(See rules below — this is the core of Scenario E.)*
- [ ] **Audit report export** — generate the monthly summary (total changes, changes with/without approval, top-activity user, changes <24h before disbursement, findings count). PDF or on-screen report is fine.

> **Anomaly detection rules (rule-based, no ML needed).** Each rule contributes to a risk score; the reason string is shown to the supervisor so the flag is explainable. Keep it rule-based — it's transparent, defensible, and judges can see exactly why something fired.
>
> | Rule | Example trigger | Reason shown |
> |------|-----------------|--------------|
> | **Large value jump** | Loan amount increases >50% (e.g. 5jt → 15jt) | "naik 200%" |
> | **Change near disbursement** | Data changed <24h before pencairan | "diubah 5 jam sebelum pencairan" |
> | **Excessive changes** | Same loan edited too many times | "diubah 7× dalam 2 hari" |
> | **Approval too fast** | Manager approves seconds after request | "approve 12 detik setelah request" |
> | **Dominant approver** | One manager approves an outsized share (Manager A = 95%, others = 5%) | "Manager A approve 95% dari semua" |
> | **Recurring pair** | A specific staff + manager always paired on changes | "Petugas01 & Manager02 selalu berpasangan" |
>
> The dinas dashboard then reads as a triage queue:
>
> | Loan | Risk Score | Reason |
> |------|-----------|--------|
> | L-123 | 95% | naik 200% |
> | L-088 | 70% | approve 12 detik setelah request |
>
> **Auditor clicks a row → full audit trail for that loan appears** (masked for unrelated PII). This turns the audit trail from a passive log into an *active oversight tool* — a strong, demo-able differentiator for Scenario E.

**Scresh Module (Scenario C)**

- [ ] **Batch registration** — unique Batch ID per supplier delivery (e.g. `MLJ-CBI-20260612-001`).
- [ ] **Weight reconciliation** — actual vs claimed weight; auto-generate a discrepancy record when over tolerance.
- [ ] **AI freshness scan** — image → grade A–D + confidence + shelf-life estimate. *(See accuracy note below.)*
- [ ] **ScreshTag generation** — color-coded label (green/yellow/orange/red) with Batch ID + barcode/QR, printable as PDF.
- [ ] **Cold-storage placement** — assign batch to a storage slot, record location.
- [ ] **FIFO + freshness priority engine** — recommend distribution order combining batch age and grade (a grade-C batch can jump ahead of a newer grade-A batch).
- [ ] **Stock movement via barcode scan** — outbound movement recorded against a Batch ID; stock decrements (batch B: 3t → 2t) with actor + timestamp + destination.
- [ ] **Reservation management** — show available vs reserved per batch so offtaker bookings don't conflict; support an urgent order against remaining availability. (This is the demo's "wow" for Scenario C — 8-ton chili case)
- [ ] **Risk alert engine** — low-grade + short shelf life triggers "distribute within X hours" alerts.
- [ ] **Manager-approved stock corrections** — corrections route through manager approval before applying.
- [ ] **Verified portfolio report → financing portal** — filtered operational summary (active stock value, transaction volume, waste rate, supplier stability) exposed read-only to the financing partner.

> **AI freshness scan — accuracy & honesty.** In 30 hours you will *not* train a robust vegetable-freshness CNN. Pick one realistic path and state it openly to judges:
> 1. **Transfer learning on a small public dataset** (e.g. fresh/rotten produce sets on Kaggle) with MobileNetV3/EfficientNet-B0 — works for a 2-3 class demo, may be shaky on local varieties.
> 2. **Pre-trained model + heuristic mapping** (color/texture features → grade) — faster, more controllable for a live demo.
> 3. **Confidence-gated with mandatory human confirmation** — frame AI as *decision support*, staff always confirms/overrides. This is the honest, defensible framing and the one to present.
> Whichever you choose, keep the inference service **separate** from the main backend so a slow/failed model never blocks the operational flow.

### 5.2 Nice to Have — if time allows

- [ ] Government aggregated dashboard (cross-cooperative KPIs) — beyond just audit access
- [ ] Dynamic clearance pricing recommendation for grade-C/D batches
- [ ] Predictive reorder suggestion (avg daily outflow → reorder timing)
- [ ] Per-grade pricing + insufficient-stock handling (find extra supplier / renegotiate with offtaker)
- [ ] Cold-storage temperature logging (manual two-a-day) + threshold alerts
- [ ] PWA offline queue (IndexedDB) for unstable rural connections
- [ ] Supplier performance scoring
- [ ] WhatsApp / push notifications for alerts
- [ ] Second module stub (fertilizer/rice) to prove extensibility visually

---

## 6. API Endpoint Plan

> Convention: `/api/v1/...`. All tenant-scoped routes require a valid JWT; the tenant guard injects and enforces `cooperative_id`. Roles in **[brackets]**.

### Auth & RBAC

```
POST   /api/v1/auth/login                       → JWT (role, cooperative_id, user_id)
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me                           [all]
```

### Tenant & Module Registry

```
POST   /api/v1/cooperatives                      [admin]   register a cooperative
GET    /api/v1/cooperatives                       [admin]   list (pending/verified)
PATCH  /api/v1/cooperatives/:id/verify            [admin]   approve onboarding
GET    /api/v1/modules                            [admin]   module catalog
POST   /api/v1/cooperatives/:id/modules           [admin]   activate a module for a coop
```

### Members & Credit

```
POST   /api/v1/members                            [manager,staff]   create member
GET    /api/v1/members/:id                         [manager,staff]   profile (own tenant)
GET    /api/v1/members/:id/credit-summary          [manager,staff]   consent-based cross-coop summary (NO raw data)
```

### Loans, Approval, Version History

```
POST   /api/v1/loans                               [member,staff]    apply for financing
GET    /api/v1/loans/:id                            [manager,staff]   loan detail + current version
GET    /api/v1/loans/:id/versions                   [manager,supervisor]   full version history
POST   /api/v1/loans/:id/change-requests            [staff]           request a sensitive change (e.g. amount)
PATCH  /api/v1/change-requests/:id/approve          [manager]         approve → value applies
PATCH  /api/v1/change-requests/:id/reject           [manager]
PATCH  /api/v1/loans/:id/decision                   [manager]         approve / reject / request collateral
GET    /api/v1/loans/:id/risk                       [manager,staff]   computed risk tier
```

### Audit Trail & Supervisor

```
GET    /api/v1/audit                                [admin,manager]   audit entries (tenant-scoped)
GET    /api/v1/audit/loan/:id                        [supervisor]      masked, read-only audit for a flagged loan
GET    /api/v1/audit/anomalies                        [supervisor]      dinas risk dashboard — flagged loans + score + reason
GET    /api/v1/audit/anomalies/:loanId                 [supervisor]      drill-down: rules fired + full audit trail
POST   /api/v1/audit/report                          [supervisor,admin]   generate monthly audit report
GET    /api/v1/audit/report/:id/export               [supervisor,admin]   export PDF
```

### Government Portal

```
GET    /api/v1/gov/dashboard                         [supervisor]      aggregated KPIs (no individual data)
```

### Financing Partner Portal

```
GET    /api/v1/partner/portfolio/:cooperativeId      [partner]         verified, filtered portfolio report
```

### Scresh Module

```
POST   /api/v1/scresh/batches                        [staff]   register batch (auto Batch ID)
GET    /api/v1/scresh/batches                         [staff,manager]   list batches
GET    /api/v1/scresh/batches/:id                      [staff,manager]   batch detail
POST   /api/v1/scresh/batches/:id/weight              [staff]   weight reconciliation (+ discrepancy)
POST   /api/v1/scresh/batches/:id/freshness           [staff]   AI freshness scan → grade A–D
POST   /api/v1/scresh/batches/:id/tag                  [staff]   generate ScreshTag (PDF/QR)
POST   /api/v1/scresh/batches/:id/storage             [staff]   assign cold-storage slot
GET    /api/v1/scresh/distribution/priority            [staff,manager]   FIFO + freshness ordered list
POST   /api/v1/scresh/movements                        [staff]   outbound movement (barcode scan)
POST   /api/v1/scresh/corrections                       [staff]   request stock correction
PATCH  /api/v1/scresh/corrections/:id/approve           [manager]   approve correction
GET    /api/v1/scresh/reservations                      [staff,manager]   available vs reserved per batch
POST   /api/v1/scresh/reservations                      [staff]   create offtaker reservation
GET    /api/v1/scresh/alerts                            [staff,manager]   risk alerts (grade + shelf life)
```

### AI Inference Service (separate service)

```
POST   /infer/freshness                               internal   image → {grade, confidence, shelf_life}
```

---

## 7. Suggested Project Structure

> Stack assumption: **Modular monolith** backend (FastAPI or NestJS) + **separate AI inference service** (Python/FastAPI) + **PostgreSQL** (row-level tenant isolation) + **Next.js PWA** frontend. Pick what your team is fastest in — speed of build > stack ideology in 30 hours.

```
project/
├── backend/
│   ├── src/
│   │   ├── core/
│   │   │   ├── auth/              # login, JWT, refresh
│   │   │   ├── rbac/              # role guards, permission matrix
│   │   │   ├── tenant/            # tenant guard, cooperative_id enforcement
│   │   │   └── audit/             # audit interceptor (writes on every mutation)
│   │   ├── modules/
│   │   │   ├── registry/          # tenant & module registry
│   │   │   ├── members/           # member profile
│   │   │   ├── credit/            # credit summary engine + risk scoring
│   │   │   ├── loans/             # application, approval, version history, change requests
│   │   │   ├── government/        # aggregated dashboard, supervisor access, anomaly engine
│   │   │   │   └── anomaly/       # rule-based red-flag scoring + reasons
│   │   │   ├── partner/           # financing portfolio reports
│   │   │   └── scresh/            # batch, weight, freshness, tag, storage,
│   │   │       │                  # fifo, movements, reservations, alerts, corrections
│   │   │       ├── batch/
│   │   │       ├── distribution/
│   │   │       └── reservation/
│   │   ├── shared/               # db, config, errors, pdf-export
│   │   └── main.*
│   ├── migrations/
│   └── tests/                    # at least: tenant isolation + approval gate tests
│
├── ai-service/
│   ├── app.py                    # POST /infer/freshness
│   ├── model/                    # weights + preprocessing
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/login
│   │   ├── admin/                # registry, verification, module activation
│   │   ├── manager/              # loan approvals, correction approvals, dashboard
│   │   ├── staff/                # scresh field ops (mobile-first)
│   │   ├── supervisor/           # masked audit view + report export
│   │   ├── partner/              # portfolio report
│   │   └── member/               # apply for financing, own profile
│   ├── components/
│   ├── lib/                      # api client, auth context, role gating
│   └── public/
│
├── docs/
│   ├── PRD.md
│   ├── api.md
│   └── demo-script.md            # the exact click-path for judging
│
└── docker-compose.yml           # postgres + backend + ai-service + frontend
```

**Database — core tables (all tenant tables carry `cooperative_id`):**

```
cooperatives, modules, cooperative_modules
users, roles
members, member_cooperatives
loans, loan_versions, change_requests
credit_summaries          (cross-coop, consent-flagged, summary only)
audit_logs                (append-only, field-level)
-- scresh --
batches, weight_records, freshness_scans, screshtags
storage_slots, stock_movements, reservations, stock_corrections, alerts
```

---

## 8. 30-Hour Execution Timeline

> Assumes a 4-person team: **2 backend, 1 frontend, 1 AI/full-stack floater.** Adjust to your actual split. Times are cumulative checkpoints, not strict blocks — protect the demo path above all.

### Phase 0 — Setup & Foundation (Hours 0–4)
- Repo, docker-compose, DB schema + migrations, seed data (2 cooperatives, users for all 5 roles)
- **Auth + JWT + RBAC guards** working end-to-end (this unblocks everyone)
- Tenant guard enforcing `cooperative_id`
- Frontend shell + login + role-based routing
- **Checkpoint:** any role can log in and land on its own page

### Phase 1 — Centralized Core, Scenario A & E (Hours 4–13)
- Member profile + member-cooperative links (H4–6)
- Loan application + risk scoring (rule-based) + approval workflow (H6–9)
- Audit interceptor: auto-log every mutation field-level (H6–8, in parallel)
- Loan version history + change-request → manager-approval gate (H9–11)
- Credit summary engine (consent-based, cross-coop, summary only) (H10–12)
- Supervisor masked audit view + anomaly engine + dinas risk dashboard + audit report export (H12–13)
- **Checkpoint:** Scenario A and Scenario E both clickable end-to-end on the backend, basic UI

### Phase 2 — Scresh Module, Scenario C (Hours 13–22)
- Batch registration + weight reconciliation + discrepancy (H13–15)
- AI inference service stub returning a grade; wire freshness endpoint (H13–16, floater in parallel)
- ScreshTag generation (color + QR + PDF) (H16–17)
- Cold-storage placement + FIFO/freshness priority engine (H17–19)
- Stock movement via barcode + stock decrement + manager-approved corrections (H19–20)
- Reservation management (available vs reserved) + urgent-order path (H20–22)
- Risk alert engine (grade + shelf life → distribute-within alert) (H21–22)
- **Checkpoint:** 8-ton chili flow runs start to finish

### Phase 3 — Integration & Portals (Hours 22–26)
- Verified portfolio report → financing partner portal (H22–23)
- Government aggregated dashboard *(if time — else skip to polish)* (H23–24)
- Real AI model swapped in if ready, else keep stub with honest framing (H23–25)
- Full UI polish on the three demo paths only (H24–26)
- **Checkpoint:** every demo screen looks intentional, not broken

### Phase 4 — Hardening & Demo Prep (Hours 26–30)
- Bug bash on the demo path; fix tenant-isolation and approval-gate edge cases first (H26–28)
- Write `demo-script.md` — exact click-path, who logs in when, what to say (H28–29)
- Seed a clean, impressive demo dataset; rehearse the run twice (H29–30)
- Prepare the AI-honesty talking point and the architecture diagram
- **Checkpoint:** a rehearsed, repeatable 5–7 minute demo

> **The single most important rule:** by Hour 22 the three scenarios must run on the backend even if ugly. Everything after is polish. Teams lose finals by building features at Hour 28 instead of rehearsing.

---

## 9. Post-Hackathon Roadmap

**Phase 1 — Harden the core (Month 1–2)**
- Production-grade tenant isolation (row-level security in Postgres, not just app guards)
- Real freshness model trained on local vegetable varieties with field-collected, labeled data
- Proper consent management UI for cross-cooperative data sharing
- Comprehensive audit + automated audit-report scheduling for dinas
- Anomaly detection evolving from rule-based to ML-assisted (learn normal approval patterns per cooperative, flag statistical outliers beyond the fixed rules)

**Phase 2 — Expand modules (Month 3–5)**
- Build the next operational module (fertilizer / rice / livestock / clean water) on the same core
- Module marketplace: cooperatives self-select and configure modules
- Cold-storage IoT integration (ESP32 + DHT22) replacing manual temperature logs
- Thermal printer integration for ScreshTags; digital scale integration for weight

**Phase 3 — Network effects & financing (Month 6–9)**
- Onboard real financing partners; verified portfolio reports as a paid product
- Cross-cooperative credit network maturing into a genuine data flywheel
- Government partnership: supervisor portal as a standard tool for district cooperative agencies
- KUR (Kredit Usaha Rakyat) integration pathway

**Phase 4 — Scale (Month 9–12+)**
- Multi-region database sharding
- Predictive analytics across the cooperative network (demand, waste, pricing)
- Self-serve onboarding to remove field-visit dependency
- Compliance certification (PDPU / data protection) to unlock enterprise & government contracts

---

*Build for the demo first. A platform that runs three scenarios flawlessly beats one that describes ten.*
