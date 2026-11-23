# Mustadama ("مُستدام") — Master Implementation Tasks & Roadmap

> **Single Source of Truth (Execution Tracker):** Every task in this file maps directly to requirements in [PROJECT.md](file:///d:/Mustadam%20Project/PROJECT.md) and components in [ARCHITECTURE.md](file:///d:/Mustadam%20Project/ARCHITECTURE.md). **Rule:** Mark tasks `[x]` as they are completed and verified, and log every completed milestone in [CHANGELOG.md](file:///d:/Mustadam%20Project/CHANGELOG.md).

---

## Phase 0: Living Documentation & Anti-Hallucination Foundation
*Goal: Establish permanent project memory and strict workspace rules before writing application code.*

- [x] **T0.1:** Create [PROJECT.md](file:///d:/Mustadam%20Project/PROJECT.md) with 4 portals, 8 clean DB RBAC roles (`Customer`, `Partner_Inspector`, `Partner_Refurb_Tech`, `Partner_Dismantle_Tech`, `Partner_Warehouse_Mgr`, `Courier`, `Customer_Service`, `Admin`) mapped to 12 Graduation Demo Toolbar personas, MoSCoW traceability table (`FR-01`–`FR-26`, `NFR-01`–`NFR-05`), exact business formulas (`FR-04` pricing, `FR-08`/`FR-17` equal batch logistics split, `FR-14`/`FR-15` harvested `estimated_cost` rollup, `FR-12` 7-day / 168h offer Auto-Reject, `FR-19` 90-day `Decommissioned_Aged`, `FR-23` warranty), and the strict state transition matrix.
- [x] **T0.2:** Create [ARCHITECTURE.md](file:///d:/Mustadam%20Project/ARCHITECTURE.md) with Next.js + Local Supabase blueprint, 23 PostgreSQL table definitions (including `pickup_manifests.total_batch_logistics_cost` and `spare_parts_inventory.estimated_cost`), state/audit triggers, concurrency locking RPCs, RLS policies, and adapter contracts.
- [x] **T0.3:** Create [DECISIONS.md](file:///d:/Mustadam%20Project/DECISIONS.md) with `ADR-001` through `ADR-007`.
- [x] **T0.4:** Create [TASKS.md](file:///d:/Mustadam%20Project/TASKS.md) (this file) with phased, requirement-mapped task tracking.
- [x] **T0.5:** Create [CHANGELOG.md](file:///d:/Mustadam%20Project/CHANGELOG.md) with `v0.1.0` documentation baseline.
- [x] **T0.6:** Create [AGENTS.md](file:///d:/Mustadam%20Project/AGENTS.md) and [.agents/rules/mustadama-docs-sync.md](file:///d:/Mustadam%20Project/.agents/rules/mustadama-docs-sync.md) enforcing pre-flight reads and post-task documentation updates.

---

## Phase 1: Local Environment, Next.js (EN/AR RTL) & Supabase Initialization
*Goal: Scaffold the bilingual Next.js application and initialize the local Supabase CLI project.*

- [x] **T1.1:** Initialize Git repository and Next.js 16 (App Router, TypeScript, Tailwind CSS 4, ESLint, Vitest) in `d:\Mustadam Project`. *(Verified: `npm run build`, `npm run lint`, `npm test` 3/3 pass.)*
- [x] **T1.2:** Configure `next-intl` for bilingual **English (`en`, LTR)** and **Arabic (`ar`, RTL)** routing, Cairo + Inter typography, language switcher, and base portal layouts (`/seller`, `/store`, `/partner`, `/admin`). *(All 4 portals + home prerender under `/en` and `/ar`; `messages/en.json` and `messages/ar.json` key parity enforced by test.)*
- [x] **T1.3:** Initialize Supabase CLI config (`npx supabase init`) creating `supabase/config.toml` and configure `@supabase/supabase-js` + `@supabase/ssr` client utilities (`src/lib/supabase/`).
- [x] **T1.4:** Connect to Cloud Supabase (`https://xijhkffkmlaghqowmrmz.supabase.co`) via `supabase-mustadam` MCP and remove all local Docker/WSL artifacts per user decision (`Choice 2: Free Cloud Supabase`).

---

## Phase 2: Database Schema (23 Tables), Triggers, Concurrency RPCs & Seed Data
*Goal: Implement the full PostgreSQL data model, immutable audit log, checkout locks, and demo seed dataset.*
*Requirements Covered: `FR-08`, `FR-12`, `FR-14`, `FR-15`, `FR-17`, `FR-19`, `NFR-02`, `NFR-04`, `NFR-05`, SRS Section 4 & Section 5.*

- [x] **T2.1:** Create migration `0001_core_schema.sql` defining all 23 tables (`users` with 8 DB RBAC roles, `categories`, `partner_hubs`, `pickup_manifests` with `total_batch_logistics_cost`, `acquisition_requests`, `serialized_items` with `Decommissioned_Aged` state & 7-day `offer_expires_at`, `item_photos`, `item_status_history`, `inspection_records`, `return_tasks`, `payouts`, `refurbishment_logs`, `dismantling_tickets`, `spare_parts_inventory` with `estimated_cost`, `recycling_batches`, `scrap_entries`, `quote_requests`, `quote_items`, `orders`, `order_items_warranty`, `payment_events`, `warranty_claims`, `notifications`) + foreign key indexes.
- [x] **T2.2:** Create migration `0002_lifecycle_triggers_and_rpcs.sql` implementing:
  - `fn_enforce_and_audit_item_status` & `fn_log_initial_item_status` (state transition guard including `Listed_In_Store -> Decommissioned_Aged -> Scrap_Ready_For_Recycling`, `FR-11` data wipe gate, `FR-12` 7-day `offer_expires_at` default, `FR-13` refurbishment gate, and immutable `item_status_history` insert per `NFR-02`).
  - `fn_consume_harvested_spare_part` (automatically adds consumed part's `estimated_cost` to `refurbishment_logs.parts_cost` and updates item `refurbishment_cost` & `total_unit_cost` per `FR-14`, `FR-15`, `FR-17`).
  - `rpc_allocate_batch_logistics_cost` (splits `total_batch_logistics_cost` equally across all items in the batch: `Allocated_Logistics_Cost = Total_Batch_Cost / Items_Count_In_Batch` per `FR-08`, `FR-17`).
  - `rpc_create_order_with_reservation` (`SELECT ... FOR UPDATE NOWAIT` 15-minute checkout lock per `NFR-04` & `FR-21`).
  - `rpc_process_payment_webhook` (`SUCCESS` / `FAILED` order & item state transition per `FR-21`).
  - `rpc_run_inventory_aging` (30–60–90+ day pricing & `Decommissioned_Aged` transition per `FR-19`, plus 7-day / 168h expired offer **Auto-Reject** into `Return_In_Progress` per `FR-12`).
- [x] **T2.3:** Create migration `0003_rls_and_storage.sql` enabling RLS across all 23 tables, defining role-based policies for the 8 DB roles (`Customer`, `Partner_Inspector`, `Partner_Refurb_Tech`, `Partner_Dismantle_Tech`, `Partner_Warehouse_Mgr`, `Courier`, `Customer_Service`, `Admin`), and creating storage buckets (`item-photos`, `certificates`, `invoices`).
- [x] **T2.4:** Author and apply `supabase/seed.sql` with 12 pre-configured demo user accounts (`auth.users`, `auth.identities`, `public.users` representing the 12 SRS personas mapped to the 8 DB roles), bilingual Electronics & Furniture categories (with `diagnostic_questions_json`), Partner Hubs across Cairo/Giza/Alexandria, and sample `serialized_items` in lifecycle states.
- [x] **T2.5:** Apply migrations to Cloud Supabase via `supabase-mustadam` MCP, run `get_advisors` (`security` & `performance`), harden `SECURITY DEFINER` execute grants & FK indexes, and generate TypeScript types (`src/types/database.types.ts` & `src/types/domain.ts`).

---

## Phase 3: Authentication, 8-Role DB RBAC & 12-Persona Graduation Demo Toolbar
*Goal: Deliver complete Individual/Corporate Customer registration, role-guarded routing, and one-click persona switching for the graduation defense.*
*Requirements Covered: `FR-01`, `FR-02`, Section 6.2.*

- [x] **T3.1:** Implement Individual & Corporate `Customer` registration and login pages (`/[locale]/(auth)/register`, `/[locale]/(auth)/login`) validating uniqueness of email/phone and format of Corporate `tax_id` & `commercial_reg` (`FR-01`), allowing any `Customer` to both buy and sell. *(Hardened with elevated `createAdminClient` with `service_role` to assign `role = 'Customer'` in JWT `app_metadata` and safely bypass RLS during user registration, paired with fallback self-insert RLS policy).*
- [x] **T3.2:** Implement Next.js middleware & server-side RBAC guards restricting `/seller` & `/store` (`Customer` + `account_type` checks for B2B routes), `/partner` (`Courier`, `Partner_Warehouse_Mgr`, `Partner_Inspector`, `Partner_Refurb_Tech`, `Partner_Dismantle_Tech`), and `/admin` (`Customer_Service`, `Admin`) (`FR-02`).
- [x] **T3.3:** Implement `SimulatedNotificationAdapter` (`src/lib/adapters/notification-service.ts`) writing OTPs, status updates, and price offers to `public.notifications` (`Section 6.2`).
- [x] **T3.4:** Build the **Graduation Demo Toolbar** (`src/components/demo/graduation-demo-toolbar.tsx`) displaying all **12 SRS persona buttons** (switching session to the corresponding pre-seeded account and routing to its view), a live Simulated SMS/Email Notification Drawer, and a manual trigger for the `FR-19` aging & `FR-12` 7-day Auto-Reject job.

---

## Phase 4: Module 2 — Seller Portal: Sourcing, Diagnostic Pricing & Bulk Requests
*Goal: Allow Individual and Corporate sellers (`Customer`) to submit items, complete dynamic diagnostic questionnaires, and get instant price range estimates.*
*Requirements Covered: `FR-03`, `FR-04`, `FR-05`, `NFR-03`, `NFR-05`.*

- [x] **T4.1:** Implement client-side image compression utility (`NFR-03`) and multi-photo uploader (min 3, max 5 photos) storing to Supabase Storage bucket `item-photos` (`FR-03`).
- [x] **T4.2:** Build dynamic JSON questionnaire renderer reading `categories.diagnostic_questions_json` (`NFR-05`, `FR-03`) in English and Arabic.
- [x] **T4.3:** Implement & unit-test `calculateEstimatedPriceRange` (`src/lib/domain/pricing-engine.ts`) computing `estimated_min_price` and `estimated_max_price` (EGP) with mandatory legal disclaimer (`FR-04`).
- [x] **T4.4:** Build Corporate Seller Bulk Liquidation submission flow (`/seller`, gated to `Customer` with `account_type = 'Company'`) supporting multi-line item entry and structured CSV/JSON manifest import (`FR-05`).

---

## Phase 5: Module 3 — Logistics, Partner Drop-off QR, Bulky Routing & Warehouse Intake
*Goal: Track physical item custody from seller handover to serialized warehouse barcode generation and equal batch cost allocation.*
*Requirements Covered: `FR-06`, `FR-07`, `FR-08`, `FR-09`, `FR-17`.*

- [x] **T5.1:** Build Small Device Handover Selector (`FR-06`) allowing sellers to pick Door-to-Door Courier (address + time slot) or Authorized Partner Drop-off Hub (map/list + generated QR/Tracking Code).
- [x] **T5.2:** Build Partner Logistics Custody View (`/partner`) for Courier collection confirmation and Drop-off Hub QR/tracking code lookup (`FR-07`), transitioning items to `In_Transit_To_Warehouse` or `Received_At_Dropoff_Hub`.
- [x] **T5.3:** Build Bulky Furniture Pre-Verification & Zone Batch Routing (`FR-08`, `FR-17`): Admin/Inspector pre-verification approval gate + geographic grouping into `Pickup_Manifests` for the Transport Team, allocating `Allocated_Logistics_Cost = Total_Batch_Cost / Items_Count_In_Batch` equally across all items in the batch.
- [x] **T5.4:** Build Partner Warehouse Intake View (`/partner`) generating unique `barcode` (`MST-YYYY-NNNNN`) and transitioning items to `Received_Pending_Inspection` (`FR-09`).

---

## Phase 6: Modules 4 & 5 — Inspection, NIST Data Wipe, 7-Day Offer Decision, Refurbishment, Dismantling & Recycling
*Goal: Complete the technical hub workflows and circular economy engine.*
*Requirements Covered: `FR-10`, `FR-11`, `FR-12`, `FR-13`, `FR-14`, `FR-15`, `FR-16`, `FR-17`.*

- [x] **T6.1:** Build Partner Inspection Workbench (`/partner`) logging `Inspection_Records` (`Ready_For_Sale`, `Repairable`, `Irreparable`) (`FR-10`).
- [x] **T6.2:** Implement Mandatory NIST 800-88 Data Wipe Certification gate & downloadable **Data Destruction Certificate** generator (`/api/documents/certificate/[id]`) (`FR-11`) linked to the seller's request.
- [x] **T6.3:** Build Final Price Offer & **7-Day (168-Hour)** Seller Decision Workflow (`FR-12`):
  - Inspector sets `final_purchase_price` $\rightarrow$ sets `offer_expires_at = inspected_at + 7 days` and notifies seller via `SimulatedNotificationAdapter`.
  - Seller Accepts within 7 days $\rightarrow$ records simulated `Payouts` entry and routes item to `Listed_In_Store`, `Under_Refurbishment`, or `Pending_Dismantling`.
  - Seller Rejects OR fails to respond within 7 days (**Auto-Reject**) $\rightarrow$ calculates Return Transport & Inspection Fee, creates `Return_Tasks`, transitions item to `Return_In_Progress`, and locks warehouse release until simulated fee settlement.
- [x] **T6.4:** Build Refurbishment Technician Portal (`/partner`) (`FR-13`, `FR-15`, `FR-17`):
  - Log labor descriptions, request/consume harvested parts from `Spare_Parts_Inventory` (automatically adding each consumed part's `estimated_cost` to `parts_cost` and `Refurbishment_Cost` per `FR-15`), compute `total_unit_cost` (`FR-17`), assign `Grade A/B/C`, and close ticket to list item on storefront.
- [x] **T6.5:** Build Dismantling Technician & Scrap Recycling Portal (`/partner`) (`FR-14`, `FR-16`, `FR-19`):
  - Process both `Pending_Dismantling` (irreparable) and `Decommissioned_Aged` (aged > 90 days) items.
  - Harvest functional parts with `estimated_cost` into `Spare_Parts_Inventory` linked to `source_item_serial_id` (`FR-14`).
  - Log remaining scrap weight (`kg`) by material category (`E-waste`, `Metal`, `Wood`, `Plastic`) in `Scrap_Entries`, transition item to `Scrap_Ready_For_Recycling`, and record licensed recycler handovers in `Recycling_Batches` (`Recycled_Closed`) (`FR-16`).

---

## Phase 7: Modules 6 & 7 — Storefront, 30–60–90 Aging (`Decommissioned_Aged`), B2B Quotes, Simulated Payment & Warranty
*Goal: Deliver the serialized buyer storefront, automated aging markdowns, B2B quotes, PCI-safe simulated checkout, tax invoices, and warranty claims.*
*Requirements Covered: `FR-17`, `FR-18`, `FR-19`, `FR-20`, `FR-21`, `FR-22`, `FR-23`, `FR-24`, `NFR-01`, `NFR-03`, `NFR-04`.*

- [x] **T7.1:** Build Serialized Storefront Catalog (`/store`) (`FR-18`, `NFR-03`) displaying `Listed_In_Store` items with real photos, specs, `Grade A/B/C` badge, aging discount indicator, warranty summary, and Category/Price/Grade filters.
- [x] **T7.2:** Implement & unit-test the 30–60–90 Day Inventory Aging & 7-Day Offer Auto-Reject Cron endpoint (`/api/cron/aging`) and Demo Toolbar trigger (`FR-12`, `FR-19`), verifying that Day 91+ transitions `Listed_In_Store` $\rightarrow$ `Decommissioned_Aged` and creates an `aged_out` dismantling ticket.
- [x] **T7.3:** Build Corporate Bulk Quote Request workflow (`/store` & `/admin`) allowing Corporate Buyers (`Customer` + `account_type = 'Company'`) to request bulk quotes and Admin to apply a custom B2B discount valid for 7 days (`FR-20`).
- [x] **T7.4:** Build Checkout & Simulated Multi-Channel Payment Module (`FR-21`, `NFR-01`, `NFR-04`):
  - 15-minute reservation countdown via `rpc_create_order_with_reservation`.
  - Payment Simulator UI for **Bank Cards (Visa/Mastercard/Meeza)**, **Mobile Wallets**, and **InstaPay** with scenario selector (`SUCCESS` / `FAILED`) and `/api/webhooks/payment` callback.
- [x] **T7.5:** Build Automated Tax Invoice Generator (`/api/documents/invoice/[id]`) (`FR-22`) including Corporate Buyer `tax_id` and `commercial_reg`.
- [x] **T7.6:** Build Order Delivery Confirmation, Automated Category Warranty Calculation (`FR-23`), and Buyer Warranty Claim Submission & Customer Service/Tech routing (`FR-24`).

---

## Phase 8: Module 8 — Admin Management, Marketing Campaigns, MIS & Sustainability Dashboard
*Goal: Complete the platform manager's control center, customer segmentation campaigns, real-time MIS analytics, and final verification.*
*Requirements Covered: `FR-25`, `FR-26`.*

- [x] **T8.1:** Build Admin Category, Diagnostic Schema & Pricing/Warranty Policy Manager (`/admin`) (`NFR-05`).
- [x] **T8.2:** Build Customer Segmentation & Targeted Campaign Manager (`/admin`) filtering buyers by `Individual`, `Startup`, or `Enterprise` and dispatching simulated promo campaigns (`FR-25`).
- [x] **T8.3:** Build Real-Time MIS & Sustainability Dashboard (`/admin`) (`FR-26`) with visual KPI cards & aging breakdown for:
  - **Financial KPIs:** Total revenue, average profit margin per item after logistics/repair costs, seller offer acceptance rate.
  - **Operational KPIs:** Inventory aging breakdown (`0–30`, `31–60`, `61–90`, `91+ Decommissioned_Aged` days).
  - **Environmental Impact KPIs:** Total weight (`kg`) of e-waste and furniture diverted from landfills via refurbishment and licensed recycling handovers.
- [x] **T8.4:** Run full automated test suite (Vitest unit tests, TypeScript check, ESLint) and complete bilingual (`EN` LTR / `AR` RTL) verification across all 12 Demo Toolbar personas.

---

## Phase 9: Enterprise Commercial Production Elevation & End-to-End Verification
*Goal: Transform the academic graduation project into an authentic, production-grade enterprise platform and execute full Playwright end-to-end verification.*
*Requirements Covered: R1, R2, R3, R4.*

- [x] **T9.1 (R1):** Consolidated 12-Role Simulation Dropdown Menu Toolbar (`src/components/demo/graduation-demo-toolbar.tsx`): Replaced 12 cluttered buttons with a single clean `<select data-testid="persona-select">` grouped by Customers, Operations & Logistics, and Governance & Admin. Verified by `tests/unit/role-simulation.test.ts` and `tests/e2e/02-auth-personas.spec.ts`.
- [x] **T9.2 (R2):** Authentic Production UI & Academic Label Scrubbing: Eliminate all exposed internal requirement tags (`FR-01`–`FR-26`, `NFR-01`–`NFR-05`), spec citations (`SRS`), thesis labels, and SQL locking syntax across client portals (`/seller`, `/partner`, `/store`, `/admin`), localization files (`messages/en.json`, `messages/ar.json`), documents (`/api/documents/invoice/[id]`, `/api/documents/certificate/[id]`), and server actions. Verified by `tests/unit/ui-sanitization.test.ts` and `tests/unit/messages-parity.test.ts`.
- [x] **T9.3 (R3):** Polished Root Landing Page (`/`): Implemented production-grade landing page (`src/app/[locale]/page.tsx`) with Hero section & primary CTAs (`/store`, `/seller`), 4 Subsystem & Portal Directory cards (`/store`, `/seller`, `/partner`, `/admin`), Unified Customer Account Gateway (`/login`, `/register`), 4-stage Circular Economy Lifecycle, 6 Platform Trust & Guarantee pillars (NIST SP 800-88, serialized warranty, condition grading, concurrency lock, diagnostic pricing, equal batch logistics), Sustainability Impact metrics, and responsive global bilingual `SiteFooter` (`src/components/layout/site-footer.tsx`) mounted in `src/app/[locale]/layout.tsx`. Verified by `tests/unit/landing-and-footer.test.ts` (8/8 pass) and full Vitest suite (12 suites, 76/76 pass).
- [x] **T9.4 (R4):** Comprehensive Playwright End-to-End Testing & Verification Report: Configured Playwright with sequential execution (`workers: 1`), Next.js auto-managed `webServer`, and Desktop Chrome engine. Authored and executed 6 end-to-end test suites across all 41 user journey scenarios (`01-landing-page.spec.ts`, `02-auth-personas.spec.ts`, `03-storefront.spec.ts`, `04-seller-portal.spec.ts`, `05-partner-portal.spec.ts`, `06-admin-portal.spec.ts`). Published `PLAYWRIGHT_TEST_REPORT.md` and `TEST_READY.md`. Verified 100% pass on 14 unit test suites (112 tests) and clean TypeScript typecheck.
- [x] **T9.5:** `/admin` 100% Completion & Production Hardening: Completed all 6 modular bilingual EN/AR Admin & Customer Service tabs (KPIs & Turnaround/ESG charts + live Aging Engine trigger, Category Create/Edit + Visual Diagnostic Builder, Customer Directory + Segment Switching + Campaign History, Enriched B2B Quotes with Approve/Expire, Warranty Claims triage + Return Authorizations, Bulky Pre-Verification Gate + Serialized Inventory Economics + Immutable Audit Log), fixed `Customer_Service` subdomain access & cross-user notification RLS, and verified with `tests/unit/admin-portal.test.ts` (5/5), full Vitest suite (17 suites, 125/125), `next build`, and Playwright `06-admin-portal.spec.ts` (`ADMIN-01`–`ADMIN-06`, 6/6 pass).
- [x] **T9.6:** Three-Domain Commercial Isolation (`ADR-010`): Isolated `/partner` onto `partner.*` subdomain with `/partner/login` gate (`partnerLoginAction`), removed all internal `/partner` and `/admin` links from customer navbar, footer, and landing page (replaced with Corporate B2B Programs card), added `/api/auth/demo-switch` cross-subdomain Role Simulator handoff, and verified with full unit, build, and Playwright E2E suites.

