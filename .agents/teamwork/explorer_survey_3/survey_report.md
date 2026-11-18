# Authoritative Codebase Survey Report: Requirements R3 (Root Landing Page) & R4 (Playwright E2E Testing)

**Surveyor:** `explorer_survey_3`  
**Date:** 2026-11-06T01:56:00Z  
**Target Project:** Mustadama ("مُستدام") — Circular Re-Commerce MIS  
**Repository Working Directory:** `d:\Mustadam Project`  

---

## 1. Executive Summary

This report delivers an exhaustive codebase investigation of Requirements **R3 (Polished Root Landing Page)** and **R4 (Playwright End-to-End Testing & Test Report)**.

### Key Discoveries:
1. **Root Route (`/` and `/[locale]`):** Currently, `src/app/[locale]/page.tsx` is an embryonic 35-line stub containing only an H1 headline, a subtitle, and two bare links (`/seller` and `/store`). There is no platform introduction, no representation of the 4 subsystems, no links to `/partner` or `/admin`, no authentication triggers (`/login`, `/register`), no showcase of the circular lifecycle or data sanitization standards, and no page footer.
2. **Routing & Framework Architecture:** Built on **Next.js 16.4.3 (App Router)** with **Turbopack**, **next-intl (4.14.9)**, and **Tailwind CSS v4**. Routing middleware is implemented in `src/proxy.ts` (the Next.js 16 proxy pattern per ADR-008) which handles locale prefixing (`/en`, `/ar`), default locale routing, and portal authentication access control.
3. **Styling & Localization Parity:** The project utilizes Tailwind CSS v4 `@theme inline` with CSS variables. English uses Google Font `Inter` (LTR), while Arabic uses Google Font `Cairo` (RTL) via `dir="rtl"` on `<html>`. Directional styles follow logical Tailwind utilities (`ms-*`, `me-*`, `text-start`, `text-end`).
4. **Playwright E2E Infrastructure:** `playwright` (v1.65.0) is present in `package.json` devDependencies and exports `playwright/test` directly. However, **no `playwright.config.ts` existed**, no E2E test files existed in `tests/e2e/`, and no `test:e2e` npm script was configured. Browser binary `chromium-1254` has been downloaded and verified under `C:\Users\The First\AppData\Local\ms-playwright\chromium-1254`.
5. **Runtime Server Profile:** Turbopack production builds (`next build`) currently fail in offline/sandboxed environments due to Google Fonts fetch timeout on Inter and Cairo, but `next dev` boots in ~922ms cleanly. Therefore, Playwright's `webServer` block should be configured to run against `npm run dev` / `next dev --port 3000` with adequate timeout and `reuseExistingServer: true`.

---

## 2. Requirement R3: Root Landing Page Investigation

### 2.1 Current Implementation State

The existing root route file is `src/app/[locale]/page.tsx`:

```tsx
// File: src/app/[locale]/page.tsx (Lines 1–34)
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Link } from "@/i18n/navigation";

export default function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("Home");

  return (
    <section className="mx-auto max-w-4xl px-6 py-20 text-start">
      <h1 className="text-4xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">
        {t("subtitle")}
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/seller"
          className="rounded-md bg-emerald-700 px-5 py-2.5 text-white hover:bg-emerald-800"
        >
          {t("sellCta")}
        </Link>
        <Link
          href="/store"
          className="rounded-md border border-neutral-300 px-5 py-2.5 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          {t("shopCta")}
        </Link>
      </div>
    </section>
  );
}
```

#### Deficiencies Identified:
- **No Portal Navigation:** Lacks direct links or cards for `/partner`, `/admin`, `/login`, or `/register`.
- **No Platform Narrative:** Fails to communicate Mustadama's core identity: Egypt's pioneering circular re-commerce ecosystem that acquires, refurbishes, inspects, warrants, and sustainably recycles serialized electronics and bulky furniture.
- **No Trust or Compliance Anchors:** Omits crucial value propositions like NIST 800-88 certified data wiping, 30-90 day hardware warranties, item-level serialization, and zero-landfill e-waste recycling.
- **No Page Footer:** The layout `src/app/[locale]/layout.tsx` mounts `SiteHeader` at line 46, but has no `SiteFooter`. The page simply terminates after the two buttons.

### 2.2 Next.js App Router & Localization Routing Architecture

- **Proxy Routing (`src/proxy.ts`):**
  - Uses `next-intl/middleware` configured with `locales: ["en", "ar"]` and `defaultLocale: "en"`.
  - When a user accesses `/`, the proxy redirects or rewrites to `/[locale]` (e.g. `/en` or `/ar` based on cookies/headers).
  - Portal access checks intercept requests to `/(en|ar)/(seller|partner|admin)`:
    * Unauthenticated requests to `/seller`, `/partner`, `/admin` redirect to `/[locale]/login?next=...`
    * Unauthorized roles redirect to `/[locale]/login?denied=...`
    * Note: `/store` is public to browse!
- **Root Layout (`src/app/[locale]/layout.tsx`):**
  - Dynamically sets `dir={isRtl(locale) ? "rtl" : "ltr"}` and `lang={locale}`.
  - Mounts `DemoToolbarWrapper` (the floating/docked toolbar).
  - Mounts `SiteHeader` (which has top-level links: `/`, `/seller`, `/store`, `/partner`, `/admin`, `/login`, and `LanguageSwitcher`).

### 2.3 Styling Stack & Directional Support

- **Tailwind CSS v4:** Configured via `@import "tailwindcss";` in `src/app/globals.css`.
- **Directional Isolation:** The `.ltr-data` utility is already established in `globals.css` for numbers, serials, and currency amounts:
  ```css
  .ltr-data {
    direction: ltr;
    unicode-bidi: isolate;
    font-variant-numeric: tabular-nums;
  }
  ```
- **Typography:**
  - Latin: Inter (`--font-inter`)
  - Arabic: Cairo (`--font-cairo`), with `html[lang="ar"] body { font-family: var(--font-cairo), ... }`
- **Design Tokens:**
  - Brand Primary: Emerald (`emerald-600`, `emerald-700`, `emerald-800`)
  - Neutral Base: Slate/Neutral (`neutral-100` through `neutral-900`)
  - Semantic Highlights: Amber (warning/notice), Sky/Blue (technical/logistics), Rose (danger/rejections)

### 2.4 Required Landing Page Design & Section Architecture

To fulfill Requirement R3 and project specifications, `src/app/[locale]/page.tsx` must be refactored into a high-conversion, authentic production landing page containing the following sections:

1. **Hero Section:**
   - **Compelling Headline & Subtitle:** "The Circular Re-Commerce Ecosystem for Egypt" ("المنظومة المتكاملة لإعادة التجارة الدائرية للإلكترونيات والأثاث").
   - **Primary Action Buttons:** Responsive CTAs navigating directly to `/store` ("Explore Verified Catalog" / "تصفح المتجر الموثق") and `/seller` ("Sell Your Device" / "بِع جهازك الآن").
   - **Trust Badges Row:**
     * 100% NIST 800-88 Data Sanitized (مسح معتمد للبيانات)
     * Up to 90-Day Hardware Warranty (ضمان تشغيل حتى ٩٠ يوماً)
     * Serialized Quality Certification (تتبع فردي برقم تسلسلي موثق)
     * Licensed Zero-Landfill Recycling (إعادة تدوير مرخصة بدون نفايات)
2. **Subsystems & Portals Directory (4 Subsystems + Account Portal):**
   - **Storefront Card (`/store`):** Certified pre-owned laptops, PCs, smartphones, and ergonomic furniture with condition grading (Grade A/B/C) and 15-minute checkout reservation locks.
   - **Seller Portal Card (`/seller`):** Instant diagnostic price valuation for individuals, door-to-door courier pickup, and corporate B2B bulk liquidation.
   - **Partner Operations Card (`/partner`):** Technical operations suite for couriers, warehouse intake barcode scanning, hardware diagnostics, refurbishment work orders, and spare parts harvesting.
   - **Admin & MIS Dashboard Card (`/admin`):** Comprehensive circular governance, real-time ESG metrics (landfill kg diverted), dynamic category configuration, and B2B quote approvals.
   - **Customer Account Gateway (`/register` & `/login`):** Unified Customer Profile unlocking both buying and selling with a single account.
3. **The Circular Lifecycle (Interactive 4-Step Process):**
   - **Step 1 — Acquire & Collect:** Courier doorstep pickup or drop-off at authorized partner hubs with instant tracking codes.
   - **Step 2 — Inspect & Sanitize:** Rigorous multi-point inspection and military-grade NIST 800-88 data destruction with digital certificate issuance.
   - **Step 3 — Refurbish or Harvest:** Certified technician repairs using harvested OEM parts, or component dismantling for circular spare inventory.
   - **Step 4 — Re-Commerce & Zero Landfill:** Serialized re-sale with 30-90 day warranty, or transfer of raw scrap to licensed green smelters.
4. **Key Features & Guarantees:**
   - Diagnostic Pricing Engine (fair, transparent market-based algorithms).
   - 15-Minute Concurrency Reservation Lock (eliminates double-checkout races).
   - Equal Batch Logistics Allocation (fair, shared corporate transport costs).
   - B2B Bulk Liquidation & Custom Corporate Quotes.
5. **Real-Time Sustainability Impact Banner:**
   - Highlights metric cards: Kilograms of e-waste diverted from Egyptian landfills, Devices recirculated, Trees saved, Carbon offset equivalence.
6. **Polished Global Site Footer (`src/components/layout/site-footer.tsx`):**
   - Mustadama brand description, mission statement, and bilingual links.
   - Navigation links grouped by audience:
     * *Marketplace:* `/store`, `/seller`, `/register`
     * *Operations:* `/partner`, `/admin`, `/login`
     * *Compliance:* NIST 800-88 Guidelines, Warranty Policy, Privacy & Terms
   - Copyright notice: `© 2026 Mustadama ("مُستدام"). All rights reserved.`

---

## 3. Requirement R4: Playwright E2E Testing Infrastructure Investigation

### 3.1 Current Status & Tooling Audit

- **Package Analysis (`package.json`):**
  - Dependency: `"playwright": "^1.65.0"` (Line 31).
  - CLI Verification: `npx playwright --version` outputs `Version 1.65.0`.
  - Module Export: `require('playwright/test')` is present and exports `defineConfig`, `devices`, `test`, and `expect`.
  - Browser Binaries: Chromium 1254 installed under `C:\Users\The First\AppData\Local\ms-playwright\chromium-1254\chrome-win64\chrome.exe`.
  - Missing Config: No `playwright.config.ts` exists in the repository.
  - Missing Script: No `"test:e2e"` script exists in `package.json`.

### 3.2 Dev Server vs. Production Server Execution Strategy

| Execution Mode | Command | Findings & Feasibility |
|---|---|---|
| **Production Build (`next build`)** | `next build` | ❌ Fails when offline because Turbopack attempts to query `fonts.googleapis.com` for Inter/Cairo, throwing `next/font: error: Failed to fetch Cairo from Google Fonts`. |
| **Development Server (`next dev`)** | `next dev --port 3000` | ✅ Boots rapidly in ~922ms, serves both English (`/en`) and Arabic (`/ar`), compiles pages on demand without font fetch errors. |

**Recommended Playwright Configuration:**
Configure Playwright to use `webServer`:
```ts
webServer: {
  command: "npx next dev --port 3000",
  url: "http://localhost:3000",
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
}
```

### 3.3 End-to-End User Journeys Mapping

To ensure exhaustive test coverage across all 4 portals, authentication, and persona simulation, the Playwright test suite must be organized into 6 test spec files under `tests/e2e/`:

```text
tests/e2e/
├── 01-landing-page.spec.ts       # R3: Root route, hero, 4 portal links, auth links, LTR/RTL bilingual toggles
├── 02-auth-and-personas.spec.ts  # R1 & Auth: Registration (Individual vs B2B), login, 12-role persona switching
├── 03-storefront.spec.ts         # Portal 2: Catalog browsing, condition filters, 15-min reservation, simulated checkout
├── 04-seller-portal.spec.ts      # Portal 1: Category diagnostics, instant price range, photo upload, handover, offer review
├── 05-partner-portal.spec.ts     # Portal 3: Courier custody, warehouse intake barcode, inspection & wipe, refurb, dismantling
└── 06-admin-portal.spec.ts       # Portal 4: MIS KPIs, dynamic category management, campaigns, quote approvals, warranty claims
```

#### Detailed Scenario Breakdown:

#### 1. Landing Page (`01-landing-page.spec.ts`):
- `NAV-01`: Root route `/` redirects cleanly to `/[locale]` (`/en` or `/ar`).
- `NAV-02`: Hero section renders brand title, subtitle, and primary CTAs (`/store`, `/seller`).
- `NAV-03`: Navigation directory cards link to `/store`, `/seller`, `/partner`, `/admin`, `/login`, and `/register`.
- `NAV-04`: Bilingual parity: Language switcher switches to Arabic (`dir="rtl"` on `<html>`, Cairo font class, Arabic content) and returns to English (`dir="ltr"`).
- `NAV-05`: Mobile and desktop responsive layout integrity (no horizontal overflow or broken flex wraps).
- `NAV-06`: Global footer renders with portal links and copyright.

#### 2. Authentication & Persona Simulation (`02-auth-and-personas.spec.ts`):
- `AUTH-01`: Register Individual account: displays name, email, phone, password fields.
- `AUTH-02`: Register Corporate (B2B) account: displays Tax ID, Commercial Registration (CR), and Business Segment fields; rejects malformed tax IDs.
- `AUTH-03`: Sign-in page accepts valid credentials and redirects to user workspace.
- `AUTH-04`: Role simulation toolbar (R1) renders as a floating/docked control across routes.
- `AUTH-05`: Persona switching: selecting any of the 12 SRS personas (e.g., `1. Individual Seller`, `3. Individual Buyer`, `7. Partner Inspector`, `12. Platform Admin`) updates the session and navigates to the associated portal.
- `AUTH-06`: Role-based access control (RBAC): verifies Customer cannot access `/partner` or `/admin` directly without permission.

#### 3. Buyer Storefront (`03-storefront.spec.ts`):
- `STORE-01`: Serialized catalog displays only `Listed_In_Store` items with real photos, Condition Grade badges (`Grade A`, `Grade B`, `Grade C`), warranty duration, and pricing.
- `STORE-02`: Condition grade filter buttons filter items dynamically.
- `STORE-03`: Checkout flow: selecting an item creates a 15-minute reservation lock (`createSerializedOrderReservationAction`).
- `STORE-04`: Simulated Payment Gateway: Card, Mobile Wallet, or InstaPay checkout processes successfully (`SUCCESS`), marks item as `Sold`, and generates PDF invoice link.
- `STORE-05`: Corporate B2B Quote Request: B2B accounts can submit a bulk quote request.
- `STORE-06`: Order tracking and warranty claim submission flow.

#### 4. Seller Acquisition Engine (`04-seller-portal.spec.ts`):
- `SELL-01`: Diagnostic Questionnaire: selecting category displays dynamic questions; toggling answers updates the instant estimated price range (`Min EGP – Max EGP`).
- `SELL-02`: Mandatory legal disclaimer is visible stating the price range is non-binding until physical inspection.
- `SELL-03`: Handover method selection: toggles between Door-to-Door Courier (address + time slot) and Partner Drop-off Hub (hub selection).
- `SELL-04`: Single-item submission generates tracking code and serialized record in `Awaiting_Handover`.
- `SELL-05`: Corporate Bulk Liquidation: B2B seller submits multi-line manifest.
- `SELL-06`: Seller Offer Decision: seller reviews final purchase price offer and 7-day decision timer, with Accept and Reject actions.

#### 5. Partner Operations Hub (`05-partner-portal.spec.ts`):
- `PART-01`: Logistics view: Courier confirms custody of items (`Received_At_Dropoff_Hub` / `In_Transit_To_Warehouse`).
- `PART-02`: Bulky transport team allocates equal batch logistics cost across pickup manifests.
- `PART-03`: Warehouse intake: Warehouse manager receives item and generates unique barcode `MST-2026-NNNNN`.
- `PART-04`: Technical Inspection: Inspector classifies condition, verifies mandatory NIST 800-88 Data Sanitization certificate, and submits final purchase price.
- `PART-05`: Refurbishment: Technician opens work order, consumes harvested spare part from inventory (verifying unit cost rollup), assigns final grade, and closes ticket.
- `PART-06`: Dismantling: Technician dismantles irreparable or aged item, logs harvested spare parts with valuation, and logs scrap material weight.

#### 6. Core Admin & MIS Dashboard (`06-admin-portal.spec.ts`):
- `ADMIN-01`: Real-time MIS & ESG KPIs: verifies sales revenue, recycling revenue, profit margins, seller acceptance rate, 30-60-90 day aging tiers, and landfill kg diverted.
- `ADMIN-02`: Category & Diagnostic Configuration: Admin creates/updates a category with base price, warranty, bulky flag, and dynamic JSON diagnostic questionnaire without code changes.
- `ADMIN-03`: Customer Segmentation Campaign: Admin dispatches an SMS/Email campaign targeting Individual, Startup, or Enterprise segments.
- `ADMIN-04`: B2B Quote Approval: Admin reviews corporate bulk quote request, applies custom discount, and approves quote.
- `ADMIN-05`: Customer Service Support: Agent reviews warranty claims and records resolution notes.

---

## 4. Test Reporting Architecture & Output Artifacts

Playwright supports multiple simultaneous reporters. To generate both automated execution artifacts and a presentation-ready markdown report:

1. **Reporters in `playwright.config.ts`:**
   ```ts
   reporter: [
     ['list'],
     ['html', { outputFolder: 'playwright-report', open: 'never' }],
     ['json', { outputFile: 'test-results/playwright-results.json' }],
   ],
   ```
2. **Interactive HTML Report:**
   Generated under `playwright-report/index.html` with step-by-step screenshots, action timings, and trace viewers.
3. **Comprehensive Markdown Report (`PLAYWRIGHT_TEST_REPORT.md`):**
   A human-readable, professional markdown report summarizing:
   - Executive pass/fail summary badge.
   - Total test suites, scenarios, passed, failed, duration.
   - Execution environment details (Node version, Next.js version, Chromium version, OS).
   - Traceability table mapping each test scenario to its user journey and portal.
   - Clean production presentation audit (confirming zero `FR-` or `NFR-` tags rendered in tested views).

---

## 5. Complete Inventory of Affected & New Files

| File Path | Action | Description / Responsibility |
|---|---|---|
| `src/app/[locale]/page.tsx` | **Rewrite** | Comprehensive, polished bilingual landing page introducing Mustadama with responsive navigation to all 4 portals, auth flows, and circular lifecycle. |
| `src/components/layout/site-footer.tsx` | **Create** | New global bilingual footer with portal links, compliance references, and branding. |
| `src/app/[locale]/layout.tsx` | **Modify** | Integrate `SiteFooter` beneath `<main>` so every page has consistent production footer navigation. |
| `messages/en.json` | **Modify** | Add extensive `Landing` translation keys in polished, authentic production English. |
| `messages/ar.json` | **Modify** | Add parallel `Landing` translation keys in authentic Egyptian Arabic (RTL). |
| `package.json` | **Modify** | Add `"test:e2e": "playwright test"` and `"test:e2e:report": "playwright show-report"` scripts. |
| `playwright.config.ts` | **Create** | Configuration specifying test directory, Chromium project, webServer for Next dev, and HTML/JSON reporters. |
| `tests/e2e/01-landing-page.spec.ts` | **Create** | E2E tests for root route, landing page sections, portal links, auth links, and LTR/RTL toggles. |
| `tests/e2e/02-auth-and-personas.spec.ts` | **Create** | E2E tests for registration, login, 12-role persona switching, and session persistence. |
| `tests/e2e/03-storefront.spec.ts` | **Create** | E2E tests for catalog browsing, condition filtering, 15-min reservation checkout, and payment. |
| `tests/e2e/04-seller-portal.spec.ts` | **Create** | E2E tests for single item diagnostics, price estimation, handover selection, and offer review. |
| `tests/e2e/05-partner-portal.spec.ts` | **Create** | E2E tests for courier custody, intake barcode generation, inspection & wipe, refurb, and dismantling. |
| `tests/e2e/06-admin-portal.spec.ts` | **Create** | E2E tests for MIS KPIs, dynamic category management, campaigns, quotes, and warranty claims. |
| `PLAYWRIGHT_TEST_REPORT.md` | **Create** | Comprehensive final test report documenting all test suites, executed scenarios, and pass/fail status. |

---

## 6. Execution Commands Reference

```powershell
# 1. Run Vitest Unit Tests
npm test

# 2. Run Playwright E2E Tests (Headless Chromium against Next.js dev server)
npx playwright test

# 3. Run specific Playwright test suite
npx playwright test tests/e2e/01-landing-page.spec.ts

# 4. View Playwright interactive HTML test report
npx playwright show-report playwright-report

# 5. Start development server manually
npm run dev
```

---
*Report compiled and certified by `explorer_survey_3`.*
