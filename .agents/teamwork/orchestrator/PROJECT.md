# Project: Mustadama UI Modernization & Production Readiness

## Architecture
- **Framework**: Next.js 16 (App Router) with React 19, Tailwind CSS, Lucide icons, next-intl for English (LTR) / Arabic (RTL).
- **Backend & Auth**: Supabase SSR (cookies `sb-<project-ref>-auth-token`), PostgreSQL database with 23 tables, 8 clean DB RBAC roles.
- **Portals**:
  - Root Landing Page (`/` -> `/[locale]`)
  - Seller Acquisition Portal (`/[locale]/seller`)
  - Buyer Serialized Re-Commerce Storefront (`/[locale]/store`)
  - Partner WMS & Technical Operations Hub (`/[locale]/partner`)
  - Core Admin & Sustainability MIS Dashboard (`/[locale]/admin`)
  - Authentication (`/[locale]/login`, `/[locale]/register`)
- **Simulation**: 12 Demo Personas mapped to 8 DB RBAC roles via Server Action `switchDemoPersonaAction`.
- **E2E Testing**: Playwright 1.65.0 with Chromium headless runner against local development server (`next dev --port 3000`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Consolidated Role Simulation Dropdown | Refactor 12 separate buttons into a single compact `<select data-testid="persona-select">` with 3 `<optgroup>` categories, housed in a sticky top or floating toolbar control accessible across pages | M1 | ORIGINAL_REQUEST R1 (DONE) |
| 2 | Persona Session Switching & Portal Routing | Maintain Server Action auth cookie switching and automatic redirection to default portal route with locale preservation | M1 | ORIGINAL_REQUEST R1 (DONE) |
| 3 | Toolbar UX & Notification Popover | Floating flyout notification popover, compact styling (~38px height), responsive mobile/desktop display | M1 | ORIGINAL_REQUEST R1 (DONE) |
| 4 | Academic Label Scrubbing in Localization | Remove all FR-XX, NFR-XX, "GRADUATION DEMO TOOLBAR", "SRS 6.2" tags from `messages/en.json` and `messages/ar.json` while maintaining 100% key parity | M2 | ORIGINAL_REQUEST R2 (DONE) |
| 5 | UI Component Sanitization across Portals | Scrub 62 exposed requirement codes and academic labels across Seller, Partner, Storefront, and Admin portals, toast messages, and modals | M2 | ORIGINAL_REQUEST R2 (DONE) |
| 6 | Statutory Document & API Sanitization | Scrub requirement references in tax invoice PDF route, NIST destruction certificate route, and domain server action error messages | M2 | ORIGINAL_REQUEST R2 (DONE) |
| 7 | Directional LTR/RTL Parity Verification | Ensure all sanitized copy preserves Tailwind logical classes (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`) and bidirectional numbers | M2 | ORIGINAL_REQUEST R2 (DONE) |
| 8 | Polished Root Landing Page | High-conversion, responsive public front door at `/` with Hero, 4 Subsystem Cards, Circular Lifecycle pipeline, Trust badges, and Sustainability metrics | M3 | ORIGINAL_REQUEST R3 (DONE) |
| 9 | Production Site Footer Component | Reusable `SiteFooter` component integrated into root layout with navigation links to portals, auth, and platform info | M3 | ORIGINAL_REQUEST R3 (DONE) |
| 10 | Bilingual Landing Page Parity | Complete English and Arabic translations for landing page and footer with responsive mobile/desktop styling | M3 | ORIGINAL_REQUEST R3 (DONE) |
| 11 | Playwright Test Harness & Configuration | `playwright.config.ts`, `npm run test:e2e` script, webServer integration pointing to `http://localhost:3000` | M4 (E2E Track) | ORIGINAL_REQUEST R4 |
| 12 | E2E User Journey Scenarios | Comprehensive test suites covering Landing Page, Auth & Persona Switching, Storefront, Seller, Partner, and Admin | M4 (E2E Track) | ORIGINAL_REQUEST R4 |
| 13 | Playwright Test Execution & Comprehensive Report | Execute 100% of test scenarios and generate `PLAYWRIGHT_TEST_REPORT.md` documenting execution results, coverage, and pass status | M4 (E2E Track) | ORIGINAL_REQUEST R4 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Role Simulation Dropdown | Refactor 12-button toolbar into compact dropdown with 3 optgroups, docked/floating toolbar, popover notifications | None | DONE |
| M2 | Authentic UI & Academic Label Scrubbing | Clean 62 requirement codes across 10 files (localization, 4 portals, document routes, domain actions) | M1 | DONE |
| M3 | Root Landing Page & Site Footer | Build production landing page at `/` with 6 sections, responsive layout, SiteFooter, bilingual parity | M1, M2 | DONE |
| M4 | E2E Testing Suite & Execution Report | Implement Playwright test suites (6 specs), execute all journeys, publish TEST_READY.md and PLAYWRIGHT_TEST_REPORT.md | M1, M2, M3 | IN_PROGRESS |

## Interface Contracts
### Toolbar ↔ Auth & Routing
- Component: `src/components/demo/graduation-demo-toolbar.tsx`
- Element: `<select id="persona-select" data-testid="persona-select">`
- Event handler: calls `switchDemoPersonaAction(personaId)` from `src/lib/auth/actions.ts`
- Redirection: `router.push(persona.defaultRoute)` via `@/i18n/navigation` preserving `[locale]` prefix

### Localization Contract
- Files: `messages/en.json` and `messages/ar.json`
- Rule: 100% key parity verified by `tests/unit/messages-parity.test.ts`
- Convention: No `FR-` or `NFR-` in any translated string

### Root Route ↔ Portals
- Route: `src/app/[locale]/page.tsx`
- Links:
  - Marketplace: `/store`
  - Seller Portal: `/seller`
  - Partner Operations: `/partner`
  - Administration: `/admin`
  - Auth: `/login`, `/register`

### E2E Test Contract
- Target URL: `http://localhost:3000/[locale]`
- Persona selector: `select[data-testid="persona-select"]`
- Test command: `npx playwright test`
- Report output: `PLAYWRIGHT_TEST_REPORT.md` and HTML test report

## Code Layout
- `src/components/demo/`: Role simulation dropdown and wrapper (M1 - DONE)
- `src/components/seller/`: Seller portal client and wizard (M2 - DONE)
- `src/components/partner/`: Partner hub client and tabs (M2 - DONE)
- `src/components/store/`: Storefront client, cart, checkout (M2 - DONE)
- `src/components/admin/`: Admin MIS dashboard and management tabs (M2 - DONE)
- `messages/`: Bilingual translation JSON files (`en.json`, `ar.json`) (M2 - DONE, M3 - DONE)
- `src/components/layout/`: Header, footer (`site-footer.tsx`), navigation (M3 - DONE)
- `src/app/[locale]/`: App router pages (`page.tsx`, `layout.tsx`) (M3 - DONE)
- `tests/e2e/`: Playwright end-to-end test spec files (M4 - IN_PROGRESS)
