# DESIGN.md

# Modular Cooperative Digitalization Platform — Design Guidelines

## 1. Design Purpose

This document defines the visual and interaction design direction for the Modular Cooperative Digitalization Platform frontend.

The design must communicate that this product is not only a single cooperative application, but a centralized cooperative infrastructure platform that supports:

* Multi-tenant cooperative operations
* Role-based dashboards
* Financing workflows
* Audit and governance workflows
* Scresh operational module for vegetable cooperatives
* Partner and government-facing filtered data access

The first visual baseline is based on three priority experiences:

1. Landing Page
2. Staff / Petugas Onboarding Dashboard
3. Scresh Vegetable Scan Result and ScreshTag

---

## 2. PRD Alignment

The design must reflect the two-layer product structure from the PRD:

```txt
Centralized Core
- Tenant and module registry
- Multi-level RBAC
- Member profile
- Credit summary engine
- Loan approval workflow
- Audit trail
- Version history
- Government portal
- Financing partner portal

Operational Modules
- Scresh as the flagship module
- Batch tracking
- Freshness grading
- Cold-storage distribution
- Reservation management
- Stock movement
```

The design must support the three main judging scenarios:

```txt
Scenario A — Financing
Member applies for financing, system shows credit summary and risk score, then routes the loan to approval.

Scenario C — Scresh
Staff receives vegetable stock, registers a batch, scans freshness, generates ScreshTag, manages reservation, and records stock movement.

Scenario E — Audit & Governance
Supervisor or manager inspects suspicious loan changes through audit trail, version history, and risk dashboard.
```

---

## 3. Design Direction

The product should feel:

```txt
Modern
Friendly
Operational
Trustworthy
Agricultural
Enterprise-ready
Mobile-first
```

The visual language combines:

```txt
Bright cooperative energy
+
Enterprise-grade governance
+
Simple mobile field operations
```

The UI should not feel like a generic admin dashboard. It should feel like a fresh digital infrastructure product for cooperatives.

---

## 4. Visual Reference Baseline

The current mobile dashboard reference establishes the first design baseline.

Key characteristics:

```txt
Screen Type:
Mobile dashboard

Visual Style:
Bright lime background with soft green gradient

Main Layout:
Single-column mobile layout with rounded cards

Header:
Avatar, greeting, user name, utility icons

Identity Card:
Large lime card showing cooperative name, location, role, and active module

Widgets:
White rounded cards for operational data

Bottom Navigation:
Home, Members, central Scresh action, Approvals, Audit
```

The reference screen should be used as the base visual direction for the Staff / Petugas experience.

---

## 5. Color System

## 5.1 Primary Palette

```txt
Lime Green
#B5E930

Forest Green
#013425

Sun Orange
#F86812

White
#FFFFFF
```

---

## 5.2 Color Roles

### Lime Green — `#B5E930`

Use for:

```txt
Main background
Freshness success state
Positive metric highlight
Active module indicator
Central Scresh navigation action
Large cooperative identity cards
```

Lime Green gives the product its agricultural and energetic identity.

---

### Forest Green — `#013425`

Use for:

```txt
Primary text
Dark cards
Navigation icons
Primary CTA background
Enterprise sections
Audit/governance emphasis
```

Forest Green gives the product trust, seriousness, and contrast.

---

### Sun Orange — `#F86812`

Use for:

```txt
Warnings
Risk alerts
Urgent actions
Attention states
Grade C / urgent freshness state
Approval-required indicators
```

Sun Orange should be used sparingly so it remains meaningful.

---

### White — `#FFFFFF`

Use for:

```txt
Widget cards
Dashboard panels
Alternative backgrounds
Text on dark backgrounds
Clean spacing areas
```

White cards are the main surface system for mobile dashboards.

---

## 5.3 Gradient System

Use two main gradients:

```txt
Gradient 1:
Lighter Forest Green → Lime Green

Gradient 2:
Lime Green → White
```

Recommended usage:

```txt
Lighter Forest Green → Lime Green
- Landing page hero
- Centralized Core visual section
- High-impact feature cards

Lime Green → White
- Staff onboarding dashboard
- Dashboard page background
- ScreshTag result page
```

---

## 6. Typography

## 6.1 Font Families

```txt
Heading Font:
DM Serif Display

Body Font:
Akt
```

Both fonts should be imported using:

```txt
next/font/google
```

---

## 6.2 Typography Personality

### DM Serif Display

Use for:

```txt
Hero headlines
Page titles
Large role labels
ScreshTag grade display
Important section titles
```

Purpose:

```txt
Creates a distinctive, premium, editorial identity.
Makes the product feel more memorable than a generic SaaS dashboard.
```

---

### Akt

Use for:

```txt
Body text
Labels
Buttons
Navigation
Metric values
Widget descriptions
Form text
```

Purpose:

```txt
Keeps operational information readable, modern, and clean.
```

---

## 6.3 Mobile Type Scale

Recommended mobile scale:

```txt
Display / Hero:
48px–64px

Page Title:
32px–40px

Card Title:
20px–24px

Section Title:
18px–22px

Body:
16px

Small Label:
12px–14px

Bottom Nav Label:
10px–12px
```

For the Staff dashboard reference, keep labels clean and readable. Avoid overly small text inside operational cards.

---

## 7. Layout System

## 7.1 Mobile-First Layout

The primary design target is mobile.

Recommended mobile layout:

```txt
Screen width reference:
390px–490px

Horizontal padding:
24px–32px

Vertical spacing:
16px–24px

Card gap:
16px–20px

Large section gap:
24px–32px
```

---

## 7.2 Page Background

Use a lime-to-white vertical gradient for most mobile dashboard pages.

```txt
Top:
Lime Green

Bottom:
White or lighter lime
```

This keeps the page bright while preventing visual fatigue.

---

## 7.3 Card Radius

The product should use large rounded corners.

Recommended radius:

```txt
Small chip:
999px

Small card:
20px

Widget card:
24px–28px

Hero card:
28px–32px

Large dashboard panel:
32px
```

The rounded card language is important because the reference screen uses soft, friendly panels.

---

## 7.4 Card Surfaces

Use these main card types:

```txt
White Widget Card
- Background: White
- Text: Forest Green
- Radius: 24px–28px
- Purpose: Default dashboard widget

Lime Highlight Card
- Background: Lime Green
- Text: Forest Green
- Radius: 28px–32px
- Purpose: Cooperative identity, active module, positive freshness result

Forest Card
- Background: Forest Green
- Text: White
- Radius: 28px–32px
- Purpose: Hero, governance, audit, strong summary

Orange Alert Card
- Background: Sun Orange
- Text: White
- Radius: 20px–28px
- Purpose: Urgent risk, expiring batch, approval warning
```

---

## 8. Core Components

## 8.1 App Header

Used on dashboard pages.

Content:

```txt
Avatar
Greeting
User name
Calendar icon
Notification icon
```

Example:

```txt
Selamat pagi!
Jason Edward
```

Guidelines:

```txt
Avatar on the left
Greeting and user name beside avatar
Utility icons on the right
Use circular lime icon buttons
Keep icon style outlined and simple
```

---

## 8.2 Cooperative Identity Card

Used at the top of role dashboards.

Content:

```txt
Cooperative name
Location
User role
Active module
```

Example:

```txt
Koperasi Makmur Jaya
Bandung, Indonesia

Staf Koperasi
Modul aktif: Scresh
```

Design:

```txt
Background: Lime Green
Text: Forest Green
Radius: 28px–32px
Icon: small cooperative/store icon inside white circular chip
```

Purpose:

```txt
Immediately tells the user which cooperative, role, and module they are operating in.
```

---

## 8.3 Widget Card

Used for dashboard sections.

Examples:

```txt
Tugas hari ini
Batch intake
Quick Actions
Status Reservasi
Perpindahan stok
```

Design:

```txt
Background: White
Text: Forest Green
Radius: 24px–28px
Padding: 18px–24px
Minimum height depends on content
```

Widget cards should have clear titles and avoid overcrowding.

---

## 8.4 Metric Card

Used for compact numerical summaries.

Example:

```txt
Batch Intake
5 deliveries
3 waiting scan
```

Guidelines:

```txt
Keep one primary number large
Use short supporting labels
Do not place more than 4 metrics inside one small card
```

---

## 8.5 Quick Action Button

Used inside Quick Actions widget.

Examples:

```txt
Register Batch
Scan QR
Create Reservation
Report Correction
```

Design:

```txt
Icon + label
White or lime surface
Forest Green text
Orange only for urgent/destructive actions
```

---

## 8.6 Status Badge

Used for roles, modules, grade, risk, and approval states.

Examples:

```txt
Scresh Active
Grade A
Medium Risk
Pending Approval
Approved
Expiring Soon
```

Recommended colors:

```txt
Success:
Lime Green background, Forest Green text

Warning:
Sun Orange background, White text

Neutral:
White background, Forest Green text

Critical:
Forest Green or Red background, White text
```

---

## 8.7 Bottom Navigation

Primary mobile navigation should use:

```txt
Home
Members
Scresh
Approvals
Audit
```

Scresh should be the central emphasized action.

Layout:

```txt
Home | Members | Scresh | Approvals | Audit
```

Guidelines:

```txt
Use a fixed bottom navigation bar.
Use white background.
Use Forest Green icons.
Use central floating Scresh button with Lime Green background.
Keep labels short.
Use active indicator through icon emphasis or lime circular background.
```

Do not put Partner Portal or Admin inside the primary bottom navigation. Those should live under Profile / More because they are role-specific and not part of daily mobile operation.

---

## 9. Role-Based Dashboard Design

## 9.1 Staff / Petugas Dashboard

The Staff dashboard is an execution dashboard.

Primary goal:

```txt
Help warehouse staff perform daily Scresh operations quickly.
```

Tone:

```txt
Operational
Fast
Mobile-first
Low cognitive load
```

Main sections:

```txt
Header
Cooperative Identity Card
Tugas hari ini
Batch intake
Quick Actions
Status Reservasi
Perpindahan stok
Bottom Navigation
```

Recommended widget content:

```txt
Tugas hari ini
- Batch intake
- Freshness scan
- Stock movement
- Reservations

Batch intake
- New deliveries today
- Waiting weight check
- Waiting freshness scan
- Generated ScreshTags

Quick Actions
- Register Batch
- Scan Freshness
- Generate ScreshTag
- Scan Stock Movement
- Create Reservation

Status Reservasi
- Reserved stock
- Available stock
- Urgent orders
- Conflict risk

Perpindahan stok
- Outbound today
- Quantity out
- Waiting confirmation
- Completed movement
```

Design behavior:

```txt
Staff should never see complex audit data by default.
Staff should focus on scanning, registering, moving, and reporting.
Staff can request correction but cannot approve correction.
```

---

## 9.2 Manager Dashboard

The Manager dashboard is a decision dashboard.

Primary goal:

```txt
Help cooperative managers approve, monitor, and respond.
```

Tone:

```txt
Controlled
Insightful
Trustworthy
Operational overview
```

Recommended widgets:

```txt
Operational Overview
- Total members
- Active loans
- Active stock batches
- Pending actions

Financing Health
- Active applications
- Pending manager approval
- Medium risk loans
- High risk loans

Approval Queue
- Loan approval
- Loan amount change
- Stock correction

Risk Alerts
- Loan amount increased 200%
- Changed before disbursement
- Expiring batch

Scresh Operations
- Active batches
- Reserved stock
- Expiring soon
- Freshness alerts

Recent Activity
- Staff requested amount change
- Manager approved loan change
- Batch registered
- Freshness scan completed
```

Design behavior:

```txt
Manager can approve loan requests.
Manager can approve sensitive changes.
Manager can approve stock corrections.
Manager can view risk alerts and operational overview.
```

---

## 9.3 Supervisor Dashboard

The Supervisor dashboard is an oversight dashboard.

Primary goal:

```txt
Help government supervisors identify suspicious loan changes without seeing unnecessary raw member data.
```

Recommended widgets:

```txt
Flagged Loans
High Risk Cases
Changes Without Approval
Audit Report Export
Anomaly Reasons
```

Design behavior:

```txt
Supervisor sees masked audit details.
Supervisor does not see unnecessary raw member PII.
Supervisor should see clear reason strings for flags.
```

---

## 9.4 Partner Dashboard

The Partner dashboard is a filtered portfolio dashboard.

Primary goal:

```txt
Show financing partners verified portfolio summaries without raw operational data.
```

Recommended widgets:

```txt
Portfolio Summary
Stock Value
Waste Rate
Supplier Stability
Transaction Volume
```

Design behavior:

```txt
Partner should not see raw stock movement.
Partner should not see raw member identity.
Partner should only see safe, filtered portfolio indicators.
```

---

## 10. Page Design Specifications

## 10.1 Landing Page

Purpose:

```txt
Explain the platform clearly before the user enters the app.
```

Main sections:

```txt
Hero
Centralized Core explanation
Operational Modules explanation
Scenario Cards
Role Preview
CTA
```

Landing page headline direction:

```txt
Shared Infrastructure for the Next Generation of Cooperatives
```

Subheadline direction:

```txt
A centralized cooperative platform connecting member identity, financing governance, and commodity operations without breaking tenant isolation.
```

Visual style:

```txt
Use Lime Green → White gradient.
Use DM Serif Display for large hero title.
Use Forest Green for main text.
Use Sun Orange for secondary CTA or accent.
Use rounded cards for scenarios.
```

Scenario cards:

```txt
Scenario A
Financing and credit summary

Scenario C
Scresh batch and freshness flow

Scenario E
Audit and governance
```

---

## 10.2 Staff Onboarding Page

Purpose:

```txt
Introduce the staff role and provide direct access to daily Scresh operations.
```

Page sections:

```txt
App Header
Cooperative Identity Card
Task widgets
Quick Actions
Reservation Status
Stock Movement
Bottom Navigation
```

Visual style:

```txt
Use the provided mobile screenshot as baseline.
Use lime background.
Use large white rounded widget cards.
Use central Scresh bottom navigation button.
```

Main CTA:

```txt
Start Scan
```

Secondary actions:

```txt
Register Batch
Create Reservation
Scan Stock Movement
View Alerts
```

---

## 10.3 Scresh Scan Result Page

Purpose:

```txt
Show the output of vegetable freshness scanning.
```

The scan result should not only show a grade. It should explain what the grade means operationally.

Required content:

```txt
Batch ID
Commodity
Supplier
Claimed weight
Actual weight
Difference
Freshness grade
Confidence score
Estimated shelf life
Recommended action
Distribution priority
Risk alert if needed
```

Example result:

```txt
Batch ID:
MLJ-CBI-20260612-001

Commodity:
Cabai Merah

Freshness Grade:
Grade A

Confidence:
92%

Shelf Life:
5 days

Recommended Action:
Store normally

Distribution Priority:
Normal
```

Critical state example:

```txt
Freshness Grade:
Grade D

Confidence:
89%

Shelf Life:
8 hours

Recommended Action:
Distribute immediately

Distribution Priority:
#1

Alert:
Expiring in 8 hours
```

Visual style:

```txt
Use Forest Green page background for contrast.
Use white result card.
Use large grade display.
Use Lime Green for Grade A / success.
Use Sun Orange for urgent action.
Use clear operational recommendation.
```

---

## 10.4 ScreshTag Page

Purpose:

```txt
Show generated printable batch identity label.
```

Required content:

```txt
ScreshTag label
Batch ID
Commodity
Grade
Confidence
Shelf life
Actual weight
Distribution priority
QR placeholder
Traceability description
```

Grade color mapping:

```txt
Grade A:
Green / Lime

Grade B:
Yellow

Grade C:
Orange

Grade D:
Red
```

ScreshTag should communicate:

```txt
This batch can be traced.
This batch has freshness data.
This batch can be moved, reserved, and audited.
```

---

## 10.5 Audit / Risk Dashboard

Purpose:

```txt
Help manager or supervisor detect suspicious changes.
```

Required content:

```txt
Flagged loans
Risk score
Reason string
Change timestamp
Approval status
Audit trail shortcut
Version history shortcut
```

Example rows:

```txt
L-123
Risk Score: 95
Reason: Loan amount increased 200%

L-088
Risk Score: 70
Reason: Approved 12 seconds after request
```

Design style:

```txt
Use Forest Green and White for serious enterprise tone.
Use Sun Orange for high risk.
Use clear reason strings, not vague labels.
```

---

## 11. Navigation Architecture

## 11.1 Primary Mobile Navigation

Use:

```txt
Home
Members
Scresh
Approvals
Audit
```

Recommended behavior:

```txt
Home:
Role dashboard

Members:
Member profile, credit summary, loan history

Scresh:
Batch, scan, tag, reservation, movement

Approvals:
Loan approvals and change requests

Audit:
Risk dashboard, audit trail, version history
```

---

## 11.2 Role-Specific Hidden Navigation

Place these inside Profile / More:

```txt
Admin
Partner Portal
Logout
```

Reason:

```txt
Admin and Partner are not daily mobile actions for staff.
Keeping them out of bottom navigation keeps the mobile experience focused.
```

---

## 12. Component Naming Guidelines

Use clear component names that match product concepts.

Recommended components:

```txt
AppHeader
CooperativeIdentityCard
RoleDashboardHeader
WidgetCard
MetricCard
QuickActionGrid
QuickActionButton
BottomNav
CentralScreshAction
StatusBadge
RiskBadge
FreshnessGradeBadge
ScanResultPanel
ScreshTag
AuditTimeline
VersionComparison
ReservationStatusCard
StockMovementCard
```

Avoid generic names when product-specific names are clearer.

---

## 13. Content Language Guidelines

The app may use Indonesian for field-facing operational screens.

Recommended language:

```txt
Staff / Petugas:
Indonesian

Manager:
Indonesian or mixed Indonesian-English

Supervisor:
Indonesian

Partner:
English or formal Indonesian

Landing Page:
English or bilingual depending on pitch audience
```

For current mobile dashboard baseline, use Indonesian labels:

```txt
Selamat pagi!
Staf Koperasi
Modul aktif: Scresh
Tugas hari ini
Batch intake
Quick Actions
Status Reservasi
Perpindahan stok
```

---

## 14. Icon Style

Use outline icons.

Recommended style:

```txt
Rounded outline
Medium stroke
Simple geometry
No filled complex icons
```

Icon background:

```txt
Utility icons:
Lime circular background

Bottom nav icons:
Forest Green outline

Central Scresh action:
Lime circular button with Forest Green icon
```

---

## 15. Spacing and Sizing Guidelines

Mobile spacing:

```txt
Page horizontal padding:
28px–32px

Header bottom spacing:
24px

Card padding:
18px–24px

Widget vertical gap:
16px–20px

Bottom nav height:
64px–72px

Central nav button:
56px–64px
```

Touch target:

```txt
Minimum:
44px x 44px

Preferred:
48px x 48px
```

---

## 16. Accessibility Guidelines

The interface must remain readable and touch-friendly.

Rules:

```txt
Do not use low contrast text on Lime Green.
Use Forest Green for text on Lime Green.
Use White text on Forest Green.
Use White text on Sun Orange.
Do not put small gray text on lime background.
Keep body text at least 16px where possible.
Make all tap targets at least 44px.
Do not rely only on color for status.
Always include labels such as Grade A, High Risk, Pending Approval.
```

---

## 17. Responsive Guidelines

Although mobile is the main target, the design should scale.

### Mobile

```txt
Single-column layout
Bottom navigation
Large cards
Fast actions
Minimal tables
```

### Tablet

```txt
Two-column widget grid
Side panel possible
Bottom nav can remain
```

### Desktop

```txt
Sidebar navigation
Multi-column dashboard
Tables for approvals and audit
Wider report layouts
```

Do not design desktop first. The hackathon demo should prioritize mobile clarity.

---

## 18. Design Priorities for Hackathon

The design should prioritize the demo path.

Priority order:

```txt
1. Staff onboarding dashboard
2. Scresh scan result
3. ScreshTag
4. Landing page
5. Manager dashboard
6. Audit dashboard
7. Partner portal
8. Admin pages
```

The first three screens define the visual baseline.

---

## 19. Design Definition of Done

The design baseline is done when:

```txt
1. Landing page clearly communicates centralized cooperative infrastructure.
2. Staff onboarding dashboard follows the lime background and white widget card system.
3. Role and active module are visible immediately.
4. Scresh scan result shows grade, confidence, shelf life, recommendation, and priority.
5. ScreshTag clearly shows batch identity and traceability.
6. Bottom navigation uses Home, Members, Scresh, Approvals, and Audit.
7. Typography uses DM Serif Display for headings and Akt for body text.
8. Colors follow the defined palette.
9. Components are reusable across roles.
10. The design supports Scenario A, Scenario C, and Scenario E from the PRD.
```

---

## 20. Final Design Principle

Design for the demo first.

The product should make judges understand three things within seconds:

```txt
This is a centralized cooperative platform.
Each role sees a different operational experience.
Scresh turns vegetable stock into traceable, scannable, finance-ready inventory.
```
