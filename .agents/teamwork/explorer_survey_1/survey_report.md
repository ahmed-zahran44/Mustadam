# Authoritative Survey Report: Requirement R1 (Consolidated Role Simulation Dropdown & Demo Toolbar Architecture)

- **Date**: 2026-11-06
- **Explorer**: `explorer_survey_1` (Role Simulation & Architecture Explorer)
- **Subject**: Requirement R1 — 12-Role Simulation Feature, Demo Toolbar Refactoring, Persona Directory, Session Switching, and Bilingual Portal Routing

---

## 1. Executive Summary

Requirement R1 addresses the refactoring of the 12-role simulation feature in Mustadama ("مُستدام"). Currently, the application displays a prominent, multi-row grid containing 12 separate buttons at the top of every page layout (`src/components/demo/graduation-demo-toolbar.tsx`). While functionally complete, this component consumes excessive vertical screen real estate (60–120px depending on viewport), creates visual clutter, and includes academic demonstration labels (such as "GRADUATION DEMO TOOLBAR", "12 SRS Personas", "8 Clean DB Roles", "SRS 6.2").

Our investigation confirms that:
1. **The 12 personas are fully implemented, seeded, and mapped** to 8 clean PostgreSQL RBAC roles in accordance with `ADR-006`, `FR-01`, and `FR-02`.
2. **State switching uses authentic Supabase Auth sessions via HTTP-only SSR cookies** (`@supabase/ssr`), handled server-side through `switchDemoPersonaAction` in `src/lib/auth/actions.ts`. There are no mock states or volatile `localStorage` tricks; authentication is DB-backed and verified by Next.js 16 middleware (`src/proxy.ts`).
3. **Refactoring the 12 separate buttons into a single compact `<select>` dropdown menu** housed within a docked or floating toolbar is straightforward, highly feasible, and will drastically improve UI ergonomics on both desktop and mobile viewports.
4. **Persona switching and portal routing are natively bilingual (`en` LTR / `ar` RTL)** via `next-intl` navigation (`@/i18n/navigation`), preserving locale prefixes (`/en/...` and `/ar/...`) and leveraging existing bilingual persona labels (`labelEn` and `labelAr`).

---

## 2. Current Implementation & File Locations

The simulation toolbar and persona switching subsystem is implemented across the following core files:

| File Path | Role & Architecture Boundary | Key Responsibilities |
|---|---|---|
| `src/app/[locale]/layout.tsx` (Lines 6, 45) | Server Component (Root Locale Layout) | Imports and renders `<DemoToolbarWrapper />` above `<SiteHeader />` on every page across all locales (`en` and `ar`). |
| `src/components/demo/demo-toolbar-wrapper.tsx` (Lines 1–35) | Server Component (Async Data Boundary) | Calls `getActiveSessionProfile()` to extract the current user ID, role, and profile; queries the `notifications` table for the active user's simulated SMS/email messages; passes props to client toolbar. |
| `src/components/demo/graduation-demo-toolbar.tsx` (Lines 1–201) | Client Component (`"use client"`) | Renders the toolbar UI: badge, subtitle, active user info chip, 12 persona buttons in a CSS grid (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6`), Aging job trigger button, and collapsible notification inbox drawer. Handles user interaction via React `useTransition`. |
| `src/lib/auth/rbac.ts` (Lines 1–182) | Shared Domain Module | Defines `DEMO_PERSONAS` (12 persona objects), `DEMO_DEFAULT_PASSWORD` (`"Mustadama2026!"`), `PORTAL_ALLOWED_ROLES` access matrix, `canAccessPortal()`, and `validateCorporateCredentials()`. |
| `src/lib/auth/actions.ts` (Lines 14–37) | Server Actions (`"use server"`) | `switchDemoPersonaAction(personaId)`: Authenticates user against Supabase Auth using email and `DEMO_DEFAULT_PASSWORD`, establishes session cookies via `@supabase/ssr`, calls `revalidatePath('/', 'layout')`, and returns the persona's `defaultRoute`. Also contains `signOutAction` and `triggerInventoryAgingAndExpiryAction`. |
| `src/lib/auth/session.ts` (Lines 1–40) | Server-Only Utility | `getActiveSessionProfile()`: Inspects Supabase server client session cookies, fetches `public.users` record, extracts `app_metadata.role` or `users.role`. |
| `src/proxy.ts` (Lines 1–68) | Next.js 16 Middleware | Intercepts requests matching `/[locale]/(seller|partner|admin)`. Refreshes Supabase session cookies, verifies authentication, and enforces `canAccessPortal(role, portal)`, redirecting unauthorized users to `/[locale]/login`. |
| `messages/en.json` & `messages/ar.json` | Bilingual Localization | `DemoToolbar` dictionary keys: `badge`, `subtitle`, `guestSession`, `runAgingBtn`, `agingJobSuccess`, `inboxBtn`, `inboxTitle`, `inboxEmpty`, `signOut`. |
| `supabase/seed.sql` (Lines 1–73) | Database Seeding | Creates 12 `auth.users`, 12 `auth.identities`, and 12 `public.users` records with predefined UUIDs and bcrypt password hash for `"Mustadama2026!"`. |

---

## 3. The 12 Personas: Comprehensive Specification Matrix

The platform strictly decouples the **8 clean database RBAC roles** (`users.role` & `app_metadata.role`) from the **12 Graduation Demo Personas** (`PROJECT.md` Section 3, `ADR-006`, `FR-01`, `FR-02`):

- **Database Roles (8)**: `Customer`, `Courier`, `Partner_Inspector`, `Partner_Refurb_Tech`, `Partner_Dismantle_Tech`, `Partner_Warehouse_Mgr`, `Customer_Service`, `Admin`.
- **Account Types (2)**: `Individual`, `Company` (paired with `Customer` to unlock B2B liquidation, B2B quotes, and tax-compliant invoicing).

### Complete 12-Persona Directory

All accounts share the uniform demonstration password:
**`Mustadama2026!`**

| # | Persona ID | Display Label (EN) | Display Label (AR) | Seed User Name | Email Address | DB Role | Account Type | Default Route | Seed User UUID | Primary Capabilities & Target Workflow |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `seller-individual` | 1. Individual Seller | ١. بائع فردي | Ahmed Mansour | `seller.individual@mustadama.eg` | `Customer` | `Individual` | `/seller` | `11111111-1111-1111-1111-111111111101` | Single device submission with category diagnostic questionnaire, photo upload, estimated price range calculation, and 7-day offer decision (`FR-03`, `FR-04`, `FR-12`). |
| 2 | `seller-corporate` | 2. Corporate Seller (B2B) | ٢. بائع شركات (تصفية) | NileTech Solutions | `seller.corporate@mustadama.eg` | `Customer` | `Company` | `/seller` | `11111111-1111-1111-1111-111111111102` | Corporate B2B bulk liquidation manifest submission with commercial registration and tax ID validation (`FR-05`, `FR-08`). |
| 3 | `buyer-individual` | 3. Individual Buyer | ٣. مشتري فردي | Sarah Ibrahim | `buyer.individual@mustadama.eg` | `Customer` | `Individual` | `/store` | `11111111-1111-1111-1111-111111111103` | Serialized marketplace browsing, 15-minute item reservation lock, checkout with multi-channel payment simulation, delivery confirmation, and warranty claims (`FR-18`, `FR-21`, `FR-23`, `FR-24`). |
| 4 | `buyer-corporate` | 4. Corporate Buyer (B2B) | ٤. مشتري شركات (B2B) | Cairo Coworking Space | `buyer.corporate@mustadama.eg` | `Customer` | `Company` | `/store` | `11111111-1111-1111-1111-111111111104` | Corporate B2B bulk quote requests with volume discounts and corporate tax invoice generation (`FR-20`, `FR-22`). |
| 5 | `courier-hub` | 5. Courier / Drop-off Hub | ٥. مندوب توصيل / نقطة تسليم | Mahmoud Courier | `courier@mustadama.eg` | `Courier` | `Individual` | `/partner` | `11111111-1111-1111-1111-111111111105` | Doorstep pickup custody confirmation, Partner Drop-off Hub QR code intake, and dispatching to central warehouse (`FR-06`, `FR-07`). |
| 6 | `transport-bulky` | 6. Bulky Transport Team | ٦. فريق نقل الأثاث الضخم | Bulky Transport Team | `transport@mustadama.eg` | `Courier` | `Individual` | `/partner` | `11111111-1111-1111-1111-111111111106` | Scheduled bulky furniture batch pickup manifest execution and equal batch transport cost allocation (`FR-08`, `FR-17`). |
| 7 | `inspector` | 7. Partner Inspector | ٧. مهندس الفحص الفني | Eng. Tarek Inspector | `inspector@mustadama.eg` | `Partner_Inspector` | `Individual` | `/partner` | `11111111-1111-1111-1111-111111111107` | Technical inspection report, mandatory NIST 800-88 Data Wipe certification, and final purchase price submission setting 7-day offer timer (`FR-10`, `FR-11`, `FR-12`). |
| 8 | `refurb-tech` | 8. Refurbishment Tech | ٨. فني التجديد والإصلاح | Hassan Refurb Tech | `refurb.tech@mustadama.eg` | `Partner_Refurb_Tech` | `Individual` | `/partner` | `11111111-1111-1111-1111-111111111108` | Refurbishment work order ticket execution, spare part consumption with automatic cost rollup, labor logging, and Condition Grade assignment (`FR-13`, `FR-15`). |
| 9 | `dismantle-tech` | 9. Dismantling Tech | ٩. فني التفكيك وقطع الغيار | Kareem Dismantle Tech | `dismantle.tech@mustadama.eg` | `Partner_Dismantle_Tech` | `Individual` | `/partner` | `11111111-1111-1111-1111-111111111109` | Dismantling of irreparable items and aged-out inventory, functional spare parts harvesting with valuation, and material scrap weight logging (`FR-14`, `FR-16`, `FR-19`). |
| 10 | `warehouse-mgr` | 10. Warehouse Manager | ١٠. مدير المستودع | Amr Warehouse Manager | `warehouse.mgr@mustadama.eg` | `Partner_Warehouse_Mgr` | `Individual` | `/partner` | `11111111-1111-1111-1111-111111111110` | Serialized warehouse intake, unique barcode generation (`MST-2026-NNNNN`), return shipment release, and licensed recycler handover logging (`FR-09`, `FR-12`, `FR-16`). |
| 11 | `customer-service` | 11. Customer Service | ١١. خدمة العملاء والضمان | Layla Customer Service | `customer.service@mustadama.eg` | `Customer_Service` | `Individual` | `/admin` | `11111111-1111-1111-1111-111111111111` | Buyer/seller inquiry management, warranty claim triage, RMA authorization, and return fee dispute resolution (`FR-24`). |
| 12 | `admin` | 12. Platform Admin (MIS) | ١٢. مدير المنصة والتقارير | Platform Administrator | `admin@mustadama.eg` | `Admin` | `Individual` | `/admin` | `11111111-1111-1111-1111-111111111112` | Platform governance, category and diagnostic questionnaire configuration, B2B quote discount approvals, customer segmentation campaigns, and real-time MIS KPIs (`FR-04`, `FR-20`, `FR-25`, `FR-26`). |

---

## 4. State Switching & Session Persistence Mechanism

The persona switching flow is completely DB-backed and operates through Supabase SSR:

```
[User Selects Persona from Dropdown]
                │
                ▼
  React `startTransition` executes Server Action:
  `switchDemoPersonaAction(personaId)`
                │
                ▼
  `createSupabaseServerClient()` in `src/lib/supabase/server.ts`
  Calls: `supabase.auth.signInWithPassword({ email, password: "Mustadama2026!" })`
                │
                ▼
  Supabase validates credentials against `auth.users` & `auth.identities`
  Sets HTTP-Only, Secure Cookie: `sb-<project_ref>-auth-token`
  Contains JWT with `app_metadata.role` (e.g., "Partner_Inspector")
                │
                ▼
  `revalidatePath('/', 'layout')` invalidates Next.js Server Component cache
  Returns `{ ok: true, defaultRoute: persona.defaultRoute, role, email }`
                │
                ▼
  Client receives response:
  1. `router.push(res.defaultRoute)` (e.g., `/en/partner` or `/ar/partner`)
  2. `router.refresh()` triggers Server Component re-evaluation
                │
                ▼
  Next.js 16 Middleware (`src/proxy.ts`):
  1. Inspects request cookies via `request.cookies.getAll()`
  2. Calls `supabase.auth.getUser()`
  3. Verifies `canAccessPortal(role, portal)`
  4. Allows access or redirects to `/[locale]/login?denied=...`
                │
                ▼
  Page Loads:
  `DemoToolbarWrapper` & Portal Pages fetch `getActiveSessionProfile()`
  UI renders with full authentication and permissions of selected persona
```

### Key Technical Characteristics
- **Persistence**: Sessions persist across browser reloads, new tabs, and direct URL navigations because they reside in valid Supabase session cookies.
- **Zero LocalStorage Dependency**: No client-side storage is used for authentication state, eliminating sync delays or CSRF leakage.
- **Role Enforcement**: Even if a user attempts to manually navigate to an unauthorized portal (e.g., `Customer` navigating to `/admin`), `src/proxy.ts` intercepts and blocks the request before any page code runs.

---

## 5. UI Component Refactoring Analysis (Separate Buttons to Single Dropdown)

### 5.1 Current Design Bottlenecks
1. **Vertical Footprint**: The 12 buttons are rendered as individual `<button>` elements in a 2 to 6 column grid (`graduation-demo-toolbar.tsx:135`). This takes up roughly 120px of height, pushing headers, banners, and hero sections below the fold.
2. **Academic & Non-Production Tone**:
   - Badge: `"GRADUATION DEMO TOOLBAR"`
   - Subtitle: `"1-Click Switch Across All 12 SRS Personas (8 Clean DB Roles)"`
   - Persona labels: Prefixed with numbered academic tags (`"1. Individual Seller"`, `"12. Platform Admin (MIS)"`).
   - Notification drawer: `"Simulated SMS & Email Notifications (SRS 6.2)"`.
3. **Static Layout Document Flow**: The toolbar is statically rendered directly above `<SiteHeader />` (`src/app/[locale]/layout.tsx:45`). When a user scrolls down a long catalog or operations table, the toolbar scrolls out of view, forcing the user to scroll all the way back to the top to switch roles.

### 5.2 Proposed Refactored Architecture

#### A. Positioning: Docked Top Bar vs Floating Bottom Pill
The prompt mandates:
> *"housed in a floating or docked toolbar control accessible across pages."*

Two viable patterns satisfy this requirement:

1. **Option A: Sleek Sticky/Docked Top Bar (`sticky top-0 z-50`)**:
   - Housed at the very top of the viewport above the site header with `sticky top-0 z-50 bg-slate-950/95 backdrop-blur border-b border-slate-800`.
   - Compact single-row height (~38px to 42px).
   - Keeps controls consistently in sight across pages without obscuring page footers, forms, or floating action buttons.
   - Clean and natural for presentation and evaluation.

2. **Option B: Floating Docked Bottom Toolbar (`fixed bottom-4 inset-x-auto start-1/2 -translate-x-1/2 z-50`)**:
   - A floating pill/bar docked at the bottom center or bottom corner with `rounded-2xl shadow-2xl bg-slate-950/90 backdrop-blur-md border border-slate-700/80 p-2 flex items-center gap-2.5`.
   - Leaves the top site header 100% clean and authentic to production.
   - Includes a mini-collapse / expand toggle icon so evaluators can minimize it to a discrete floating pill (e.g. `👤 Switch Role`) or expand it.

**Recommendation**: **Option A (Sticky/Docked Top Bar) with a compact height (~38px)** or **Option B (Floating Bottom Dock with a collapse toggle)**. Both work seamlessly. A sticky/docked top bar is the most resilient across different screen sizes and prevents any collision with modals or bottom navigation.

#### B. Component Layout Structure (Single Row)
In the refactored toolbar, the separate buttons are replaced with a single semantic `<select>` dropdown (or custom dropdown) structured as:

```
[Mode Badge]  [Dropdown: "👤 Select Persona..."]  [Active User Chip]  |  [⏱️ Run Aging]  [🔔 Inbox (N)]  [🚪 Sign Out]
```

#### C. Dropdown Grouping & Categorization
Using native `<optgroup>` groupings inside the dropdown organizes the 12 personas logically and cleanly:

```html
<select
  id="persona-switcher"
  data-testid="persona-select"
  value={activePersonaId}
  onChange={(e) => handlePersonaClick(e.target.value)}
  disabled={isPending}
  className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-1.5 text-xs text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
>
  <option value="" disabled>
    {isPending ? t("switching") : t("selectPersonaPrompt")}
  </option>

  <!-- Group 1: Marketplace & Customers -->
  <optgroup label={t("groupCustomers")}>
    <option value="seller-individual">{persona1.label}</option>
    <option value="seller-corporate">{persona2.label}</option>
    <option value="buyer-individual">{persona3.label}</option>
    <option value="buyer-corporate">{persona4.label}</option>
  </optgroup>

  <!-- Group 2: Partner Operations & Logistics -->
  <optgroup label={t("groupPartners")}>
    <option value="courier-hub">{persona5.label}</option>
    <option value="transport-bulky">{persona6.label}</option>
    <option value="inspector">{persona7.label}</option>
    <option value="refurb-tech">{persona8.label}</option>
    <option value="dismantle-tech">{persona9.label}</option>
    <option value="warehouse-mgr">{persona10.label}</option>
  </optgroup>

  <!-- Group 3: Platform Admin & Support -->
  <optgroup label={t("groupAdmin")}>
    <option value="customer-service">{persona11.label}</option>
    <option value="admin">{persona12.label}</option>
  </optgroup>
</select>
```

#### D. Notification Drawer as a Popover/Flyout
Rather than expanding inline and shifting page elements downward:
- The simulated inbox drawer should open as a **floating popover / flyout** positioned absolutely relative to the toolbar (`absolute top-full end-0 mt-2 w-96 max-h-80 overflow-y-auto rounded-xl bg-slate-950 border border-slate-700 shadow-2xl p-3 z-50`).
- This guarantees zero layout shift on the host page.

---

## 6. Bilingual Verification (English LTR & Arabic RTL)

### 6.1 Locale Preservation During Routing
The routing mechanism preserves the active locale without regression:
- In `GraduationDemoToolbar`:
  ```ts
  import { useRouter } from "@/i18n/navigation";
  ```
- Because `useRouter` is instantiated from `@/i18n/navigation` (which wraps `next-intl/navigation`), calling `router.push('/seller')`:
  - When the user is on `/en/...`, it navigates to `/en/seller`.
  - When the user is on `/ar/...`, it navigates to `/ar/seller`.
- The locale is never stripped or reset to default during persona transitions.

### 6.2 Label Rendering & Directional Styling
- **Persona Labels**: Each persona in `DEMO_PERSONAS` already carries both `labelEn` and `labelAr`. The dropdown selects the matching label based on `useLocale()`:
  ```ts
  const personaLabel = locale === "ar" ? persona.labelAr : persona.labelEn;
  ```
- **RTL Alignment**: The layout assigns `dir="rtl"` on `<html>` when `locale === "ar"` (`src/app/[locale]/layout.tsx:39`).
- Tailwind CSS v4 logical classes (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`, `start-0`, `end-0`) ensure the dropdown, popover flyout, icons, and text automatically flip alignment correctly between English and Arabic.
- **Middleware Compatibility**: `src/proxy.ts` uses regex `^\/(en|ar)\/(seller|partner|admin)(\/|$)`, ensuring both language routes are equally protected and validated.

### 6.3 Bilingual Parity Test Check
The existing test `tests/unit/messages-parity.test.ts` validates that all keys in `messages/en.json` and `messages/ar.json` are 100% identical. Any updated or scrubbed keys in `DemoToolbar` must be mirrored across both files.

---

## 7. Intelligent Portal Tab Auto-Selection (Architecture Enhancement)

Currently, when a persona switches to `/partner` or `/admin`, the portal page loads with a hardcoded initial tab regardless of the persona's specific role:
- In `PartnerPortalClient`, `tab` defaults to `"inspection"`.
- In `AdminPortalClient`, `tab` defaults to `"kpis"`.
- In `SellerPortalClient`, `activeTab` defaults to `"single"`.
- In `StorefrontClient`, `activeTab` defaults to `"catalog"`.

### Recommended Enhancement
Because each persona represents a specialized operational workflow, defaulting the initial tab in the client portal based on `activeRole` and `accountType` significantly improves the demonstration experience:

| Persona | DB Role & Account Type | Target Portal | Intelligent Initial Tab |
|---|---|---|---|
| 1. Individual Seller | `Customer`, `Individual` | `/seller` | `"single"` (Single item submission) |
| 2. Corporate Seller | `Customer`, `Company` | `/seller` | `"bulk"` (B2B bulk liquidation manifest) |
| 3. Individual Buyer | `Customer`, `Individual` | `/store` | `"catalog"` (Browse serialized store) |
| 4. Corporate Buyer | `Customer`, `Company` | `/store` | `"quotes"` (B2B bulk quotes & RFQs) |
| 5. Courier / Drop-off Hub | `Courier`, `Individual` | `/partner` | `"logistics"` (Pickup & QR intake) |
| 6. Bulky Transport Team | `Courier`, `Individual` | `/partner` | `"logistics"` (Batch manifest execution) |
| 7. Partner Inspector | `Partner_Inspector`, `Individual` | `/partner` | `"inspection"` (Technical check & NIST wipe) |
| 8. Refurbishment Tech | `Partner_Refurb_Tech`, `Individual` | `/partner` | `"refurb"` (Work orders & parts consumption) |
| 9. Dismantling Tech | `Partner_Dismantle_Tech`, `Individual` | `/partner` | `"dismantle"` (Harvesting & scrap logging) |
| 10. Warehouse Manager | `Partner_Warehouse_Mgr`, `Individual` | `/partner` | `"intake"` (Warehouse barcode intake) |
| 11. Customer Service | `Customer_Service`, `Individual` | `/admin` | `"warranty"` (Claims triage & support) |
| 12. Platform Admin | `Admin`, `Individual` | `/admin` | `"kpis"` (MIS KPIs & sustainability metrics) |

This can be achieved cleanly by initializing `useState` with a function derived from `activeRole` / `accountType` in each client component.

---

## 8. Affected Files & Dependency Mapping

| File Path | Type of Modification | Risk Level | Description of Changes |
|---|---|---|---|
| `src/components/demo/graduation-demo-toolbar.tsx` | Modify | Medium | Replace 12 grid buttons with single compact `<select>` dropdown menu; refactor container to docked/floating bar; make inbox drawer a popover flyout; add `data-testid="persona-select"`. |
| `src/components/demo/demo-toolbar-wrapper.tsx` | Modify / Verify | Low | Verify props passed to client toolbar; ensure current persona ID can be derived from `activeUserId` or email. |
| `src/lib/auth/rbac.ts` | Modify / Refine | Low | Clean up academic numbering in `labelEn` and `labelAr` (e.g., change `"1. Individual Seller"` to `"Individual Seller"` and `"١. بائع فردي"` to `"بائع فردي"`), or keep clean titles while maintaining the exact 12-element array length. |
| `messages/en.json` | Modify | Low | Scrub academic tags from `DemoToolbar` namespace (`"Role Simulator"`, remove `"SRS 6.2"` and `"8 Clean DB Roles"`). Add dropdown group labels. |
| `messages/ar.json` | Modify | Low | Mirror changes from `messages/en.json` with authentic Arabic terminology (`"محاكي الأدوار"`). |
| `src/app/[locale]/layout.tsx` | Modify / Verify | Low | Ensure proper z-index and spacing if toolbar is docked or floating, avoiding header clipping. |
| `src/components/partner/partner-portal-client.tsx` | Optional Enhance | Low | Default `tab` state based on `activeRole` (`Courier` $\rightarrow$ `logistics`, `Refurb` $\rightarrow$ `refurb`, etc.). |
| `src/components/admin/admin-portal-client.tsx` | Optional Enhance | Low | Default `tab` state based on `activeRole` (`Customer_Service` $\rightarrow$ `warranty`, `Admin` $\rightarrow$ `kpis`). |
| `src/components/seller/seller-portal-client.tsx` | Optional Enhance | Low | Default `activeTab` to `bulk` for corporate sellers. |
| `src/components/store/storefront-client.tsx` | Optional Enhance | Low | Default `activeTab` to `quotes` for corporate buyers. |
| `tests/unit/rbac.test.ts` | Verify | None | Run `vitest` to verify 12 personas and 8 roles pass assertion. |
| `tests/unit/graduation-demo-scenarios.test.ts` | Verify | None | Run `vitest` to verify scenario 1 passes assertion. |
| `tests/unit/messages-parity.test.ts` | Verify | Low | Run `vitest` to ensure exact key parity between `en.json` and `ar.json`. |

---

## 9. Potential Edge Cases & Mitigations

1. **Re-selecting the Currently Active Persona**:
   - *Risk*: If the user selects the persona they are already authenticated as, the system might redundantly sign in or trigger a needless full-page refresh.
   - *Mitigation*: In `onChange`, compare `e.target.value` with `activeUserId` (or `activePersonaId`). If identical, do nothing.
2. **Switching Between Personas Sharing the Same Route**:
   - *Risk*: When switching from Inspector to Refurb Tech, both have `defaultRoute: "/partner"`. Calling `router.push('/partner')` while already at `/partner` might not trigger a Server Component re-fetch.
   - *Mitigation*: Ensure `router.refresh()` is called immediately following `router.push()`, forcing Next.js App Router to re-fetch Server Components with the new session cookie.
3. **Session Cookie Propagation to Middleware**:
   - *Risk*: Middleware reading cookies before the Server Action response finishes writing them.
   - *Mitigation*: Next.js Server Actions automatically flush updated cookies in the action response headers. `router.push` and `router.refresh` are only called *after* the Server Action completes (`await switchDemoPersonaAction(...)`), guaranteeing the browser holds the new session cookie.
4. **Mobile Viewport Overflow**:
   - *Risk*: A multi-item toolbar overflowing horizontally on narrow mobile screens (320px–375px).
   - *Mitigation*: Use a flex-wrap container with compact gap styling (`gap-2`), truncate long email labels on small screens (`max-w-[120px] truncate`), and place auxiliary buttons (Inbox, Aging, Sign Out) into compact icon buttons or a secondary menu if screen width is constrained.
5. **Popover Drawer Stacking Context & Clipping**:
   - *Risk*: If the toolbar is docked or floating with `overflow-hidden`, the notification drawer or dropdown could be clipped.
   - *Mitigation*: Do NOT set `overflow-hidden` on the toolbar container. Ensure `z-50` and relative/absolute positioning for popover elements.
6. **Playwright E2E Automation Stability (Requirement R4 Dependency)**:
   - *Risk*: Playwright tests struggling to select personas if the dropdown relies on non-standard div click listeners.
   - *Mitigation*: Use a standard `<select data-testid="persona-select">`. In Playwright:
     ```ts
     await page.selectOption('[data-testid="persona-select"]', 'inspector');
     await page.waitForURL('**/partner');
     ```
     This is fast, deterministic, and 100% resilient across headless browser runs.

---

## 10. Conclusion & Recommendations for Implementation

1. **Adopt a Docked Sticky Top Bar (`sticky top-0 z-50`)**:
   - Provides a clean ~40px bar at the top of the viewport.
   - Contains:
     1. Brand Badge: "Role Simulator" / "محاكي الأدوار"
     2. Consolidated `<select data-testid="persona-select">` with 3 `<optgroup>` categories.
     3. Active Role & Account Type chip.
     4. Compact action buttons: Run Aging, Simulated Inbox with unread badge count (popover flyout), and Sign Out.
2. **Scrub All Academic Labels**:
   - Remove "GRADUATION DEMO TOOLBAR", "12 SRS Personas", "8 Clean DB Roles", and "SRS 6.2" tags from `messages/en.json`, `messages/ar.json`, and the toolbar UI components.
3. **Preserve Exact Data Contracts**:
   - Do not alter `DEMO_PERSONAS` IDs, user UUIDs, roles, account types, or passwords in `src/lib/auth/rbac.ts` so that existing unit tests (`rbac.test.ts`, `graduation-demo-scenarios.test.ts`) continue to pass without error.
4. **Implement Intelligent Tab Defaulting**:
   - Update `PartnerPortalClient`, `AdminPortalClient`, `SellerPortalClient`, and `StorefrontClient` to default their active tab according to the persona's operational role.
