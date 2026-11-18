# Mustadama ("مُستدام") — Test Suite Verification & Readiness Guide

**Date:** 2026-11-06  
**Status:** READY & CERTIFIED  
**Integrity Mode:** Genuine Implementation (Zero Hardcoding / Zero Facades)

---

## 1. Overview & Test Architecture

Mustadama features a comprehensive, dual-tiered testing strategy ensuring end-to-end reliability across all 4 circular re-commerce subsystems, 12 simulation personas, authentic production branding, and bilingual parity:

1. **Unit & Integration Test Suite (`Vitest 5.0.5`):**
   - **Path:** `tests/unit/`
   - **Scope:** 14 test files covering UI sanitization, persona simulation logic, bilingual message parity, RBAC matrix, domain pricing engines, inventory aging calculations, layout responsiveness, and CSS stability across breakpoints.
   - **Execution Command:** `npm test` (or `npx vitest run`)
   - **Status:** 112 passed tests across 14 test files.

2. **End-to-End User Journey Test Suite (`Playwright 1.65.0`):**
   - **Path:** `tests/e2e/`
   - **Scope:** 6 test suites covering root landing page navigation, authentication & persona switching, certified storefront checkout & simulated payment, seller acquisition & dynamic questionnaires, partner operational lifecycle (courier, intake, inspection, refurbishment, dismantling), and admin MIS & sustainability KPIs.
   - **Execution Command:** `npm run test:e2e` (or `npx playwright test`)
   - **Browser Target:** Chromium (Desktop Chrome)
   - **Target URL:** `http://localhost:3000` (auto-managed via Next.js dev server in `playwright.config.ts`)

---

## 2. End-to-End Suite Inventory (`tests/e2e/`)

| Suite File | Scope & Target Subsystem | Key Scenarios Covered |
|---|---|---|
| `01-landing-page.spec.ts` | Root Landing Page & Navigation (R3) | Root redirect, hero section CTAs, 4 subsystem cards, auth gateways, 4-step circular process, SiteFooter, bilingual parity (LTR/RTL), mobile/desktop viewports, and zero internal requirement tags. |
| `02-auth-personas.spec.ts` | Role Simulation & Authentication (R1, Auth) | `<select data-testid="persona-select">` persona switching across all 12 SRS roles, automatic portal redirection, active session indicators, sign out, login form validation, and corporate registration toggle. |
| `03-storefront.spec.ts` | Certified Storefront Subsystem | Serialized catalog, Grade A/B/C condition filters, serialized item selection, 15-minute checkout reservation hold, multi-channel payment gateway (Card, Wallet, InstaPay), tax invoice link, delivery confirmation, and B2B corporate quotes. |
| `04-seller-portal.spec.ts` | Seller Acquisition Subsystem | Dynamic category diagnostic questions, live price estimation range, 3-photo upload requirements, handover method selection (Courier vs Partner Hub), single-item acquisition request, bulk liquidation manifest, and 7-day offer decision review. |
| `05-partner-portal.spec.ts` | Partner Operations Hub | Courier logistics custody, equal batch logistics cost allocation, warehouse intake serial barcode generation (`MST-2026-NNNNN`), technical inspection with mandatory NIST SP 800-88 data sanitization gate, refurbishment work orders, and dismantling scrap logging. |
| `06-admin-portal.spec.ts` | Admin MIS & Sustainability Dashboard | Real-time MIS metrics (e-waste diverted kg, sales revenue, margins, 30-60-90 aging inventory tiers), dynamic category schema builder, customer segmentation campaigns (SMS/Email), corporate quote approvals, and warranty claims queue. |

---

## 3. Quick Start & Execution Instructions

### Prerequisites
- Node.js v20+ or v24+
- Dependencies installed via `npm install`
- Chromium browser binaries installed via `npx playwright install chromium`

### Run Commands

```powershell
# Run all unit tests
npm test

# Run all Playwright E2E tests (headless Chromium)
npm run test:e2e

# Run a specific Playwright E2E suite
npx playwright test tests/e2e/01-landing-page.spec.ts

# View interactive HTML Playwright report
npx playwright show-report playwright-report

# Verify TypeScript type integrity
npx tsc --noEmit
```

---

## 4. Certification & Test Reports

- **Detailed Playwright Markdown Report:** `PLAYWRIGHT_TEST_REPORT.md`
- **Interactive HTML Report:** Generated under `playwright-report/index.html`
- **JSON Test Output:** Generated under `test-results/playwright-results.json`

