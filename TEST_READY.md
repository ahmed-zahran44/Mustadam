# Mustadama ("مُستدام") — Test Suite Verification & Readiness Guide

**Last Updated:** 2026-11-21  
**Status:** READY & VERIFIED  
**Stack:** Next.js `16.4.6` · Vitest `5.0.5` · Playwright `1.65.0` · Cloud Supabase

---

## 1. Dual-Tier Testing Architecture

1. **Unit, Sanitization & Layout Responsiveness Suite (`Vitest 5.0.5`):**
   - **Path:** `tests/unit/`
   - **Coverage:** **17 test files / 125 tests** covering domain engines (pricing, 35% Tier 1 markup, 30–60–90 aging, warranty, state machine), 8-role RBAC, 3-domain commercial subdomain isolation (`ADR-010`), 6-tab Admin & Customer Service workspace, Light/Dark theme toggle, bilingual `messages/en.json` & `messages/ar.json` parity, zero `FR-`/`NFR-` UI sanitization, and headless Chromium RTL/LTR layout responsiveness (320px–1280px).
   - **Command:** `npm test`

2. **End-to-End Multi-Domain Suite (`Playwright 1.65.0`):**
   - **Path:** `tests/e2e/`
   - **Coverage:** **6 suites / 42 scenarios** across all 3 isolated commercial domains (`http://localhost:3000`, `http://partner.localhost:3000`, `http://admin.localhost:3000`).
   - **Command:** `npm run test:e2e`

---

## 2. End-to-End Suite Inventory (`tests/e2e/`)

| Suite File | Target Domain | Scenarios | Key Coverage |
|---|---|---|---|
| `01-landing-page.spec.ts` | `localhost:3000` | 8 (`NAV-01`–`NAV-08`) | Customer landing page, zero `/partner` & `/admin` links, footer, EN/AR RTL switch, responsive viewports, UI sanitization |
| `02-auth-personas.spec.ts` | All 3 domains | 9 (`AUTH-01`–`AUTH-09`) | Consolidated 12-persona dropdown, `partner.*` & `admin.*` subdomain login gates, cross-subdomain `/api/auth/demo-switch`, sign out, customer login & corporate registration toggle |
| `03-storefront.spec.ts` | `localhost:3000` | 7 (`STORE-01`–`STORE-07`) | Serialized catalog, grade filters, 15-min checkout reservation lock & release, simulated multi-channel payment webhook, tax invoice link, B2B bulk quote |
| `04-seller-portal.spec.ts` | `localhost:3000` | 6 (`SELL-01`–`SELL-06`) | Dynamic diagnostic questionnaire & live valuation, 3-photo upload rules, Courier vs. Drop-off Hub handover, single & bulk liquidation, 7-day offer review |
| `05-partner-portal.spec.ts` | `partner.localhost:3000` | 6 (`PART-01`–`PART-06`) | Partner login gate, logistics custody, equal batch cost split, warehouse barcode intake, NIST SP 800-88 inspection gate, refurbishment rollup, dismantling & scrap |
| `06-admin-portal.spec.ts` | `admin.localhost:3000` | 6 (`ADMIN-01`–`ADMIN-06`) | Admin login gate, MIS KPIs & turnaround time, visual category builder & edit mode, customer directory & campaigns, B2B quotes, `Customer_Service` warranty & returns workspace, operations & immutable audit trail |

---

## 3. Quick Verification Commands

```powershell
# TypeScript & ESLint
npx tsc --noEmit
npm run lint

# Unit & CSS responsiveness suite (17 files, 125 tests)
npm test

# Production build (24 routes)
npm run build

# Full Playwright E2E suite (42 scenarios)
npm run test:e2e

# Single suite example
npx playwright test tests/e2e/06-admin-portal.spec.ts

# Interactive HTML report
npx playwright show-report playwright-report
```
