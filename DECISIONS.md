# Mustadama ("مُستدام") — Architecture Decision Records (ADRs)

> **Purpose:** This file records architectural and technical decisions for Mustadama so that developers and AI agents never contradict settled choices or re-introduce rejected patterns. Before changing any core technology, schema convention, or workflow, add a new ADR entry here and update [ARCHITECTURE.md](file:///d:/Mustadam%20Project/ARCHITECTURE.md).

---

## ADR-001: Full-Stack Next.js (App Router) + Cloud Supabase (via MCP) Monolith

* **Date:** 2026-11-01 (Updated 2026-11-02)
* **Status:** Accepted
* **Context:** The SRS requires 4 distinct web portals (Seller, Buyer Storefront, Partner Operations, Admin MIS), RESTful backend endpoints (including payment webhooks and scheduled aging jobs), relational ACID transactions across 23 tables, file storage for item photos/PDFs, and role-based access control. Initially we explored running Local Supabase via Docker Desktop, but local disk constraints on `C:\` and the user's explicit preference led to selecting **Choice 2: Free Cloud Supabase** connected via the `supabase-mustadam` MCP server (`https://xijhkffkmlaghqowmrmz.supabase.co`).
* **Decision:** Build Mustadama as a single **Next.js (App Router, TypeScript, Tailwind CSS)** application backed by **Cloud Supabase (`https://xijhkffkmlaghqowmrmz.supabase.co`)** managed via the `supabase-mustadam` MCP server, while keeping all SQL migrations (`supabase/migrations/`) and deterministic seed scripts (`supabase/seed.sql`) tracked in Git.
* **Consequences:**
  * Zero local disk or RAM overhead (no Docker Desktop or WSL 2 VM required on the user's PC).
  * All migrations (`supabase/migrations/`) and seed data (`supabase/seed.sql`) remain in version control and are applied directly to the Cloud Supabase project via MCP (`apply_migration`, `execute_sql`).

---

## ADR-002: Database-Level Enforcement for Item Lifecycle State Machine (`Decommissioned_Aged`), 7-Day Offer Auto-Reject & Immutable Audit Trail

* **Date:** 2026-11-01
* **Status:** Accepted
* **Context:**
  * `NFR-02` and SRS Section 4 mandate that every `Serialized_Items` record strictly follow the state transition matrix and log an immutable audit entry in `Item_Status_History`.
  * `FR-11` requires mandatory NIST 800-88 data wipe verification before storage-bearing electronics leave inspection.
  * `FR-12` grants sellers a **7-day (168-hour)** decision window (`offer_expires_at = inspected_at + interval '7 days'`), after which failure to respond triggers an **Automatic Rejection (`Auto-Reject`)**, transitioning the item to `Return_In_Progress`.
  * `FR-19` requires unsold items after 90 days to transition from `Listed_In_Store` $\rightarrow$ **`Decommissioned_Aged`**, and then from **`Decommissioned_Aged`** $\rightarrow$ `Scrap_Ready_For_Recycling` once dismantled.
* **Decision:** Implement a PostgreSQL trigger function (`fn_enforce_and_audit_item_status`) on `public.serialized_items` and scheduled RPC (`rpc_run_inventory_aging`) that:
  1. Validates `(OLD.current_status -> NEW.current_status)` against the exact allowed transitions, including `Listed_In_Store -> Decommissioned_Aged` and `Decommissioned_Aged -> Scrap_Ready_For_Recycling`.
  2. Rejects transition out of `Received_Pending_Inspection` if the item's category has `requires_data_wipe = true` and `NEW.data_wiped_bool = false`.
  3. Sets `offer_expires_at = inspected_at + interval '7 days'` (168 hours) when entering `Awaiting_Seller_Decision`, and auto-rejects expired offers into `Return_In_Progress` with a `Return_Tasks` record.
  4. Automatically inserts an immutable row into `public.item_status_history` recording `item_serial_id`, `changed_by`, `from_status`, `to_status`, `note`, and `changed_at`.
* **Consequences:** Impossible for any frontend bug, server action, or manual script to corrupt an item's lifecycle state or skip audit logging.

---

## ADR-003: Pessimistic Row-Level Locking + 15-Minute Reservation for Serialized Checkout

* **Date:** 2026-11-01
* **Status:** Accepted
* **Context:** Unlike standard e-commerce with `stock_quantity > 1`, every Mustadama item is a unique serialized unit (`Quantity = 1`). `NFR-04` and `FR-21` require preventing double-purchase race conditions and reserving the item for 15 minutes while `Orders.payment_status = 'Pending_Payment'`.
* **Decision:** Implement checkout reservation via an atomic PostgreSQL RPC function (`rpc_create_order_with_reservation`) that executes `SELECT * FROM public.serialized_items WHERE item_serial_id = ANY(...) FOR UPDATE NOWAIT`. It verifies `current_status = 'Listed_In_Store'` and checks that no active order holds `reserved_until > now()`, then creates the `Orders` record with `reserved_until = now() + interval '15 minutes'`.
* **Consequences:** Guarantees strict ACID serialization (`NFR-04`) even if two buyers click checkout at the exact same millisecond.

---

## ADR-004: Adapter Pattern for Simulated Payment Gateway & Notification Service

* **Date:** 2026-11-01
* **Status:** Accepted
* **Context:** `FR-12`, `FR-21`, `NFR-01`, and SRS Section 6.2 require simulating Bank Cards, Mobile Wallets, and InstaPay payments (including asynchronous webhook callbacks for `SUCCESS`/`FAILED` outcomes) and simulating SMS/Email notifications in the `Notifications` table, while designing both behind clean interfaces so real gateways (Paymob, Fawry, Kashier, Twilio/SendGrid) can replace them later without altering business logic.
* **Decision:**
  1. Define `PaymentGatewayAdapter` (`initiatePayment`) and provide `SimulatedPaymentGatewayAdapter` that records `Payment_Events` (`source = 'simulator'`) and posts to `/api/webhooks/payment`.
  2. Enforce `NFR-01` by never accepting, logging, or storing card PANs or CVVs—the UI uses a scenario outcome selector (`SUCCESS` vs. `FAILED`) and payment channel selector (`Card`, `Wallet`, `InstaPay`).
  3. Define `NotificationServiceAdapter` (`send`) and provide `SimulatedNotificationAdapter` that inserts into `public.notifications` and surfaces real-time toast/drawer alerts in the UI.
* **Consequences:** 100% compliance with `FR-21`, `NFR-01`, and Section 6.2, plus effortless live demonstration during the graduation presentation.

---

## ADR-005: Bilingual English (LTR) & Arabic (RTL) Architecture

* **Date:** 2026-11-01
* **Status:** Accepted
* **Context:** The platform serves Egyptian individuals, enterprises, partner warehouses, and academic evaluators, requiring full English (`en`, LTR) and Arabic (`ar`, RTL) support.
* **Decision:**
  1. Use `next-intl` with locale routing (`/en/...` and `/ar/...`) and set `<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>`.
  2. Use logical Tailwind CSS directional utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`, `border-s`, `border-e`) across all components so layouts flip automatically between LTR and RTL.
  3. Store bilingual labels in `Categories` (`name`, `name_ar`) and `diagnostic_questions_json` (localized prompts), while keeping database enum/status values (`Submitted`, `Listed_In_Store`, `Decommissioned_Aged`, etc.) in canonical English as specified in the SRS.
  4. Force `dir="ltr"` and `font-mono tabular-nums` on serial numbers (`item_serial_id`), barcodes, tracking codes, and financial figures.
* **Consequences:** Native-quality Arabic RTL and English LTR experience without duplicating page components.

---

## ADR-006: Decoupled DB RBAC Roles (8 Roles with Unified `Customer`) vs. 12 Graduation Demo Toolbar Personas

* **Date:** 2026-11-01
* **Status:** Accepted
* **Context:** In real-world re-commerce platforms, a registered user (`Individual` or `Company`) should be able to both sell used items and purchase refurbished items without maintaining two separate accounts. At the same time, the graduation committee evaluates all 12 user classes listed in SRS Table 2.2.
* **Decision:**
  1. **Database & Auth RBAC (`Users.role` & JWT `app_metadata.role`):** Use 8 clean operational roles:
     * `Customer` (paired with `account_type = 'Individual' | 'Company'`, granting access to both `/seller` and `/store`, with B2B features gated by `account_type = 'Company'`)
     * `Partner_Inspector`
     * `Partner_Refurb_Tech`
     * `Partner_Dismantle_Tech`
     * `Partner_Warehouse_Mgr`
     * `Courier`
     * `Customer_Service`
     * `Admin`
  2. **Graduation Demo Toolbar (UI):** Keep all **12 SRS persona buttons** visible in the toolbar (Individual Seller, Corporate Seller, Individual Buyer, Corporate Buyer, Courier / Partner Drop-off Agent, Transport Team (Bulky), Partner Inspection Officer, Partner Refurbishment Tech, Partner Dismantling Tech, Partner Warehouse Manager, Customer Service Agent, Platform Manager (Admin)). Clicking any persona button switches the active session to a pre-seeded demo user account representing that persona and navigates directly to its portal view.
* **Consequences:** Clean, realistic database RBAC where any `Customer` can buy and sell seamlessly, while preserving 1-click access to all 12 SRS personas for testing and the graduation defense demo.

---

## ADR-008: Next.js 16 Scaffold Choices (npm, no `cacheComponents`, `proxy.ts`)

* **Date:** 2026-11-01
* **Status:** Accepted
* **Context:** `create-next-app@16.4.3` generated a config with `cacheComponents: true` and `partialPrefetching: true`, and Next 16 renamed `middleware.ts` to `proxy.ts`. `cacheComponents` forces dynamic request data (`params`, `cookies()`) behind `<Suspense>`, which adds complexity to `next-intl` locale layouts and Supabase cookie auth that the SRS does not need.
* **Decision:**
  1. Remove `cacheComponents` and `partialPrefetching` from `next.config.ts`; keep the Turbopack Tailwind rule and wrap the config with `createNextIntlPlugin()`.
  2. Use `src/proxy.ts` (not `middleware.ts`) for `next-intl` locale negotiation; Phase 3 RBAC guards will extend it.
  3. Use `npm` (not pnpm) with exact-pinned versions for `next-intl`, `@supabase/*`, `server-only`, `vitest`, and `supabase` CLI (supply-chain guidance).
  4. Add `.env.example` and un-ignore it in `.gitignore`; real keys stay in untracked `.env.local`. `SUPABASE_SECRET_KEY` is only read in `src/lib/supabase/admin.ts` (guarded by `server-only`).
* **Consequences:** Simpler rendering model for the graduation timeline; revisit `cacheComponents` only if storefront performance (`NFR-03`) needs it.

---

## ADR-007: Equal Batch Logistics Cost Split & Harvested Spare Parts Cost Rollup

* **Date:** 2026-11-01
* **Status:** Accepted
* **Context:** `FR-17` defines `Total_Unit_Cost = Final_Purchase_Price + Allocated_Logistics_Cost + Refurbishment_Cost`, requiring explicit rules for how bulky batch transport costs (`FR-08`) and internally harvested spare parts (`FR-14`, `FR-15`) feed into `Total_Unit_Cost`.
* **Decision:**
  1. **Batch Logistics Cost Split (`FR-08` & `FR-17`):** Store `total_batch_logistics_cost` on `Pickup_Manifests` and divide it equally across all items collected in that batch: $\text{Allocated\_Logistics\_Cost} = \frac{\text{Total\_Batch\_Cost}}{\text{Items\_Count\_In\_Batch}}$.
  2. **Harvested Spare Parts Valuation (`FR-14`, `FR-15` & `FR-17`):** Include `estimated_cost` on `Spare_Parts_Inventory`. When a Refurbishment Technician consumes a harvested part for a refurbishment ticket, a database trigger/RPC automatically adds its `estimated_cost` to `Refurbishment_Logs.parts_cost` and updates the target item's `Refurbishment_Cost` and `Total_Unit_Cost`.
* **Consequences:** Accurate, automated unit-cost accounting and profit margin reporting (`FR-17`, `FR-26`).

---

## ADR-009: 35% Markup on Cost for Tier 1 Pricing

* **Date:** 2026-11-05
* **Status:** Accepted
* **Context:** `FR-17` and `FR-19` require a deterministic baseline selling price (`Target_Selling_Price`) for newly listed Tier 1 items (`0_30` days) that covers acquisition, batch/single logistics, and refurbishment costs while ensuring that even when an item enters Tier 2 (`31_60` days, 20% markdown), the platform retains a positive net margin above `Total_Unit_Cost`.
* **Decision:**
  1. Enforce a flat **35% Markup on Cost** policy for Tier 1 (`0_30` days) pricing across both the TypeScript domain pricing engine (`calculateTargetSellingPrice`) and PostgreSQL RPCs/triggers (`rpc_run_inventory_aging`, `fn_consume_harvested_spare_part`):
     $$\text{Target\_Selling\_Price} = \text{round}(\text{Total\_Unit\_Cost} \times 1.35,\; 2)$$
  2. Cascade inventory aging (`FR-19`) deterministically from this baseline:
     * **Tier 1 (`0_30`, Days 0–30):** $\text{Selling\_Price} = \text{Target\_Selling\_Price} = \text{round}(\text{Total\_Unit\_Cost} \times 1.35,\; 2)$ (`+35%` markup on cost).
     * **Tier 2 (`31_60`, Days 31–60):** $\text{Selling\_Price} = \text{round}(\text{Target\_Selling\_Price} \times 0.80,\; 2)$ (`20%` markdown off Tier 1, yielding $1.35 \times 0.80 = 1.08\times$ cost, i.e. `+8%` positive net margin).
     * **Tier 3 (`61_90`, Days 61–90):** $\text{Selling\_Price} = \text{Total\_Unit\_Cost}$ (`0%` margin break-even clearance).
     * **Tier 4 (`91_plus`, Days 91+):** Transition `Listed_In_Store` $\rightarrow$ `Decommissioned_Aged` and open an `aged_out` dismantling ticket.
* **Consequences:** Eliminates ad-hoc or inconsistent markup multipliers across seller/partner flows and guarantees profitable unit economics across both Tier 1 and Tier 2 aging windows.

---

## ADR-010: Three-Domain Commercial Portal Isolation (Customer / Partner / Admin)

* **Date:** 2026-11-21
* **Status:** Accepted
* **Context:** In a real commercial re-commerce platform, public buyers and sellers should never see internal operational links (`Partner Operations` or `Admin & MIS`) in the storefront navbar, landing page, or footer, nor be able to hit internal routes on the customer domain.
* **Decision:**
  1. Isolate internal portals onto dedicated subdomains enforced in `src/proxy.ts` and `src/lib/auth/subdomain.ts`:
     * **Customer Domain (`mustadama.eg` / `localhost:3000`):** Serves Landing (`/`), Storefront (`/store`), Seller Portal (`/seller`), and Customer Auth (`/login`, `/register`). Blocks `/partner` and `/admin` completely and contains zero navigation links to them.
     * **Partner Operations Subdomain (`partner.mustadama.eg` / `partner.localhost:3000`):** Dedicated `/[locale]/partner/login` authorization gate (`partnerLoginAction`) restricted to `Courier`, `Partner_Warehouse_Mgr`, `Partner_Inspector`, `Partner_Refurb_Tech`, `Partner_Dismantle_Tech`, and `Admin`.
     * **Admin & MIS Subdomain (`admin.mustadama.eg` / `admin.localhost:3000`):** Dedicated `/[locale]/admin/login` authorization gate (`adminLoginAction`) restricted to `Admin` and `Customer_Service`.
  2. Support seamless cross-subdomain Role Simulator switching via `/api/auth/demo-switch` so pre-seeded demo personas bind Supabase session cookies cleanly on the target origin.
* **Consequences:** Authentic commercial storefront UX for buyers/sellers, strict operational surface separation, and uninterrupted 12-persona demonstration flow.
