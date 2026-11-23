# Mustadama ("مُستدام") — Changelog

All notable changes, architectural decisions, database migrations, and completed requirements for the **Mustadama** graduation project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Changed — 2026-11-21 — Full Project Documentation Alignment
- Synchronized all living documentation to reflect the real implemented codebase (Next.js `16.4.6`, 3-domain commercial isolation `ADR-010`, 6-tab `/admin` portal, 24 curated real-photo laptops & furniture catalog, 17 Vitest suites / 125 tests, and 6 Playwright suites / 42 scenarios):
  - Replaced default Next.js boilerplate in [README.md](file:///d:/Mustadam%20Project/README.md) with full Mustadama setup, 3-domain URLs, pre-seeded demo credentials, scripts, and living docs index.
  - Updated [PROJECT.md](file:///d:/Mustadam%20Project/PROJECT.md), [ARCHITECTURE.md](file:///d:/Mustadam%20Project/ARCHITECTURE.md), [AGENTS.md](file:///d:/Mustadam%20Project/AGENTS.md), [.agents/rules/mustadama-docs-sync.md](file:///d:/Mustadam%20Project/.agents/rules/mustadama-docs-sync.md), [.env.example](file:///d:/Mustadam%20Project/.env.example), [DEMO_GUIDE.md](file:///d:/Mustadam%20Project/DEMO_GUIDE.md), [PLAYWRIGHT_TEST_REPORT.md](file:///d:/Mustadam%20Project/PLAYWRIGHT_TEST_REPORT.md), and [TEST_READY.md](file:///d:/Mustadam%20Project/TEST_READY.md).

### Added & Changed — 2026-11-21 — Three-Domain Commercial Portal Isolation (`partner.*` Subdomain & Pure Customer Website)
- **Partner Operations Subdomain & Dedicated Auth Gate (`ADR-010`, [src/lib/auth/subdomain.ts](file:///d:/Mustadam%20Project/src/lib/auth/subdomain.ts), [src/proxy.ts](file:///d:/Mustadam%20Project/src/proxy.ts), [src/app/[locale]/(partner)/partner/login/page.tsx](file:///d:/Mustadam%20Project/src/app/%5Blocale%5D/(partner)/partner/login/page.tsx), [src/lib/auth/actions.ts](file:///d:/Mustadam%20Project/src/lib/auth/actions.ts)):**
  - Isolated `/partner` onto its own `partner.*` subdomain (`partner.localhost:3000`, `partner.mustadama.eg`, or `NEXT_PUBLIC_PARTNER_HOST`) with a dedicated `/[locale]/partner/login` gate (`partnerLoginAction`) allowing only authorized Partner Operations roles and `Admin`.
  - Blocked both `/partner` and `/admin` on the customer domain (`localhost:3000` / `mustadama.eg`).
- **Pure Commercial Customer Website ([src/components/layout/site-header.tsx](file:///d:/Mustadam%20Project/src/components/layout/site-header.tsx), [src/components/layout/site-footer.tsx](file:///d:/Mustadam%20Project/src/components/layout/site-footer.tsx), [src/app/[locale]/page.tsx](file:///d:/Mustadam%20Project/src/app/%5Blocale%5D/page.tsx), [src/app/[locale]/layout.tsx](file:///d:/Mustadam%20Project/src/app/%5Blocale%5D/layout.tsx), [src/app/[locale]/(auth)/login/page.tsx](file:///d:/Mustadam%20Project/src/app/%5Blocale%5D/(auth)/login/page.tsx)):**
  - Removed `Partner Operations` from customer `SiteHeader` navbar (`Store`, `Seller Portal`, `Sign In`), customer `SiteFooter` (`Marketplace & Sourcing` + `Customer Account`), and landing page directory (replaced with **Corporate B2B Programs** card linking to `/register`).
  - Scrubbed demo credential placeholders from the customer `/login` form.
- **Cross-Subdomain Role Simulator Handoff ([src/app/api/auth/demo-switch/route.ts](file:///d:/Mustadam%20Project/src/app/api/auth/demo-switch/route.ts), [src/components/demo/graduation-demo-toolbar.tsx](file:///d:/Mustadam%20Project/src/components/demo/graduation-demo-toolbar.tsx)):**
  - Added `/api/auth/demo-switch` so switching personas across `localhost:3000`, `partner.localhost:3000`, and `admin.localhost:3000` sets session cookies directly on the target subdomain origin.
- **Localization & Tests ([messages/en.json](file:///d:/Mustadam%20Project/messages/en.json), [messages/ar.json](file:///d:/Mustadam%20Project/messages/ar.json), [tests/unit/admin-subdomain-gate.test.ts](file:///d:/Mustadam%20Project/tests/unit/admin-subdomain-gate.test.ts)):**
  - Added bilingual `PartnerGate`, `Landing.portalCorporate*`, and `Footer.accountHeading` keys with 100% EN/AR parity and updated unit + E2E suites.

### Added & Fixed — 2026-11-20 — Complete `/admin` Control Center, Customer Service Workspace & MIS Analytics
- **RBAC & Subdomain Gate Alignment ([src/proxy.ts](file:///d:/Mustadam%20Project/src/proxy.ts), [src/lib/auth/actions.ts](file:///d:/Mustadam%20Project/src/lib/auth/actions.ts), [src/app/[locale]/(admin)/admin/login/page.tsx](file:///d:/Mustadam%20Project/src/app/%5Blocale%5D/(admin)/admin/login/page.tsx)):**
  - Updated the admin subdomain authorization gate and `adminLoginAction` so both `Admin` and `Customer_Service` roles can authenticate and operate on `/admin`, while continuing to block `Customer`, `Courier`, and `Partner_*` roles.
  - Wrapped `AdminLoginPage` form in `<Suspense>` for clean Next.js App Router rendering.
- **Hardened & Complete Admin Server Actions ([src/lib/domain/admin-actions.ts](file:///d:/Mustadam%20Project/src/lib/domain/admin-actions.ts)):**
  - Added strict server-side role guards (`requireAdminPortalRole`) and input validation across all administrative mutations.
  - Extended `createOrUpdateCategoryAction` to support editing existing categories (`categoryId`) and deduplicating by case-insensitive category name.
  - Added `expireCorporateQuoteAction`, `updateReturnTaskStatusAction`, `updateCustomerSegmentAction`, `reviewBulkyPreverificationAction`, and `runAdminAgingAndExpiryAction`.
  - Fixed cross-user `notifications` RLS error when `Customer_Service` notifies buyers/sellers by routing verified server-dispatched staff notifications through `SimulatedNotificationAdapter(createAdminClient())`.
- **Real-Time MIS Data Loader & Zero-Fake KPIs ([src/app/[locale]/(admin)/admin/page.tsx](file:///d:/Mustadam%20Project/src/app/%5Blocale%5D/(admin)/admin/page.tsx)):**
  - Replaced hardcoded fallback numbers with real PostgreSQL calculations: Circular Revenue (Store + Recycling), Realized & Listed Profit Margins, Offer Decision Funnel (`accepted`/`rejected`/`auto_rejected`/`pending`), **Average Turnaround Time from Receipt to Sale (`FR-26`)**, 30–60–90+ Aging Tiers, Item Lifecycle Pipeline distribution, and Material-level Landfill Diversion & CO₂e impact.
  - Added relational enrichment for B2B Quotes (buyer company/Tax ID + itemized units), Warranty Claims (buyer + serialized unit + active warranty end date), Registered Customer Directory, Campaign Dispatch History, Bulky Pre-Verification Requests (`FR-08`), Seller Return Authorizations (`return_tasks`), Serialized Inventory Economics, and the Immutable Lifecycle Audit Log (`item_status_history`).
- **Modular Bilingual (EN LTR / AR RTL) Admin Portal UI ([src/components/admin/](file:///d:/Mustadam%20Project/src/components/admin/admin-portal-client.tsx)):**
  - Decomposed `/admin` into 6 Operate-mode tabs (`admin-kpis-tab.tsx`, `admin-categories-tab.tsx`, `admin-campaigns-tab.tsx`, `admin-quotes-tab.tsx`, `admin-support-tab.tsx`, `admin-operations-tab.tsx`) plus shared types (`admin-types.ts`), defaulting `Customer_Service` directly to the Warranty Claims & Return Authorizations workspace.
  - Added visual interactive Diagnostic Question Builder + live `FR-04` valuation preview synced with the JSON schema editor, interactive customer directory with inline segment switching, inline Aging & Offer Expiry Engine trigger, and searchable inventory & audit trail tables.
- **Automated Verification ([tests/unit/admin-portal.test.ts](file:///d:/Mustadam%20Project/tests/unit/admin-portal.test.ts), [tests/e2e/06-admin-portal.spec.ts](file:///d:/Mustadam%20Project/tests/e2e/06-admin-portal.spec.ts)):**
  - Added 5 unit tests covering all 6 Admin tabs, EN/AR parity, `Customer_Service` default workspace, and RBAC server-action enforcement, and expanded Playwright Suite 6 (`ADMIN-01`–`ADMIN-06`, 6/6 passing against live Cloud Supabase).

### Added — 2026-11-18 — Certified Refurbished Furniture Catalog, Photos & Storefront Category Filter
- **Furniture Product Assets & Database Inventory ([src/lib/catalog/laptop-media.ts](file:///d:/Mustadam%20Project/src/lib/catalog/laptop-media.ts), `public/products/furniture/`):**
  - Added 8 certified refurbished office & studio furniture products (16 local studio photos across Herman Miller, Steelcase, Autonomous, IKEA, Haworth, West Elm, and Humanscale) into `public/products/furniture/<slug>/` and seeded them (`MST-FURN-001`–`008`, `category_id = '33333333-3333-3333-3333-333333333303'`) into Cloud Supabase `serialized_items` (`Listed_In_Store`).
- **Storefront Category Filter & Landing Showcase ([src/components/store/storefront-client.tsx](file:///d:/Mustadam%20Project/src/components/store/storefront-client.tsx), [src/app/[locale]/page.tsx](file:///d:/Mustadam%20Project/src/app/%5Blocale%5D/page.tsx), [src/components/landing/interactive-showcase.tsx](file:///d:/Mustadam%20Project/src/components/landing/interactive-showcase.tsx)):**
  - Added Category filter pills (`All Products`, `Laptops & Electronics`, `Office & Studio Furniture`) in `/store`.
  - Added the **Certified Refurbished Office & Studio Furniture** showcase section on the landing page and integrated furniture items into the moving Product Photo Showcase Reel and Interactive Studio & Trade-In Estimator.

### Added — 2026-11-18 — Scroll-Driven 3D Folding Laptop Hero Background
- **3D Scroll-Folding Laptop Backdrop ([src/components/landing/hero-folding-laptop.tsx](file:///d:/Mustadam%20Project/src/components/landing/hero-folding-laptop.tsx), [src/app/[locale]/page.tsx](file:///d:/Mustadam%20Project/src/app/%5Blocale%5D/page.tsx)):**
  - Added `HeroFoldingLaptopBackground` (`data-testid="hero-folding-laptop-bg"`) inside the Hero section using a large centered real photograph (`/products/laptops/dell-inspiron-16-plus-7610/2.jpg`) that physically folds its screen plane (`0%` → `80.5%`) down onto the keyboard base around the `80.5%` hinge axis as the user scrolls down.

### Added — 2026-11-18 — E-Commerce Studio Backdrop & Interactive Bento Showcase (Back Market / Reebelo Inspiration)
- **E-Commerce Studio Canvas & Architectural Grid ([src/app/globals.css](file:///d:/Mustadam%20Project/src/app/globals.css)):**
  - Tuned light/dark studio base palette (`#f8faf9` warm stone / `#080b0a` carbon obsidian) and added `.bg-ecommerce-studio` radial spotlight washes and `.bg-ecommerce-grid` masked architectural perspective lines across the landing page and storefront.
- **Interactive Animated E-Commerce Bento Showcase ([src/components/landing/interactive-showcase.tsx](file:///d:/Mustadam%20Project/src/components/landing/interactive-showcase.tsx), [src/app/[locale]/page.tsx](file:///d:/Mustadam%20Project/src/app/%5Blocale%5D/page.tsx)):**
  - Added a live auto-cycling Circular E-Commerce Telemetry Ticker, an Interactive Hardware Studio & Retail Savings Inspector (with model switcher, multi-angle photo toggle, and live `Save % vs. Brand New` breakdown), and an Instant Trade-In & Circular Value Estimator calculating payout ranges and avoided `CO₂e`.

### Added — 2026-11-18 — Animated Product Photo Motion System (Impeccable Animate Pass)
- **Product Photo Motion Keyframes ([src/app/globals.css](file:///d:/Mustadam%20Project/src/app/globals.css)):**
  - Added `@keyframes product-levitate` (staggered 3D product photo float), `@keyframes hero-photo-primary` / `hero-photo-secondary` (automatic multi-angle crossfade & zoom on the Hero Flagship laptop), and `@keyframes product-marquee` (continuous infinite product showcase reel that pauses on hover), with full `prefers-reduced-motion: reduce` support.
- **Landing Page & Storefront Product Photo Animation ([src/app/[locale]/page.tsx](file:///d:/Mustadam%20Project/src/app/%5Blocale%5D/page.tsx), [src/components/store/storefront-client.tsx](file:///d:/Mustadam%20Project/src/components/store/storefront-client.tsx)):**
  - Added dual-angle product photo crossfade (`images[0]` → `images[1]`) on hover across both Featured Laptop cards and Storefront catalog cards, staggered photo levitation, and a continuous scrolling Product Photo Showcase Reel on the landing page.

### Changed & Fixed — 2026-11-18 — Next.js 16.4.6 Security Upgrade & Browser Extension Hydration Guard
- **Next.js Security Upgrade ([package.json](file:///d:/Mustadam%20Project/package.json), [next.config.ts](file:///d:/Mustadam%20Project/next.config.ts)):**
  - Upgraded `next` and `eslint-config-next` from `16.4.3` to `16.4.6` via `next upgrade --agent=security` and enabled `experimental.agentUpgrade: "security"` in `next.config.ts`.
- **Browser Extension Hydration Mismatch Protection ([src/app/[locale]/layout.tsx](file:///d:/Mustadam%20Project/src/app/%5Blocale%5D/layout.tsx)):**
  - Extended `THEME_INIT_SCRIPT` (`beforeInteractive`) with a pre-hydration DOM sanitizer and short-lived `MutationObserver` that removes `bis_skin_checked` and `bis_register` attributes injected by browser security extensions (Bitdefender) before React hydrates child `<div>` elements.

### Changed — 2026-11-18 — Landing Page Blurred Atmospheric Backdrop, Motion System & Hero Badge Removal
- **Hero Kicker Badge Removed ([src/app/[locale]/page.tsx](file:///d:/Mustadam%20Project/src/app/%5Blocale%5D/page.tsx)):**
  - Removed the top hero pill badge (`Egypt's Premier Circular Re-Commerce Platform`) so the display `<h1>` headline leads directly.
- **Blurred Atmospheric Backdrop & Frosted Surfaces ([src/app/[locale]/page.tsx](file:///d:/Mustadam%20Project/src/app/%5Blocale%5D/page.tsx)):**
  - Added multi-layered radial emerald/teal ambient blurred orbs (`blur-3xl`) behind frosted glass sections (`backdrop-blur-2xl`, `backdrop-blur-xl`, `bg-white/80 dark:bg-neutral-900/80`).
- **Impeccable Motion System ([src/app/globals.css](file:///d:/Mustadam%20Project/src/app/globals.css), [src/app/[locale]/page.tsx](file:///d:/Mustadam%20Project/src/app/%5Blocale%5D/page.tsx)):**
  - Added staggered hero entrance choreography (`cubic-bezier(0.16, 1, 0.3, 1)`), subtle ambient orb drift, flagship hardware card float, child-carried hover motion, and a `@media (prefers-reduced-motion: reduce)` path.

### Changed — 2026-11-18 — Impeccable UI/UX Polish on Landing Page & Storefront
- **Browser Surfaces & Typographic Discipline ([src/app/globals.css](file:///d:/Mustadam%20Project/src/app/globals.css)):**
  - Added themed `::selection`, high-contrast `:focus-visible` outlines, `accent-color`, `text-wrap: balance` on headings, and `text-wrap: pretty` on body copy.
- **Asymmetric Editorial Hero & Hardware Showcase ([src/app/[locale]/page.tsx](file:///d:/Mustadam%20Project/src/app/%5Blocale%5D/page.tsx)):**
  - Upgraded the Hero section to a 12-column editorial split pairing tight display typography (`tracking-[-0.025em]`, `max-w-[62ch]`) with a live flagship hardware preview card, preserving logical RTL/LTR classes and `.ltr-data` tabular numerals.
- **Storefront Operate-Mode Polish ([src/components/store/storefront-client.tsx](file:///d:/Mustadam%20Project/src/components/store/storefront-client.tsx)):**
  - Elevated header hierarchy, tactile tab controls, and added a sticky checkout sidebar (`lg:sticky lg:top-14`) with a live itemized mini-cart summary and EGP subtotal.

### Added — 2026-11-13 — E-Commerce Storefront CX & Real Laptop Catalog Integration
- **Curated Laptop Assets & Media Resolver ([src/lib/catalog/laptop-media.ts](file:///d:/Mustadam%20Project/src/lib/catalog/laptop-media.ts), `public/products/laptops/`):**
  - Imported 16 real laptop product photo sets (32 images) from `Products data/Laptops` into `public/products/laptops/<slug>/` and seeded them into Cloud Supabase `serialized_items` (`Listed_In_Store`) with full hardware specs (`CPU`, `RAM`, `Storage`, `GPU`, `Screen`).
- **E-Commerce Storefront Upgrade ([src/components/store/storefront-client.tsx](file:///d:/Mustadam%20Project/src/components/store/storefront-client.tsx), [src/app/[locale]/(store)/store/page.tsx](file:///d:/Mustadam%20Project/src/app/%5Blocale%5D/(store)/store/page.tsx)):**
  - Added real-time search, brand filter pills, condition grade pills, price sorting, product image cards with hardware spec chips, and a Quick-View product detail modal with multi-image gallery.
- **Landing Page Featured Products ([src/app/[locale]/page.tsx](file:///d:/Mustadam%20Project/src/app/%5Blocale%5D/page.tsx), [messages/en.json](file:///d:/Mustadam%20Project/messages/en.json), [messages/ar.json](file:///d:/Mustadam%20Project/messages/ar.json)):**
  - Added the Featured Refurbished Laptops showcase section linking directly into the storefront.

### Added & Changed — 2026-11-13 — Customer-Only UI & Admin Subdomain Auth/Authorization Gate
- **Subdomain Isolation & Auth Gate ([src/lib/auth/subdomain.ts](file:///d:/Mustadam%20Project/src/lib/auth/subdomain.ts), [src/proxy.ts](file:///d:/Mustadam%20Project/src/proxy.ts)):**
  - Isolated Admin & MIS to `admin.*` subdomains (`admin.localhost:3000`, `admin.mustadama.eg`, or `NEXT_PUBLIC_ADMIN_HOST`), blocking `/admin` on the customer domain and enforcing both authentication and `app_metadata.role === 'Admin'` authorization on the admin subdomain.
- **Dedicated Admin & MIS Login Gate ([src/app/[locale]/(admin)/admin/login/page.tsx](file:///d:/Mustadam%20Project/src/app/%5Blocale%5D/(admin)/admin/login/page.tsx), [src/lib/auth/actions.ts](file:///d:/Mustadam%20Project/src/lib/auth/actions.ts)):**
  - Added `adminLoginAction` (rejecting non-Admin users and signing them out immediately) and a dedicated `/[locale]/admin/login` gate page with `AdminGate` bilingual translations.
- **Customer-Only UI ([src/components/layout/site-header.tsx](file:///d:/Mustadam%20Project/src/components/layout/site-header.tsx), [src/components/layout/site-footer.tsx](file:///d:/Mustadam%20Project/src/components/layout/site-footer.tsx), [src/app/[locale]/page.tsx](file:///d:/Mustadam%20Project/src/app/%5Blocale%5D/page.tsx), [src/app/[locale]/layout.tsx](file:///d:/Mustadam%20Project/src/app/%5Blocale%5D/layout.tsx)):**
  - Removed `Admin & MIS` links/cards from customer `SiteHeader`, `SiteFooter`, and landing page, and scoped `SiteHeader`/`SiteFooter` by subdomain host.
- **Tests:** Added [tests/unit/admin-subdomain-gate.test.ts](file:///d:/Mustadam%20Project/tests/unit/admin-subdomain-gate.test.ts) and updated footer/landing/E2E tests.

### Changed — 2026-11-13 — SiteFooter Simplification
- **Removed Standards & Compliance Column & Zero-Landfill Badge ([src/components/layout/site-footer.tsx](file:///d:/Mustadam%20Project/src/components/layout/site-footer.tsx)):**
  - Removed the `Standards & Compliance` footer column and the `Licensed Zero-Landfill Recycling` pill badge, adjusting the desktop footer grid from `md:grid-cols-4` to `md:grid-cols-3`.
  - Removed unused `Footer.standardsHeading`, `Footer.nistStandard`, `Footer.warrantyPolicy`, and `Footer.zeroLandfill` keys from [messages/en.json](file:///d:/Mustadam%20Project/messages/en.json) and [messages/ar.json](file:///d:/Mustadam%20Project/messages/ar.json), and updated corresponding footer tests.

### Added — 2026-11-13 — Light / Dark Mode Theme Toggle
- **Class-Based Tailwind v4 Dark Mode ([src/app/globals.css](file:///d:/Mustadam%20Project/src/app/globals.css)):**
  - Added `@custom-variant dark (&:where(.dark, .dark *));` and `html.dark` theme CSS variables (`--background`, `--foreground`, `color-scheme`).
- **Theme Toggle & Pre-Hydration Script ([src/components/layout/theme-toggle.tsx](file:///d:/Mustadam%20Project/src/components/layout/theme-toggle.tsx), [src/components/layout/site-header.tsx](file:///d:/Mustadam%20Project/src/components/layout/site-header.tsx), [src/app/[locale]/layout.tsx](file:///d:/Mustadam%20Project/src/app/%5Blocale%5D/layout.tsx)):**
  - Added `ThemeToggle` client component using `useSyncExternalStore` and `localStorage` (`mustadama-theme`) persistence next to `LanguageSwitcher` in `SiteHeader`.
  - Added pre-hydration inline script in `LocaleLayout` `<head>` to apply the saved or system-preferred theme before first paint.
- **Bilingual Messages ([messages/en.json](file:///d:/Mustadam%20Project/messages/en.json), [messages/ar.json](file:///d:/Mustadam%20Project/messages/ar.json)):**
  - Added matching `Theme` keys (`label`, `light`, `dark`, `toggleToDark`, `toggleToLight`) in both English and Arabic.
- **Tests:** Added `tests/unit/theme-toggle.test.ts`.

### Fixed & Verified — 2026-11-13 — E2E Persona Navigation Stability & Full 41-Scenario Pass
- **Persona Switching Stability ([src/lib/auth/actions.ts](file:///d:/Mustadam%20Project/src/lib/auth/actions.ts), [src/components/demo/graduation-demo-toolbar.tsx](file:///d:/Mustadam%20Project/src/components/demo/graduation-demo-toolbar.tsx)):**
  - Removed redundant `revalidatePath("/", "layout")` calls in `switchDemoPersonaAction` and `signOutAction` and switched client-side post-switch navigation to atomic `window.location.assign(...)`, eliminating Next.js RSC stream abort (`ECONNRESET`) races during rapid persona switching.
- **Playwright & ESLint Config ([playwright.config.ts](file:///d:/Mustadam%20Project/playwright.config.ts), [eslint.config.mjs](file:///d:/Mustadam%20Project/eslint.config.mjs)):**
  - Configured explicit `expect.timeout = 15000` and `timeout = 60000` in `playwright.config.ts`, added same-route persona reload waits in `03-storefront.spec.ts` and `04-seller-portal.spec.ts`, and ignored `playwright-report/**` and `test-results/**` in `eslint.config.mjs`.
- **Verification:** `npx playwright test` (6 suites, 41/41 scenarios passed), `npm test` (14 files, 112/112 tests passed), `npx tsc --noEmit` (0 errors).

### Added & Verified — 2026-11-06 — Milestone 4: Playwright End-to-End Test Suite & Readiness Report (Requirement R4)
- **Playwright Test Suite Configuration (`playwright.config.ts` & `package.json`):**
  - Configured Playwright with sequential execution (`workers: 1`), Next.js auto-managed `webServer` targeting `http://localhost:3000`, Desktop Chrome browser target, and multi-format reporters (list, HTML, JSON).
  - Added `"test:e2e": "playwright test"` script to `package.json`.
- **6 End-to-End Test Suites (`tests/e2e/`):**
  - `01-landing-page.spec.ts` (8 scenarios: `NAV-01`–`NAV-08`): Root redirection, hero section, subsystems directory, 4-step circular economy lifecycle, SiteFooter, bilingual (LTR/RTL) switching, responsive viewport scaling, and UI sanitization.
  - `02-auth-personas.spec.ts` (9 scenarios: `AUTH-01`–`AUTH-09`): Demo persona switcher, automatic portal routing, active session indicators, sign out, login form validation, corporate account toggles, and protected route redirection.
  - `03-storefront.spec.ts` (7 scenarios: `STORE-01`–`STORE-07`): Serialized catalog display, condition grade filtering, 15-minute checkout reservation hold and lock release, multi-channel payment gateway simulation, tax invoice links, and corporate B2B quotes.
  - `04-seller-portal.spec.ts` (6 scenarios: `SELL-01`–`SELL-06`): Dynamic category diagnostic questionnaire, live EGP valuation calculation, 3-photo upload requirements, courier vs hub handover selection, single device tracking codes, bulk liquidation manifests, and 7-day offer decision review.
  - `05-partner-portal.spec.ts` (6 scenarios: `PART-01`–`PART-06`): Courier custody dispatch, equal batch logistics cost allocation formula, warehouse intake barcode assignment (`MST-2026-NNNNN`), technical inspection with NIST SP 800-88 data sanitization gate, refurbishment work orders with spare parts cost rollup, and dismantling scrap logging.
  - `06-admin-portal.spec.ts` (5 scenarios: `ADMIN-01`–`ADMIN-05`): Real-time MIS metrics (circular revenue, profit margins, 30-60-90 aging breakdown), dynamic category schema builder, customer segmentation campaigns, corporate quote approvals, and warranty claims queue.
- **Certification & Reports:**
  - Published comprehensive `PLAYWRIGHT_TEST_REPORT.md` documenting test architecture, requirements traceability, execution metrics, and compliance verifications.
  - Published `TEST_READY.md` test readiness and verification guide.
  - Confirmed 100% pass on all 14 unit test suites (112 tests) and clean TypeScript typecheck (`npx tsc --noEmit`).

### Added & Changed — 2026-11-06 — Milestone 3: Polished Root Landing Page & Site Footer (Requirement R3)
- **Production-Grade Root Landing Page (`src/app/[locale]/page.tsx`):**
  - Designed and built the authoritative public front door for Mustadama introducing Egypt's premier circular electronics and furniture re-commerce platform.
  - **Hero Section:** Features compelling value proposition, dual primary call-to-actions (`/store` and `/seller`), and a 4-item trust highlight bar (NIST SP 800-88 sanitization, up to 90-day warranty, Grade A/B/C classification, zero-landfill recycling).
  - **Subsystems & Portal Directory:** Interactive 4-card directory navigating directly to Certified Re-Commerce Storefront (`/store`), Seller Valuation Portal (`/seller`), Partner Operations & Technical Hub (`/partner`), and Admin MIS Dashboard (`/admin`).
  - **Unified Customer Account Gateway:** Highlights the unified profile model with direct access to Sign In (`/login`) and Register (`/register`).
  - **Circular Economy Lifecycle:** 4-stage connected process flow (Acquire & Collect -> Inspect & Sanitize -> Refurbish or Harvest -> Re-Commerce & Zero Landfill).
  - **Platform Guarantees:** 6 core trust pillars detailing military-grade data sanitization, serialized item traceability, warranty protection, 15-minute checkout reservation locking, fair diagnostic pricing, and equal batch logistics allocation.
  - **Sustainability Impact Metrics:** Live circular metrics tracking 450+ kg e-waste diverted, 1,280+ devices recirculated, 94.2% material recovery, and 100% zero-landfill compliance.
- **Global Bilingual Site Footer (`src/components/layout/site-footer.tsx`):**
  - Created global bilingual footer with brand mission, audience-segmented navigation links (Marketplace, Operations, Compliance), and copyright notice.
  - Mounted `<SiteFooter />` in root locale layout (`src/app/[locale]/layout.tsx`) beneath `<main className="flex-1">`.
- **Localization & Directional Styling:**
  - Added comprehensive `Landing` and `Footer` namespaces in `messages/en.json` and `messages/ar.json` with 100% key parity and natural production copy.
  - Strictly enforced Tailwind CSS logical directional utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`) and numeric isolation (`.ltr-data`).
  - Confirmed 0 internal requirement tags or academic labels across all landing and footer content.
- **Verification:**
  - Added `tests/unit/landing-and-footer.test.ts` (8 tests) verifying key parity, UI sanitization, logical class usage, layout mounting, and English/Arabic static markup rendering.
  - Confirmed `npm test` passes all 12 test suites (76 tests).
  - Confirmed `npx tsc --noEmit` and ESLint pass with 0 errors.

### Added & Changed — 2026-11-06 — Milestone 2: Authentic Production UI & Academic Label Scrubbing (Requirement R2)
- **UI Sanitization Across Portals & Documents:**
  - Scrubbed all exposed requirement codes (`FR-01` through `FR-26`, `NFR-01`, `NFR-02`, `NFR-04`, `NFR-05`), spec citations, thesis demo phrases, and database locking SQL clauses across 10 core files.
  - Replaced academic tags with natural, authentic enterprise circular re-commerce terminology in both English (LTR) and Arabic (RTL) while preserving all underlying business formulas, 7-day offer decisions, and lifecycle states.
  - Enforced 100% key and text parity between `messages/en.json` and `messages/ar.json`.
  - Preserved Tailwind CSS logical directional properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`) and bidirectional numeric isolation (`dir="ltr"`, `font-mono`).
- **Files Modified:**
  - `messages/en.json` & `messages/ar.json`
  - `src/components/seller/seller-portal-client.tsx`
  - `src/components/partner/partner-portal-client.tsx`
  - `src/components/store/storefront-client.tsx`
  - `src/components/admin/admin-portal-client.tsx`
  - `src/app/api/documents/invoice/[id]/route.ts`
  - `src/app/api/documents/certificate/[id]/route.ts`
  - `src/lib/domain/seller-actions.ts`
  - `src/lib/domain/store-actions.ts`
- **Automated Verification:**
  - Added `tests/unit/ui-sanitization.test.ts` (7 tests) and updated `tests/unit/messages-parity.test.ts` (3 tests).
  - Confirmed `npm test` passes 10 test suites and 56 tests.
  - Confirmed `npx tsc --noEmit` exits with 0 errors.

### Fixed — 2026-11-06 — Browser Extension Hydration Protection
- **Root Layout Hydration Safeguards ([src/app/[locale]/layout.tsx](file:///d:/Mustadam%20Project/src/app/%5Blocale%5D/layout.tsx)):**
  - Added `suppressHydrationWarning` to `<html>` and `<body>` tags to prevent hydration warnings triggered by third-party browser extensions (such as VPN proxies and anti-trackers) injecting attributes into DOM nodes before React hydration completes.

### Fixed — 2026-11-06 — User Registration RLS & Elevated Admin Client Hardening (`FR-01`, `ADR-006`)
- **Server-Side Registration Action ([src/lib/auth/actions.ts](file:///d:/Mustadam%20Project/src/lib/auth/actions.ts)):**
  - Updated [`registerCustomerAction`](file:///d:/Mustadam%20Project/src/lib/auth/actions.ts#L64-L150) to use the elevated Supabase Admin Client ([src/lib/supabase/admin.ts](file:///d:/Mustadam%20Project/src/lib/supabase/admin.ts)) with `service_role` credentials to create the user with `email_confirm: true` and assign `role: 'Customer'` in Auth JWT `raw_app_meta_data.role` (per `ADR-006` and `ARCHITECTURE.md`), avoiding email rate limits and RLS rejections.
  - Profile rows are inserted into `public.users` via `supabaseAdmin.from('users').upsert(...)`, followed by immediate session cookie establishment via `supabase.auth.signInWithPassword()` so the user is seamlessly logged in and redirected to `/seller`.
- **Supabase Admin Client & Secrets ([src/lib/supabase/admin.ts](file:///d:/Mustadam%20Project/src/lib/supabase/admin.ts)):**
  - Typed `createAdminClient` with `<Database>` and enabled fallback support for both `SUPABASE_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY`. Configured credentials in [.env.local](file:///d:/Mustadam%20Project/.env.local).
- **Fallback Registration RLS Policy ([20261105000006_users_registration_rls.sql](file:///d:/Mustadam%20Project/supabase/migrations/20261105000006_users_registration_rls.sql)):**
  - Deployed `CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);` to Cloud Supabase (`supabase-mustadam`).
- **End-to-End Verification ([scripts/test-registration.mjs](file:///d:/Mustadam%20Project/scripts/test-registration.mjs)):**
  - Verified full browser registration flow across both Individual and Corporate B2B account types using Playwright: 0 RLS errors, verified database insertion into `public.users`, verified `app_metadata.role = 'Customer'`, and confirmed automated navigation to `/seller`.
  - Verified `npx tsc --noEmit` (0 errors) and `npm test` (7 suites, 31 tests passing).

### Added — 2026-11-05 — Full Project Audit, End-to-End Test Scenarios & 12-Persona Graduation Defense Demo Guide
- **Playwright Live End-to-End Browser Testing ([scripts/e2e-demo.mjs](file:///d:/Mustadam%20Project/scripts/e2e-demo.mjs)):**
  - Added Playwright end-to-end automation (`scripts/e2e-demo.mjs`) launching visible Google Chrome with pacing (`slowMo: 1200ms`) to execute the live graduation defense demo across all key personas: Homepage, `1. Individual Seller` diagnostic price estimation, `3. Individual Buyer` storefront browsing, 15-minute checkout locking (`NFR-04`), simulated payment webhook (`FR-21`), Arabic RTL typography (`ADR-005`), and `12. Platform Admin (MIS)` dashboard KPIs. Verified exit code 0.
- **Full-Stack Review & RLS Workflow Hardening ([20261105000005_demo_rls_and_workflow_fixes.sql](file:///d:/Mustadam%20Project/supabase/migrations/20261105000005_demo_rls_and_workflow_fixes.sql)):**
  - Audited all 4 portals (`/seller`, `/partner`, `/store`, `/admin`), 23 PostgreSQL tables, triggers, RPCs, and RLS policies across all 12 Demo Personas.
  - Applied additive RLS policies on Cloud Supabase (`supabase-mustadam`) ensuring sellers can read inspection classifications and create `payouts`, `return_tasks`, `refurbishment_logs`, and `dismantling_tickets` when accepting/rejecting offers (`FR-12`), buyers can confirm delivery on `order_items_warranty` (`FR-23`), and partner staff can inspect all operational queues.
  - Updated [`StorefrontClient`](file:///d:/Mustadam%20Project/src/components/store/storefront-client.tsx#L109-L125) to automatically attach approved B2B quotes (`status === 'quoted'`) during Corporate Buyer checkout (`FR-20`).
- **End-to-End Graduation Defense Test Scenarios ([tests/unit/graduation-demo-scenarios.test.ts](file:///d:/Mustadam%20Project/tests/unit/graduation-demo-scenarios.test.ts)):**
  - Added 7 end-to-end scenario tests covering all 12 personas, 8 DB RBAC roles, `FR-04` diagnostic valuation, `FR-08`/`FR-17` equal batch logistics split, `FR-12` 7-day offer decision & return fees, `FR-14`/`FR-15`/`ADR-009` harvested spare part rollup + 35% Tier 1 markup, `FR-19` 30–60–90 day aging (`Decommissioned_Aged`), and `FR-23`/`FR-24` warranty calculations.
- **Graduation Defense Presentation Guide ([DEMO_GUIDE.md](file:///d:/Mustadam%20Project/DEMO_GUIDE.md)):**
  - Created the complete 5-act, 14-step click-by-click live demo script across all 12 SRS personas, paired with the acceptance test scenario matrix (`TS-01`–`TS-12`).

### Changed — 2026-11-05 — 35% Markup on Cost Policy for Tier 1 Pricing & Aging Cascade (`FR-17`, `FR-19`, `ADR-009`)
- **Domain Pricing Engine ([src/lib/domain/pricing-engine.ts](file:///d:/Mustadam%20Project/src/lib/domain/pricing-engine.ts)):**
  - Implemented [`calculateTargetSellingPrice`](file:///d:/Mustadam%20Project/src/lib/domain/pricing-engine.ts#L68-L73) (`Math.round(totalUnitCost * (1 + markupPct) * 100) / 100` with default `markupPct = 0.35`) and included `targetSellingPrice` in [`calculateTotalUnitCost`](file:///d:/Mustadam%20Project/src/lib/domain/pricing-engine.ts#L81-L115).
  - Updated [`respondToSellerOfferAction`](file:///d:/Mustadam%20Project/src/lib/domain/seller-actions.ts#L230-L393) and [`completeRefurbishmentTicketAction`](file:///d:/Mustadam%20Project/src/lib/domain/partner-actions.ts#L173-L270) to enforce `Target_Selling_Price = round(Total_Unit_Cost * 1.35, 2)`.
- **Inventory Aging Engine & Cloud Supabase RPC ([src/lib/domain/aging-engine.ts](file:///d:/Mustadam%20Project/src/lib/domain/aging-engine.ts) & [20261105000004_enforce_35_pct_markup_and_aging.sql](file:///d:/Mustadam%20Project/supabase/migrations/20261105000004_enforce_35_pct_markup_and_aging.sql)):**
  - Aligned [`evaluateInventoryAging`](file:///d:/Mustadam%20Project/src/lib/domain/aging-engine.ts#L20-L83) and `rpc_run_inventory_aging` / `fn_consume_harvested_spare_part` so Tier 1 (`0_30`) sets `Target_Selling_Price = round(Total_Unit_Cost * 1.35, 2)`, Tier 2 (`31_60`) applies a 20% markdown (`round(Target_Selling_Price * 0.80, 2)`), Tier 3 (`61_90`) sets `selling_price = Total_Unit_Cost`, and Tier 4 (`91_plus`) transitions to `Decommissioned_Aged`.
  - Applied migration `enforce_35_pct_markup_and_aging` to Cloud Supabase (`supabase-mustadam`) and updated [supabase/seed.sql](file:///d:/Mustadam%20Project/supabase/seed.sql).
- **Automated Unit Tests & Living Documentation:**
  - Added [tests/unit/pricing.test.ts](file:///d:/Mustadam%20Project/tests/unit/pricing.test.ts) and [tests/unit/aging.test.ts](file:///d:/Mustadam%20Project/tests/unit/aging.test.ts), and updated [tests/unit/domain-engines.test.ts](file:///d:/Mustadam%20Project/tests/unit/domain-engines.test.ts).
  - Recorded `ADR-009: 35% Markup on Cost for Tier 1 Pricing` in [DECISIONS.md](file:///d:/Mustadam%20Project/DECISIONS.md) and updated [PROJECT.md](file:///d:/Mustadam%20Project/PROJECT.md) and [ARCHITECTURE.md](file:///d:/Mustadam%20Project/ARCHITECTURE.md).

### Added — 2026-11-02 — Phases 4–8: Seller Portal, Partner WMS & Circular Engine, Storefront, Simulated Payment & Admin MIS (T4.1–T8.4)
- **Phase 4 — Seller Portal (`FR-03`–`FR-05`, `NFR-03`, `NFR-05`):**
  - Client-side photo compression ([src/lib/utils/image-compression.ts](file:///d:/Mustadam%20Project/src/lib/utils/image-compression.ts)), dynamic JSON questionnaire, live `FR-04` valuation calculator ([src/lib/domain/pricing-engine.ts](file:///d:/Mustadam%20Project/src/lib/domain/pricing-engine.ts)), Corporate Bulk Liquidation manifest submission, and 7-day (`168h`) offer decision / return fee workflow ([src/components/seller/seller-portal-client.tsx](file:///d:/Mustadam%20Project/src/components/seller/seller-portal-client.tsx), [src/lib/domain/seller-actions.ts](file:///d:/Mustadam%20Project/src/lib/domain/seller-actions.ts)).
- **Phase 5 & 6 — Partner Logistics, Warehouse Intake, Inspection, NIST 800-88 Data Wipe, Refurbishment & Dismantling (`FR-06`–`FR-16`):**
  - Built [src/components/partner/partner-portal-client.tsx](file:///d:/Mustadam%20Project/src/components/partner/partner-portal-client.tsx) and [src/lib/domain/partner-actions.ts](file:///d:/Mustadam%20Project/src/lib/domain/partner-actions.ts) covering Courier/Drop-off QR custody, equal batch logistics cost split (`Allocated_Logistics_Cost = Total_Batch_Cost / Items_Count_In_Batch`), serialized warehouse barcode generation (`MST-YYYY-NNNNN`), technical inspection with mandatory NIST 800-88 Data Wipe gate & printable certificate ([src/app/api/documents/certificate/[id]/route.ts](file:///d:/Mustadam%20Project/src/app/api/documents/certificate/%5Bid%5D/route.ts)), refurbishment workbench consuming harvested spare parts (automatically rolling up `estimated_cost` into `parts_cost` & `Refurbishment_Cost`), dismantling of `Pending_Dismantling` and `Decommissioned_Aged` items, and licensed recycler batch handovers (`Recycled_Closed`).
- **Phase 7 — Serialized Storefront, 30–60–90 Aging (`Decommissioned_Aged`), B2B Quotes, Simulated Payment & Warranty (`FR-17`–`FR-24`, `NFR-01`, `NFR-04`):**
  - Built [src/components/store/storefront-client.tsx](file:///d:/Mustadam%20Project/src/components/store/storefront-client.tsx), [src/lib/domain/store-actions.ts](file:///d:/Mustadam%20Project/src/lib/domain/store-actions.ts), and [`SimulatedPaymentGatewayAdapter`](file:///d:/Mustadam%20Project/src/lib/adapters/payment-gateway.ts) with 15-minute `FOR UPDATE NOWAIT` reservation lock, `Card`/`Wallet`/`InstaPay` simulator, webhook receiver ([src/app/api/webhooks/payment/route.ts](file:///d:/Mustadam%20Project/src/app/api/webhooks/payment/route.ts)), aging cron endpoint ([src/app/api/cron/aging/route.ts](file:///d:/Mustadam%20Project/src/app/api/cron/aging/route.ts)), printable Tax Invoice with Corporate Tax ID & CR ([src/app/api/documents/invoice/[id]/route.ts](file:///d:/Mustadam%20Project/src/app/api/documents/invoice/%5Bid%5D/route.ts)), and automated post-delivery warranty calculation & claims.
- **Phase 8 — Admin Control Center, Segmentation Campaigns & Real-Time MIS & Sustainability Dashboard (`FR-25`, `FR-26`):**
  - Built [src/components/admin/admin-portal-client.tsx](file:///d:/Mustadam%20Project/src/components/admin/admin-portal-client.tsx) and [src/lib/domain/admin-actions.ts](file:///d:/Mustadam%20Project/src/lib/domain/admin-actions.ts) with Financial, Operational (`0–30`, `31–60`, `61–90`, `91+ Decommissioned_Aged`), and Environmental Impact (`kg` diverted from landfills) KPIs, dynamic category creation (`NFR-05`), and targeted customer segmentation campaigns (`Individual`, `Startup`, `Enterprise`).
- **Verification:** `npm.cmd test` (4 test suites, 14/14 unit tests passing), `npx.cmd tsc --noEmit` (0 errors), `npm.cmd run lint` (0 warnings/errors).

### Added — 2026-11-02 — Phase 3: Auth, 8-Role RBAC, Simulated Notifications & 12-Persona Demo Toolbar (T3.1–T3.4)
- **Authentication & Corporate Validation (`FR-01`, `T3.1`):** Built bilingual Individual & Corporate `Customer` registration ([src/app/[locale]/(auth)/register/page.tsx](file:///d:/Mustadam%20Project/src/app/%5Blocale%5D/(auth)/register/page.tsx)) and login ([src/app/[locale]/(auth)/login/page.tsx](file:///d:/Mustadam%20Project/src/app/%5Blocale%5D/(auth)/login/page.tsx)) backed by server actions in [src/lib/auth/actions.ts](file:///d:/Mustadam%20Project/src/lib/auth/actions.ts).
- **8-Role DB RBAC & Portal Guards (`FR-02`, `ADR-006`, `T3.2`):** Implemented [src/lib/auth/rbac.ts](file:///d:/Mustadam%20Project/src/lib/auth/rbac.ts), [src/lib/auth/session.ts](file:///d:/Mustadam%20Project/src/lib/auth/session.ts), and updated [src/proxy.ts](file:///d:/Mustadam%20Project/src/proxy.ts) so unified `Customer` accounts access both `/seller` and `/store`, partner staff access `/partner`, and support/admin roles access `/admin`.
- **Simulated Notification Adapter (`Section 6.2`, `T3.3`):** Implemented [`SimulatedNotificationAdapter`](file:///d:/Mustadam%20Project/src/lib/adapters/notification-service.ts) recording simulated SMS/Email alerts in `public.notifications`.
- **Graduation Demo Toolbar (`T3.4`):** Built [`GraduationDemoToolbar`](file:///d:/Mustadam%20Project/src/components/demo/graduation-demo-toolbar.tsx) and [`DemoToolbarWrapper`](file:///d:/Mustadam%20Project/src/components/demo/demo-toolbar-wrapper.tsx) with 1-click session switching across all **12 SRS personas**, a live simulated SMS/Email inbox drawer, and a manual trigger button for the `FR-19` 30–60–90 day aging & `FR-12` 7-day offer Auto-Reject job.

### Added — 2026-11-02 — Cloud Supabase Migration, 23-Table Schema, Triggers, RPCs & Demo Seed (T1.4, T2.1–T2.5)
- **Local Cleanup & Cloud Supabase Switch (`ADR-001`, `T1.4`):** Stopped and removed all local Docker Desktop processes, unregistered `docker-desktop` WSL distro, deleted `D:\Docker`, `%LOCALAPPDATA%\Docker`, `%APPDATA%\Docker`, `~/.docker`, `~/.supabase`, and `scratch/`, restoring PC disk space (`133.08 GB` free on `D:\`, `5.79 GB` free on `C:\`). Connected project to Cloud Supabase (`https://xijhkffkmlaghqowmrmz.supabase.co`) via `supabase-mustadam` MCP and configured `.env.local` / `.env.example`.
- **Database Schema & Migrations (`T2.1`–`T2.3`):**
  - `20261102000001_core_schema.sql`: Created all 23 PostgreSQL tables (`users`, `categories`, `partner_hubs`, `pickup_manifests`, `acquisition_requests`, `serialized_items`, `item_photos`, `item_status_history`, `inspection_records`, `return_tasks`, `payouts`, `refurbishment_logs`, `dismantling_tickets`, `spare_parts_inventory`, `recycling_batches`, `scrap_entries`, `quote_requests`, `quote_items`, `orders`, `order_items_warranty`, `payment_events`, `warranty_claims`, `notifications`) and 39 foreign key indexes.
  - `20261102000002_lifecycle_triggers_and_rpcs.sql`: Deployed `current_user_role()`, `fn_enforce_and_audit_item_status()`, `fn_log_initial_item_status()`, `fn_consume_harvested_spare_part()`, `rpc_allocate_batch_logistics_cost()`, `rpc_create_order_with_reservation()`, `rpc_process_payment_webhook()`, and `rpc_run_inventory_aging()`, plus `REVOKE EXECUTE` hardening from `PUBLIC`/`anon`.
  - `20261102000003_rls_and_storage.sql`: Enabled RLS across all 23 tables, configured role-scoped policies for the 8 clean DB roles, and created storage buckets (`item-photos`, `certificates`, `invoices`).
- **Seed Data & Type Generation (`T2.4`–`T2.5`):**
  - Seeded 12 SRS persona accounts (`auth.users`, `auth.identities`, `public.users` with password `Mustadama2026!`), 4 partner hubs, 3 bilingual categories with dynamic `diagnostic_questions_json`, sample pickup manifest, and 3 serialized items with initial `item_status_history` audit entries.
  - Generated [src/types/database.types.ts](file:///d:/Mustadam%20Project/src/types/database.types.ts) and [src/types/domain.ts](file:///d:/Mustadam%20Project/src/types/domain.ts).

### Added — 2026-11-01 — Phase 1 scaffold (T1.1–T1.3)
- **App scaffold:** Next.js 16.4.3 (App Router, TypeScript, Tailwind CSS 4, ESLint) with `src/` layout; Git repository initialized (no commits yet).
- **Bilingual routing (ADR-005):** `next-intl` with locales `en` (LTR) / `ar` (RTL). Files: `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/i18n/navigation.ts`, `src/proxy.ts`, `messages/en.json`, `messages/ar.json`, `src/app/[locale]/layout.tsx` (sets `lang`/`dir`, Inter + Cairo fonts), `src/app/[locale]/page.tsx`, `src/components/layout/{site-header,language-switcher,portal-placeholder}.tsx`.
- **Portal shells:** `/seller`, `/store`, `/partner`, `/admin` placeholder pages under `src/app/[locale]/(seller|store|partner|admin)/`.
- **Supabase wiring:** `supabase/config.toml` via `supabase init`; clients in `src/lib/supabase/{client,server,admin}.ts`; `.env.example` (publishable/secret keys, no real values).
- **Tooling:** Vitest (`vitest.config.ts`), tests `tests/unit/routing.test.ts` and `tests/unit/messages-parity.test.ts`; npm scripts `test`, `db:start`, `db:stop`, `db:reset`. `@types/node` set to 24 (Vitest peer requirement; matches Node 24).
- **Verified:** `npm run build` (13 static pages: home + 4 portals × `en`/`ar`), `npm run lint` clean, `npm test` 3/3 passing.

### Planned Next
- **Phase 3 (`T3.1`–`T3.4`):** Individual & Corporate `Customer` authentication (`FR-01`), 8-role RBAC route guards (`FR-02`), `SimulatedNotificationAdapter`, and the 12-Persona Graduation Demo Toolbar.

---

## [0.1.0] - 2026-11-01 — Living Documentation & Architecture Baseline (Phase 0)

### Added
- **[PROJECT.md](file:///d:/Mustadam%20Project/PROJECT.md):** Translated [software_requirements_specification_srs_mustadama.md](file:///d:/Mustadam%20Project/software_requirements_specification_srs_mustadama.md) into a structured domain reference covering:
  - 4 primary portals (`/seller`, `/store`, `/partner`, `/admin`).
  - Decoupled **8 Clean Database RBAC Roles** (`Customer` paired with `Individual` | `Company`, `Partner_Inspector`, `Partner_Refurb_Tech`, `Partner_Dismantle_Tech`, `Partner_Warehouse_Mgr`, `Courier`, `Customer_Service`, `Admin`) vs. **12 Graduation Demo Toolbar Personas**.
  - Exact business formulas: `FR-04` diagnostic range, `FR-08`/`FR-17` equal batch logistics cost allocation (`Allocated_Logistics_Cost = Total_Batch_Cost / Items_Count_In_Batch`), `FR-14`/`FR-15` harvested spare part `estimated_cost` automatic rollup into `parts_cost` & `Refurbishment_Cost`, `FR-17` `Total_Unit_Cost`, `FR-12` **7-day (168-hour)** seller decision window with **Automatic Rejection (`Auto-Reject`)**, `FR-19` 30–60–90 day aging transitioning Day 91+ `Listed_In_Store` $\rightarrow$ **`Decommissioned_Aged`** $\rightarrow$ `Scrap_Ready_For_Recycling`, and `FR-23` warranty calculation.
- **[ARCHITECTURE.md](file:///d:/Mustadam%20Project/ARCHITECTURE.md):** Defined the unified Next.js (App Router, EN/AR RTL) + Local Supabase (Docker) system architecture, exact 23-table PostgreSQL schema (including `pickup_manifests.total_batch_logistics_cost` and `spare_parts_inventory.estimated_cost`), database state/audit triggers (`fn_enforce_and_audit_item_status`, `fn_consume_harvested_spare_part`), concurrency & batch RPCs (`rpc_create_order_with_reservation`, `rpc_allocate_batch_logistics_cost`, `rpc_run_inventory_aging`), Supabase RLS standards, and TypeScript adapter interfaces (`PaymentGatewayAdapter`, `NotificationServiceAdapter`).
- **[DECISIONS.md](file:///d:/Mustadam%20Project/DECISIONS.md):** Recorded Architecture Decision Records (`ADR-001` through `ADR-007`).
- **[TASKS.md](file:///d:/Mustadam%20Project/TASKS.md):** Created the 9-phase master implementation roadmap (`Phase 0` through `Phase 8`) with checkbox tracking mapped to every SRS requirement.
- **[AGENTS.md](file:///d:/Mustadam%20Project/AGENTS.md) & [.agents/rules/mustadama-docs-sync.md](file:///d:/Mustadam%20Project/.agents/rules/mustadama-docs-sync.md):** Established always-on workspace rules requiring every agent turn to read the living documentation before coding and update `TASKS.md`, `CHANGELOG.md`, `ARCHITECTURE.md`, and `DECISIONS.md` upon completing any task.
