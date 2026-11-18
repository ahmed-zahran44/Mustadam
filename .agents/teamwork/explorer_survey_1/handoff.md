# Handoff Report: Requirement R1 (Consolidated Role Simulation Dropdown & Demo Toolbar Architecture)

- **Agent**: `explorer_survey_1` (Role Simulation & Architecture Explorer)
- **Recipient**: `aa8e9444-643b-42e4-aaa4-cc5204480e27` (Parent / Orchestrator)
- **Handoff Type**: Hard (Investigation complete, fully populated)
- **Reference Document**: `d:\Mustadam Project\.agents\teamwork\explorer_survey_1\survey_report.md`

---

## 1. Observation

1. **Toolbar Component Locations**:
   - `src/app/[locale]/layout.tsx` (line 6, line 45): Directly mounts `<DemoToolbarWrapper />` above `<SiteHeader />` inside the root `<NextIntlClientProvider>` on every locale route.
   - `src/components/demo/demo-toolbar-wrapper.tsx` (lines 8–33): Asynchronous Server Component that calls `getActiveSessionProfile()` (`src/lib/auth/session.ts`) and retrieves up to 10 notifications from the `notifications` table for `activeUserId`, passing them down to `<GraduationDemoToolbar />`.
   - `src/components/demo/graduation-demo-toolbar.tsx` (lines 135–155): Client Component rendering 12 individual `<button>` elements in a multi-row grid (`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5 pt-1`).
   - `src/components/demo/graduation-demo-toolbar.tsx` (lines 74–126): Statically positioned container (`bg-slate-900 text-slate-100 border-b border-slate-700 text-xs`) displaying academic labels ("GRADUATION DEMO TOOLBAR", "1-Click Switch Across All 12 SRS Personas (8 Clean DB Roles)"), active user chip, aging job trigger button, inbox toggle, and sign out button.

2. **12 Personas & RBAC Mapping (`src/lib/auth/rbac.ts`, lines 6–127 & `supabase/seed.sql`, lines 9–41, 58–72)**:
   - `DEMO_DEFAULT_PASSWORD = "Mustadama2026!"` (line 129).
   - Exactly 12 persona objects in `DEMO_PERSONAS`, each with `id`, `userId`, `email`, `labelEn`, `labelAr`, `role`, `accountType`, and `defaultRoute`.
   - The 12 personas map cleanly to 8 clean DB RBAC roles:
     - 4 Customers: `seller-individual` (`/seller`), `seller-corporate` (`/seller`, Company), `buyer-individual` (`/store`), `buyer-corporate` (`/store`, Company).
     - 6 Partner Operators: `courier-hub` (`/partner`), `transport-bulky` (`/partner`), `inspector` (`/partner`), `refurb-tech` (`/partner`), `dismantle-tech` (`/partner`), `warehouse-mgr` (`/partner`).
     - 2 Administrators: `customer-service` (`/admin`), `admin` (`/admin`).
   - `PORTAL_ALLOWED_ROLES` (lines 137–152): Enforces RBAC permissions per portal (`seller`, `store`, `partner`, `admin`).

3. **Session Switching Mechanism (`src/lib/auth/actions.ts`, lines 14–37)**:
   - `switchDemoPersonaAction(personaId)` executes `supabase.auth.signInWithPassword({ email: persona.email, password: DEMO_DEFAULT_PASSWORD })` using `createSupabaseServerClient()` (`src/lib/supabase/server.ts`).
   - Session tokens are stored in standard Supabase HTTP-only SSR cookies (`sb-<project-ref>-auth-token`).
   - Calls `revalidatePath('/', 'layout')` and returns `{ ok: true, defaultRoute: persona.defaultRoute, role, email }`.
   - In `graduation-demo-toolbar.tsx` (lines 44–52), `startTransition` calls `router.push(res.defaultRoute)` followed by `router.refresh()`.

4. **Middleware Protection (`src/proxy.ts`, lines 38–60)**:
   - Next.js 16 proxy middleware intercepts `/[locale]/(seller|partner|admin)`.
   - Resolves active user session from cookies via `supabase.auth.getUser()`.
   - Enforces `canAccessPortal(role, portal)`. If unauthorized, redirects to `/[locale]/login?denied=[portal]`. If unauthenticated, redirects to `/[locale]/login?next=[pathname]`.

5. **Bilingual Support & Navigation (`src/i18n/navigation.ts`, lines 1–6 & `src/i18n/routing.ts`, lines 1–11)**:
   - Navigation utilities (`router`, `Link`, `redirect`) wrap Next-Intl routing with `locales: ["en", "ar"]`.
   - `router.push('/seller')` preserves current locale prefix (`/en/seller` or `/ar/seller`).
   - `tests/unit/messages-parity.test.ts` validates 100% key parity between `messages/en.json` and `messages/ar.json`.
   - All 31 unit tests pass (`cmd /c npm test` exited 0).

---

## 2. Logic Chain

1. **Observation 1 & 2 $\rightarrow$ Current UI Footprint Issue**:
   Because the 12 personas are rendered as individual buttons in a multi-row grid inside a static header block (`graduation-demo-toolbar.tsx:135`), it consumes 60–120px of vertical height at the top of every page and scrolls away when navigating long pages.
2. **Observation 2 & 3 $\rightarrow$ State Switching Feasibility**:
   Because state switching operates entirely through standard Server Actions (`switchDemoPersonaAction`), Supabase SSR auth cookies, and Next.js navigation (`router.push` + `router.refresh`), the UI trigger mechanism is decoupled from the underlying auth logic. Replacing the 12 `<button>` elements with a single `<select>` dropdown menu will preserve 100% of the existing auth and routing behavior while shrinking the UI footprint to a single line.
3. **Observation 1 & 4 $\rightarrow$ Toolbar Placement (Floating or Docked)**:
   Because the toolbar is rendered inside the root `LocaleLayout` (`layout.tsx:45`), applying `sticky top-0 z-50` (or `fixed bottom-4 inset-x-auto start-1/2 -translate-x-1/2 z-50`) makes it persistent and accessible across all pages while scrolling, satisfying Acceptance Criteria R1.
4. **Observation 4 & 5 $\rightarrow$ Bilingual & RBAC Stability**:
   Because `router.push` from `@/i18n/navigation` preserves locale prefixes, and `DEMO_PERSONAS` contains both `labelEn` and `labelAr`, switching personas in the dropdown maintains language and triggers valid middleware checks without breaking Arabic (RTL) or English (LTR) layout.

---

## 3. Caveats

1. **Tab Synchronization**: Currently, navigating to `/partner` or `/admin` displays a hardcoded initial tab (`"inspection"` on `/partner`, `"kpis"` on `/admin`). While functional, enhancing the portal client components to initialize tabs based on `activeRole` (e.g., Courier $\rightarrow$ Logistics, Warehouse Mgr $\rightarrow$ Intake, Refurb Tech $\rightarrow$ Refurbishment) will make persona switching much more intuitive.
2. **Academic Label Scrubbing (Requirement R2 Dependency)**: Cleaning up toolbar titles and persona labels must be coordinated so that `messages/en.json` and `messages/ar.json` keep identical keys (to avoid failing `messages-parity.test.ts`) and `DEMO_PERSONAS` maintains its 12-element length (to avoid failing `rbac.test.ts`).
3. **Playwright E2E Setup (Requirement R4 Dependency)**: Playwright test configuration and test suites do not exist yet in the repo. Using a standard `<select data-testid="persona-select">` will allow Playwright scripts in R4 to select personas with `page.selectOption()`.

---

## 4. Conclusion

Requirement R1 is clear, self-contained, and ready for implementation:
1. **Refactor `src/components/demo/graduation-demo-toolbar.tsx`**:
   - Replace the 12-button grid with a single `<select id="persona-select" data-testid="persona-select">` with 3 `<optgroup>` categories (Customers, Operations & Partners, Management & Admin).
   - Style the toolbar as a compact sticky top bar (`sticky top-0 z-50`) or floating bottom bar (`fixed bottom-4`).
   - Turn the notification drawer into a floating flyout popover to prevent page layout shift.
   - Remove academic demonstration tags ("GRADUATION DEMO TOOLBAR", "12 SRS Personas", "SRS 6.2").
2. **Update Localization**:
   - Update `DemoToolbar` in `messages/en.json` and `messages/ar.json` to production terminology ("Role Simulator", "Quick Persona Switcher").
3. **Enhance Client Portals**:
   - Add initial tab defaulting based on `activeRole` and `accountType` in `PartnerPortalClient`, `AdminPortalClient`, `SellerPortalClient`, and `StorefrontClient`.

---

## 5. Verification Method

To independently verify the investigation and subsequent implementation:

1. **Unit Test Suite**:
   Execute the test suite to ensure no data contract or RBAC regressions:
   ```powershell
   cmd /c npm test
   ```
   *Expected Result*: All 7 test files (`rbac.test.ts`, `graduation-demo-scenarios.test.ts`, `messages-parity.test.ts`, etc.) pass with 31+ passing tests.

2. **Component Inspection**:
   Inspect `src/components/demo/graduation-demo-toolbar.tsx` to verify:
   - Exactly one `<select data-testid="persona-select">` exists.
   - No 12 separate persona `<button>` elements remain.
   - Container has `sticky top-0 z-50` or `fixed bottom-4` positioning.

3. **Interactive / E2E Verification**:
   - Run the application (`cmd /c npm run dev`).
   - Navigate to `http://localhost:3000/en` and `http://localhost:3000/ar`.
   - Verify the dropdown displays all 12 personas with localized titles.
   - Select "7. Partner Inspector" $\rightarrow$ Verify active user updates to `inspector@mustadama.eg` and navigates to `/[locale]/partner`.
   - Select "1. Individual Seller" $\rightarrow$ Verify active user updates to `seller.individual@mustadama.eg` and navigates to `/[locale]/seller`.
   - Scroll down long pages $\rightarrow$ Verify the toolbar remains docked/floating and accessible.
