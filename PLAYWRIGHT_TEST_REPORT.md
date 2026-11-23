# Mustadama ("مُستدام") — Playwright End-to-End Test Suite Report

**Document Version:** 2.0.0  
**Last Verified:** 2026-11-21  
**Test Harness:** Playwright `1.65.0` targeting Next.js `16.4.6` on Node.js `v24`  
**Browser Engine:** Chromium (Desktop Chrome, headless)  
**Architecture Tested:** Three-Domain Commercial Isolation (`localhost:3000`, `partner.localhost:3000`, `admin.localhost:3000`) + Cloud Supabase (`xijhkffkmlaghqowmrmz`)

---

## 1. Executive Summary

This report documents the automated verification baseline for **Mustadama ("مُستدام")** across all 3 commercial domains, 8 PostgreSQL RBAC roles, 12 Role Simulator personas, 23 relational tables, and bilingual **English (LTR) / Arabic (RTL)** views.

| Metric | Target Value | Measured Result | Status |
|---|---|---|---|
| **E2E Test Suites** | 6 Suites | 6 Suites (`tests/e2e/*.spec.ts`) | **VERIFIED** |
| **Total E2E Scenarios** | 42 Scenarios | 42 Scenarios (`ADMIN-06` added) | **VERIFIED** |
| **Latest Live Multi-Domain E2E Run** | Suites 1, 2, 5, 6 (29 Scenarios) | 29/29 Passed (`01`, `02`, `05`, `06`) | **100% GREEN** |
| **Vitest Unit & Layout Suite** | 17 Suites / 125 Tests | 17 Passed / 125 Passed (`npm test`) | **100% GREEN** |
| **TypeScript Typecheck** | Zero Errors | 0 Errors (`npx tsc --noEmit`) | **CLEAN** |
| **ESLint Check** | Zero Warnings / Errors | 0 Warnings / 0 Errors (`npm run lint`) | **CLEAN** |
| **Production Next.js Build** | All Routes Compiled | 24/24 Routes (`npm run build`) | **CLEAN** |
| **UI Sanitization** | Zero Academic Tags | 0 `FR-`/`NFR-`/`SRS` markers in rendered UI | **VERIFIED** |

---

## 2. Test Architecture & Configuration

Configured in [playwright.config.ts](file:///d:/Mustadam%20Project/playwright.config.ts) (`npm run test:e2e`):

1. **Sequential Execution (`workers: 1`):** Prevents live database race conditions and session cookie collisions across personas.
2. **Managed Next.js WebServer:** Starts `http://localhost:3000` automatically (Chromium resolves `partner.localhost:3000` and `admin.localhost:3000` to `127.0.0.1` natively).
3. **Failure Diagnostics:** Captures screenshots, videos, and Playwright traces on retry (`test-results/`, `playwright-report/`).

---

## 3. E2E Suite Breakdown (6 Suites — 42 Scenarios)

### Suite 1: Customer Landing Page & Navigation (`tests/e2e/01-landing-page.spec.ts` — 8 Scenarios)
- `NAV-01` – `NAV-02`: Root `/` localization redirect, editorial Hero headline, primary CTAs (`/store`, `/seller`), trust badges.
- `NAV-03`: Customer directory verifies `/store`, `/seller`, `/login`, `/register`, and asserts **zero** `/partner` or `/admin` links on the customer homepage (`ADR-010`).
- `NAV-04`: 4-stage circular economy lifecycle & sustainability metrics.
- `NAV-05`: Customer `SiteFooter` verifies **Marketplace & Sourcing** and **Customer Account** columns, © 2026 notice, and **zero** `/partner` or `/admin` links.
- `NAV-06` – `NAV-08`: Bilingual EN (LTR) / AR (RTL) switching, mobile (375px) + desktop (1280px) zero horizontal overflow, and zero exposed `FR-`/`NFR-` codes.

### Suite 2: Three-Domain Auth Gates & Role Simulation (`tests/e2e/02-auth-personas.spec.ts` — 9 Scenarios)
- `AUTH-01` – `AUTH-02`: Consolidated `<select data-testid="persona-select">` (3 optgroups, 12 personas) and Customer persona routing (`/seller`, `/store`).
- `AUTH-03`: Partner subdomain isolation (`/en/partner` blocked on `localhost:3000`, `partner.localhost:3000/en/partner` redirects to `/en/partner/login`, authenticates `inspector@mustadama.eg`, switches to `courier-hub`).
- `AUTH-04`: Admin subdomain isolation (`/en/admin` blocked on `localhost:3000`, `admin.localhost:3000/en/admin` redirects to `/en/admin/login`, authenticates `admin@mustadama.eg`).
- `AUTH-05`: Cross-subdomain Role Simulator handoff (`/api/auth/demo-switch`) displays active role & email chip on target origin.
- `AUTH-06` – `AUTH-09`: Sign out, customer `/login` negative + positive flow, `/register` Individual/Corporate field toggle, and unauthenticated redirect guards on `/seller` and `admin.localhost:3000/en/admin`.

### Suite 3: Certified Storefront & Checkout (`tests/e2e/03-storefront.spec.ts` — 7 Scenarios)
- `STORE-01` – `STORE-07`: Serialized catalog & condition grade filters, unit selection, 15-minute checkout lock creation & `FAILED` release, multi-channel `SUCCESS` payment webhook, My Orders + Tax Invoice link (`/api/documents/invoice/[id]`), and Corporate B2B Bulk Quote submission.

### Suite 4: Seller Acquisition Portal (`tests/e2e/04-seller-portal.spec.ts` — 6 Scenarios)
- `SELL-01` – `SELL-06`: Dynamic category diagnostic questionnaire & live EGP valuation, 3-photo condition compression requirements, Courier vs. Partner Drop-off handover toggle, single acquisition tracking code, Corporate bulk liquidation manifest, and 7-day offer decision review.

### Suite 5: Partner Operations Hub (`tests/e2e/05-partner-portal.spec.ts` — 6 Scenarios on `partner.localhost:3000`)
- Authenticates via `http://partner.localhost:3000/en/partner/login` before each test.
- `PART-01` – `PART-06`: Logistics custody transitions, equal batch logistics cost allocation, warehouse intake barcode generation (`MST-YYYY-NNNNN`), technical inspection with NIST SP 800-88 wipe gate & cross-user seller notification, refurbishment cost rollup + store listing, and dismantling spare parts harvesting & scrap logging.

### Suite 6: Admin MIS & Customer Service Control Center (`tests/e2e/06-admin-portal.spec.ts` — 6 Scenarios on `admin.localhost:3000`)
- Authenticates via `http://admin.localhost:3000/en/admin/login` before each test.
- `ADMIN-01`: Real-time Circular Revenue, Avg Profit Margin, Seller Acceptance Rate, **Avg Turnaround Time**, 30–60–90+ Aging tiers, Lifecycle chart, and Aging Engine trigger button.
- `ADMIN-02`: Dynamic category schema builder, live valuation preview, deduplicated save, and Edit mode (`Update Dynamic Category`).
- `ADMIN-03`: Registered Customer Directory + targeted promotional campaign dispatch.
- `ADMIN-04`: Enriched Corporate B2B Quote approval workflow.
- `ADMIN-05`: `Customer_Service` persona access on `admin.localhost:3000`, default Warranty Claims & Return Authorizations workspace, and claim resolution with simulated buyer notification.
- `ADMIN-06`: Operations Governance tab (Bulky Furniture Pre-Verification Gate, Serialized Inventory & Unit Economics, Immutable Lifecycle Audit Log).

---

## 4. Vitest Unit & Layout Suite Breakdown (17 Suites — 125 Tests)

| Test File | Tests | Focus |
|---|---|---|
| `tests/unit/admin-portal.test.ts` | 5 | 6 Admin tabs, EN/AR parity, `Customer_Service` workspace, RBAC server actions |
| `tests/unit/admin-subdomain-gate.test.ts` | 4 | 3-domain isolation (`customer` / `partner.*` / `admin.*`) & zero internal links in customer UI |
| `tests/unit/aging.test.ts` | 5 | 30–60–90+ day aging cascade & `Decommissioned_Aged` |
| `tests/unit/challenger-landing-and-footer.test.ts` | 17 | Landing & Footer links, AST key parity, sanitization, RTL classes |
| `tests/unit/challenger-layout-responsiveness.test.ts` | 19 | Real headless Chromium CSS layout checks at 320px/375px/768px/1280px (EN LTR & AR RTL) |
| `tests/unit/challenger-role-simulation.test.ts` | 13 | Role Simulator dropdown groups, 12 personas & edge cases |
| `tests/unit/challenger-ui-sanitization.test.ts` | 12 | Exhaustive codebase scan for zero `FR-`/`NFR-`/SQL jargon & zero physical CSS classes |
| `tests/unit/domain-engines.test.ts` | 7 | Pricing, state transitions, aging & warranty engines |
| `tests/unit/graduation-demo-scenarios.test.ts` | 7 | End-to-end domain scenario math (`TS-01`–`TS-12`) |
| `tests/unit/landing-and-footer.test.ts` | 8 | Root landing & footer EN/AR static rendering |
| `tests/unit/messages-parity.test.ts` | 3 | 100% key parity between `messages/en.json` and `messages/ar.json` |
| `tests/unit/pricing.test.ts` | 5 | Diagnostic range, batch split, harvested part rollup, 35% Tier 1 markup |
| `tests/unit/rbac.test.ts` | 4 | 8 DB roles, portal matrix & corporate Tax ID / CR validation |
| `tests/unit/role-simulation.test.ts` | 3 | Persona mapping integrity |
| `tests/unit/routing.test.ts` | 2 | `next-intl` locales & RTL detection |
| `tests/unit/theme-toggle.test.ts` | 4 | Class-based Light/Dark mode toggle & persistence |
| `tests/unit/ui-sanitization.test.ts` | 7 | Portal, document & error string sanitization |

---

## 5. Run Commands

```powershell
npx tsc --noEmit
npm run lint
npm test
npm run build
npm run test:e2e
```
