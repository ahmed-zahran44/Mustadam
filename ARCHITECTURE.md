# Mustadama ("مُستدام") — System Architecture & Database Blueprint

> **Single Source of Truth (Technical & Schema):** This document defines the technical architecture, directory structure, 23-table PostgreSQL schema, database triggers/RPCs, RLS policies, and service adapter contracts for Mustadama. **Never add or rename database tables/columns without updating this file and recording an ADR in [DECISIONS.md](file:///d:/Mustadam%20Project/DECISIONS.md).**

---

## 1. High-Level Architecture

Mustadama runs as a unified **Next.js 16.4.6 (App Router, TypeScript 5, Tailwind CSS 4)** web application connected to **Cloud Supabase (`https://xijhkffkmlaghqowmrmz.supabase.co`)** via the `supabase-mustadam` MCP server:

* **Frontend & UI Layer:** Next.js App Router with bilingual locale routing (`/en/...` LTR, `/ar/...` RTL via `next-intl`), Tailwind CSS 4 (logical directional properties + class-based Light/Dark mode), curated local product photography (`public/products/laptops/` & `public/products/furniture/`), and dedicated Operate-mode portals.
* **Three-Domain Commercial Isolation (`ADR-010`):** Enforced in `src/proxy.ts` and `src/lib/auth/subdomain.ts`:
  * **Customer Domain (`mustadama.eg` / `localhost:3000`):** Public landing (`/`), Storefront (`/store`), Seller Portal (`/seller`), and Customer Auth (`/login`, `/register`). Blocks `/partner` and `/admin` completely and exposes zero internal operational links in `SiteHeader`, `SiteFooter`, or `HomePage`.
  * **Partner Subdomain (`partner.mustadama.eg` / `partner.localhost:3000`, overrideable via `NEXT_PUBLIC_PARTNER_HOST`):** Dedicated `/[locale]/partner/login` gate (`partnerLoginAction`) restricted to `Courier`, `Partner_Warehouse_Mgr`, `Partner_Inspector`, `Partner_Refurb_Tech`, `Partner_Dismantle_Tech`, and `Admin`.
  * **Admin & MIS Subdomain (`admin.mustadama.eg` / `admin.localhost:3000`, overrideable via `NEXT_PUBLIC_ADMIN_HOST`):** Dedicated `/[locale]/admin/login` gate (`adminLoginAction`) restricted to `Admin` and `Customer_Service`.
* **Application & Domain Layer:** Next.js Server Actions (`src/lib/domain/*-actions.ts`, `src/lib/auth/actions.ts`) and Route Handlers (`/api/webhooks/payment`, `/api/cron/aging`, `/api/auth/demo-switch`, `/api/documents/invoice/[id]`, `/api/documents/certificate/[id]`) invoking strongly typed domain engines and PostgreSQL RPC functions.
* **Data & Storage Layer (Cloud Supabase — `xijhkffkmlaghqowmrmz`):**
  * **PostgreSQL:** 23 core relational tables, ACID transactions, row-level locking (`FOR UPDATE NOWAIT`), and immutable state audit triggers across 6 tracked migrations (`supabase/migrations/20261102000001`–`20261105000006`).
  * **Supabase Auth:** JWT authentication storing the 8 clean RBAC roles in `raw_app_meta_data.role` (never `user_metadata`).
  * **Supabase Storage:** Three buckets:
    * `item-photos` (seller condition photos, inspector photos, storefront listing images)
    * `certificates` (generated NIST 800-88 Data Destruction Certificates — `FR-11`)
    * `invoices` (generated Tax Invoices — `FR-22`)
  * **Supabase Dashboard & MCP (`supabase-mustadam`):** Visual database inspection, migration management, security/performance advisors, and TypeScript type generation.

---

## 2. Repository Directory Structure

```text
d:/Mustadam Project/
├── README.md                               # Quick start, 3-domain URLs, demo credentials & script index
├── PROJECT.md                              # Domain rules, roles, formulas, state matrix & MoSCoW table
├── ARCHITECTURE.md                         # Technical blueprint, 23-table schema, RPCs & adapters (this file)
├── DECISIONS.md                            # Architectural Decision Records (ADR-001 – ADR-010)
├── TASKS.md                                # Phased implementation checklist mapped to FR/NFR IDs
├── CHANGELOG.md                            # Chronological record of completed work
├── DEMO_GUIDE.md                           # Acceptance scenarios (TS-01 – TS-12) & 12-persona walkthrough
├── PLAYWRIGHT_TEST_REPORT.md               # Playwright E2E execution & traceability report
├── TEST_READY.md                           # Dual-tier Vitest + Playwright verification guide
├── AGENTS.md                               # Always-on agent instructions for documentation sync
├── .agents/
│   └── rules/
│       └── mustadama-docs-sync.md          # Antigravity workspace rule enforcing doc updates
├── public/
│   └── products/
│       ├── laptops/                        # 16 curated laptop photo sets (32 real product images)
│       └── furniture/                      # 8 curated office & studio furniture photo sets (16 images)
├── supabase/
│   ├── config.toml                         # Supabase CLI configuration
│   ├── migrations/                         # 6 timestamped SQL migrations (23 tables, triggers, RPCs, RLS)
│   └── seed.sql                            # Deterministic demo seed data (12 persona accounts, categories, hubs, items)
├── messages/
│   ├── en.json                             # English translations (LTR)
│   └── ar.json                             # Arabic translations (RTL)
├── .env.example                            # Cloud Supabase & optional subdomain host env template (no secrets)
├── playwright.config.ts                    # Sequential Chromium E2E harness (workers: 1, auto webServer)
├── vitest.config.ts                        # Vitest config (`@` alias -> src)
├── src/
│   ├── proxy.ts                            # Next 16 proxy (ADR-008, ADR-010): next-intl + 3-domain RBAC/subdomain gates
│   ├── i18n/                               # next-intl: routing.ts (locales en/ar, isRtl), request.ts, navigation.ts
│   ├── types/
│   │   ├── database.types.ts               # Generated from Cloud Supabase via MCP (`generate_typescript_types`)
│   │   └── domain.ts                       # Domain enums (ItemLifecycleStatus, UserRole, DemoPersona, ConditionGrade, etc.)
│   ├── lib/
│   │   ├── supabase/                       # @supabase/ssr browser, server, and admin (service_role) clients
│   │   ├── auth/
│   │   │   ├── actions.ts                  # Login, registration, adminLoginAction, partnerLoginAction, demo switcher
│   │   │   ├── rbac.ts                     # 8 DB roles, 12 DEMO_PERSONAS, PORTAL_ALLOWED_ROLES, corporate validation
│   │   │   ├── session.ts                  # Active session & profile loader
│   │   │   └── subdomain.ts                # 3-domain helpers (customer, partner.*, admin.*)
│   │   ├── catalog/
│   │   │   └── laptop-media.ts             # Curated 16 laptops + 8 furniture catalog metadata & photo resolver
│   │   ├── utils/
│   │   │   └── image-compression.ts        # Client-side photo compression utility (NFR-03)
│   │   ├── adapters/
│   │   │   ├── payment-gateway.ts          # PaymentGatewayAdapter interface & SimulatedPaymentGatewayAdapter
│   │   │   └── notification-service.ts     # NotificationServiceAdapter interface & SimulatedNotificationAdapter
│   │   └── domain/
│   │       ├── pricing-engine.ts           # FR-04 diagnostic range, FR-08 batch split, FR-15 parts cost & FR-17/ADR-009 35% markup
│   │       ├── state-machine.ts            # Section 4 state transition validator & role guard (incl. Decommissioned_Aged)
│   │       ├── aging-engine.ts             # FR-19 30-60-90 day markdown, Day 91+ Decommissioned_Aged & FR-12 7-day Auto-Reject
│   │       ├── warranty-engine.ts          # FR-23/FR-24 warranty calculation & eligibility check
│   │       ├── seller-actions.ts           # Seller portal server actions (single, bulk, 7-day offer decision, return fee)
│   │       ├── partner-actions.ts          # Partner WMS server actions (custody, batch split, intake, inspection, refurb, dismantle)
│   │       ├── store-actions.ts            # Storefront server actions (reservation lock, checkout, quotes, delivery, claims)
│   │       └── admin-actions.ts            # Role-guarded Admin & CS actions (categories, quotes, campaigns, claims, returns, bulky gate, aging)
│   ├── components/
│   │   ├── layout/                         # site-header.tsx, site-footer.tsx, language-switcher.tsx, theme-toggle.tsx
│   │   ├── landing/                        # hero-folding-laptop.tsx, interactive-showcase.tsx
│   │   ├── demo/
│   │   │   ├── demo-toolbar-wrapper.tsx    # Server wrapper loading active session & notifications
│   │   │   └── graduation-demo-toolbar.tsx # Consolidated 12-persona dropdown, simulated inbox & aging trigger
│   │   ├── seller/seller-portal-client.tsx # Seller portal UI (Single, Bulk, 7-day Offers)
│   │   ├── store/storefront-client.tsx     # Storefront UI (Catalog, Filters, Quick-View, Cart/Checkout, Quotes, Orders/Warranty)
│   │   ├── partner/partner-portal-client.tsx # Partner Operations UI (5 tabs: Logistics, Intake, Inspection, Refurb, Dismantling)
│   │   └── admin/                          # Modular 6-tab Admin & CS Control Center:
│   │       ├── admin-types.ts              # Shared Admin & MIS TypeScript interfaces
│   │       ├── admin-portal-client.tsx     # Role-aware 6-tab workspace shell (CS defaults to Support/Warranty)
│   │       ├── admin-kpis-tab.tsx          # Financial/Turnaround/Aging/ESG KPIs, charts & aging engine trigger
│   │       ├── admin-categories-tab.tsx    # Create/Edit categories, visual diagnostic builder & live valuation preview
│   │       ├── admin-campaigns-tab.tsx     # Customer segmentation directory, inline segment switcher & campaign log
│   │       ├── admin-quotes-tab.tsx        # Enriched B2B bulk quotes approval & expiration
│   │       ├── admin-support-tab.tsx       # Customer Service warranty claims triage & seller return authorizations
│   │       └── admin-operations-tab.tsx    # Bulky pre-verification gate, serialized inventory economics & immutable audit log
│   └── app/
│       ├── [locale]/
│       │   ├── layout.tsx                  # Locale shell (EN LTR / AR RTL, Inter + Cairo, theme init, domain-aware header/footer)
│       │   ├── page.tsx                    # Commercial Customer Landing Page (Hero, Featured Laptops/Furniture, B2B, Lifecycle, Impact)
│       │   ├── (auth)/                     # Customer Login & Individual/Corporate Registration (FR-01)
│       │   ├── (seller)/seller/            # Portal 1: Single & Bulk acquisition, handover, 7-day offer decision
│       │   ├── (store)/store/              # Portal 2: Serialized catalog, B2B quotes, checkout, orders, warranty
│       │   ├── (partner)/partner/          # Portal 3 (`partner.*`): login/ gate + 5-tab WMS & Technical Hub
│       │   └── (admin)/admin/              # Portal 4 (`admin.*`): login/ gate + 6-tab Admin MIS & Customer Service Center
│       └── api/
│           ├── auth/demo-switch/route.ts   # Cross-subdomain Role Simulator cookie handoff
│           ├── webhooks/payment/route.ts   # Simulated payment gateway webhook receiver (FR-21)
│           ├── cron/aging/route.ts         # 30-60-90 day aging + 7-day offer Auto-Reject endpoint (FR-12, FR-19)
│           └── documents/
│               ├── invoice/[id]/route.ts   # Printable HTML/PDF Tax Invoice (Individual & Corporate Tax ID/CR, FR-22)
│               └── certificate/[id]/route.ts # Printable NIST SP 800-88 Data Destruction Certificate (FR-11)
└── tests/
    ├── unit/                               # 17 Vitest suites (125 tests: domain engines, RBAC, 3-domain isolation, sanitization, RTL responsiveness)
    └── e2e/                                # 6 Playwright E2E suites (42 scenarios across Customer, Partner & Admin domains)
```

---

## 3. PostgreSQL Schema Specification (23 Core Tables — SRS Section 5)

All tables live in the `public` schema, use `uuid` primary keys (`default gen_random_uuid()`) unless noted, have Row-Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`) enabled, and index all foreign key columns (`supabase-postgres-best-practices: schema-foreign-key-indexes`).

### 3.1 Identity, Catalog & Partner Infrastructure

#### 1. `public.users`
Links `1:1` with `auth.users(id)`. Buyers and sellers share the unified `'Customer'` role paired with `account_type` (`'Individual'` | `'Company'`), so any customer can both buy and sell with the same account (`FR-01`, `FR-02`).
* `user_id` (`uuid`, PK, references `auth.users(id) on delete cascade`)
* `role` (`text`, NOT NULL, check `IN ('Customer', 'Partner_Inspector', 'Partner_Refurb_Tech', 'Partner_Dismantle_Tech', 'Partner_Warehouse_Mgr', 'Courier', 'Customer_Service', 'Admin')`)
* `account_type` (`text`, NOT NULL, check `IN ('Individual', 'Company')`)
* `name` (`text`, NOT NULL)
* `email` (`text`, UNIQUE, NOT NULL)
* `phone` (`text`, UNIQUE, NOT NULL)
* `tax_id` (`text`, nullable — required when `account_type = 'Company'`)
* `commercial_reg` (`text`, nullable — required when `account_type = 'Company'`)
* `segment` (`text`, NOT NULL, default `'Individual'`, check `IN ('Individual', 'Startup', 'Enterprise')`)
* `company_address` (`text`, nullable)
* `created_at` (`timestamptz`, NOT NULL, default `now()`)

#### 2. `public.categories`
* `category_id` (`uuid`, PK)
* `name` (`text`, NOT NULL — e.g., `'Electronics'`, `'Furniture'`, `'Laptops'`, `'Smartphones'`, `'Office Chairs'`)
* `name_ar` (`text`, NOT NULL — Arabic display name for RTL UI)
* `parent_id` (`uuid`, nullable, FK $\rightarrow$ `public.categories(category_id)`)
* `base_reference_price` (`numeric(12,2)`, NOT NULL, default `0` — base value for `FR-04` diagnostic calculation)
* `warranty_days` (`integer`, NOT NULL, default `30` — e.g., `90` for Grade A Electronics, `30` for Furniture)
* `diagnostic_questions_json` (`jsonb`, NOT NULL, default `'[]'::jsonb` — dynamic questionnaire schema with deduction rules per `NFR-05`)
* `is_bulky` (`boolean`, NOT NULL, default `false`)
* `requires_data_wipe` (`boolean`, NOT NULL, default `false`)

#### 11. `public.partner_hubs`
* `hub_id` (`uuid`, PK)
* `name` (`text`, NOT NULL)
* `name_ar` (`text`, NOT NULL)
* `city` (`text`, NOT NULL)
* `zone` (`text`, NOT NULL)
* `address` (`text`, NOT NULL)
* `is_dropoff` (`boolean`, NOT NULL, default `true`)
* `is_warehouse` (`boolean`, NOT NULL, default `false`)

#### 12. `public.pickup_manifests`
* `manifest_id` (`uuid`, PK)
* `transport_user_id` (`uuid`, nullable, FK $\rightarrow$ `public.users(user_id)`)
* `zone` (`text`, NOT NULL)
* `scheduled_date` (`date`, NOT NULL)
* `total_batch_logistics_cost` (`numeric(12,2)`, NOT NULL, default `0` — divided equally across all items in the batch per `FR-08` & `FR-17`: `Allocated_Logistics_Cost = Total_Batch_Cost / Items_Count_In_Batch`)
* `status` (`text`, NOT NULL, default `'scheduled'`, check `IN ('scheduled', 'in_progress', 'completed', 'cancelled')`)

---

### 3.2 Sourcing, Logistics & Serialized Item Core

#### 3. `public.acquisition_requests`
* `request_id` (`uuid`, PK)
* `seller_id` (`uuid`, NOT NULL, FK $\rightarrow$ `public.users(user_id)`)
* `submission_date` (`timestamptz`, NOT NULL, default `now()`)
* `handover_method` (`text`, nullable, check `IN ('Courier', 'Partner_Dropoff', 'Batch_Truck')`)
* `dropoff_partner_id` (`uuid`, nullable, FK $\rightarrow$ `public.partner_hubs(hub_id)`)
* `status` (`text`, NOT NULL, default `'submitted'`, check `IN ('submitted', 'awaiting_handover', 'in_transit', 'received', 'completed', 'cancelled')`)
* `request_type` (`text`, NOT NULL, default `'single'`, check `IN ('single', 'bulk')`)
* `manifest_id` (`uuid`, nullable, FK $\rightarrow$ `public.pickup_manifests(manifest_id)`)
* `tracking_code` (`text`, UNIQUE, NOT NULL)
* `pickup_address` (`text`, nullable)
* `pickup_slot` (`text`, nullable)
* `preverification_status` (`text`, NOT NULL, default `'not_required'`, check `IN ('not_required', 'pending', 'approved', 'rejected')`)
* `preverified_by` (`uuid`, nullable, FK $\rightarrow$ `public.users(user_id)`)

#### 4. `public.serialized_items`
* `item_serial_id` (`uuid`, PK — human-readable serial stored in `barcode`, e.g., `MST-2026-00001`)
* `request_id` (`uuid`, NOT NULL, FK $\rightarrow$ `public.acquisition_requests(request_id)`)
* `category_id` (`uuid`, NOT NULL, FK $\rightarrow$ `public.categories(category_id)`)
* `estimated_min_price` (`numeric(12,2)`, NOT NULL)
* `estimated_max_price` (`numeric(12,2)`, NOT NULL)
* `final_purchase_price` (`numeric(12,2)`, nullable)
* `logistics_cost` (`numeric(12,2)`, NOT NULL, default `0` — equals `Allocated_Logistics_Cost`; for batch pickups, `Total_Batch_Cost / Items_Count_In_Batch`)
* `refurbishment_cost` (`numeric(12,2)`, NOT NULL, default `0` — includes `labor_cost + parts_cost` where `parts_cost` includes consumed harvested parts' `estimated_cost`)
* `selling_price` (`numeric(12,2)`, nullable)
* `condition_grade` (`text`, nullable, check `IN ('A', 'B', 'C')`)
* `current_status` (`text`, NOT NULL, default `'Submitted'`, check `IN ('Submitted', 'Awaiting_Handover', 'Received_At_Dropoff_Hub', 'In_Transit_To_Warehouse', 'Received_Pending_Inspection', 'Awaiting_Seller_Decision', 'Return_In_Progress', 'Listed_In_Store', 'Under_Refurbishment', 'Pending_Dismantling', 'Sold', 'Decommissioned_Aged', 'Scrap_Ready_For_Recycling', 'Recycled_Closed')`)
* `data_wiped_bool` (`boolean`, NOT NULL, default `false`)
* `listed_date` (`timestamptz`, nullable)
* `aging_tier` (`text`, nullable, check `IN ('0_30', '31_60', '61_90', '91_plus')`)
* `title` (`text`, NOT NULL)
* `title_ar` (`text`, nullable)
* `diagnostic_answers` (`jsonb`, NOT NULL, default `'{}'::jsonb`)
* `barcode` (`text`, UNIQUE, nullable — generated on Warehouse Intake per `FR-09`)
* `weight_kg` (`numeric(8,2)`, nullable)
* `target_selling_price` (`numeric(12,2)`, nullable)
* `total_unit_cost` (`numeric(12,2)`, nullable — calculated per `FR-17`: `final_purchase_price + logistics_cost + refurbishment_cost`)
* `seller_decision` (`text`, nullable, check `IN ('pending', 'accepted', 'rejected', 'auto_rejected')`)
* `offer_expires_at` (`timestamptz`, nullable — set to `inspected_at + interval '7 days'` / 168 hours per `FR-12`)
* `created_at` (`timestamptz`, NOT NULL, default `now()`)

#### 13. `public.item_photos`
* `photo_id` (`uuid`, PK)
* `item_serial_id` (`uuid`, NOT NULL, FK $\rightarrow$ `public.serialized_items(item_serial_id) on delete cascade`)
* `url` (`text`, NOT NULL)
* `photo_type` (`text`, NOT NULL, check `IN ('seller', 'inspection', 'listing')`)
* `sort_order` (`integer`, NOT NULL, default `0`)

#### 14. `public.item_status_history` (Immutable Audit Log — `NFR-02`)
* `history_id` (`uuid`, PK)
* `item_serial_id` (`uuid`, NOT NULL, FK $\rightarrow$ `public.serialized_items(item_serial_id) on delete restrict`)
* `changed_by` (`uuid`, nullable, FK $\rightarrow$ `public.users(user_id)`)
* `from_status` (`text`, nullable)
* `to_status` (`text`, NOT NULL)
* `note` (`text`, nullable)
* `changed_at` (`timestamptz`, NOT NULL, default `now()`)

---

### 3.3 Inspection, Payouts, Returns & Circular Engine

#### 5. `public.inspection_records`
* `inspection_id` (`uuid`, PK)
* `item_serial_id` (`uuid`, NOT NULL, FK $\rightarrow$ `public.serialized_items(item_serial_id)`)
* `inspector_id` (`uuid`, NOT NULL, FK $\rightarrow$ `public.users(user_id)`)
* `technical_classification` (`text`, NOT NULL, check `IN ('Ready_For_Sale', 'Repairable', 'Irreparable')`)
* `condition_notes` (`text`, NOT NULL)
* `data_wipe_certificate_url` (`text`, nullable)
* `inspected_at` (`timestamptz`, NOT NULL, default `now()`)

#### 15. `public.return_tasks`
* `return_id` (`uuid`, PK)
* `item_serial_id` (`uuid`, NOT NULL, FK $\rightarrow$ `public.serialized_items(item_serial_id)`)
* `fee_amount` (`numeric(12,2)`, NOT NULL)
* `fee_status` (`text`, NOT NULL, default `'pending'`, check `IN ('pending', 'paid')`)
* `fee_payment_ref` (`text`, nullable)
* `status` (`text`, NOT NULL, default `'awaiting_fee_payment'`, check `IN ('awaiting_fee_payment', 'ready_for_dispatch', 'dispatched', 'returned_to_seller')`)
* `created_at` (`timestamptz`, NOT NULL, default `now()`)

#### 16. `public.payouts`
* `payout_id` (`uuid`, PK)
* `item_serial_id` (`uuid`, NOT NULL, FK $\rightarrow$ `public.serialized_items(item_serial_id)`)
* `seller_id` (`uuid`, NOT NULL, FK $\rightarrow$ `public.users(user_id)`)
* `amount` (`numeric(12,2)`, NOT NULL)
* `status` (`text`, NOT NULL, default `'paid'`, check `IN ('pending', 'paid')`)
* `payout_ref` (`text`, NOT NULL)
* `created_at` (`timestamptz`, NOT NULL, default `now()`)

#### 6. `public.refurbishment_logs`
* `refurb_id` (`uuid`, PK)
* `item_serial_id` (`uuid`, NOT NULL, FK $\rightarrow$ `public.serialized_items(item_serial_id)`)
* `technician_id` (`uuid`, nullable, FK $\rightarrow$ `public.users(user_id)`)
* `work_description` (`text`, nullable)
* `labor_cost` (`numeric(12,2)`, NOT NULL, default `0`)
* `parts_cost` (`numeric(12,2)`, NOT NULL, default `0` — automatically increments by `spare_parts_inventory.estimated_cost` whenever a harvested part is consumed in this ticket per `FR-15`)
* `closed_at` (`timestamptz`, nullable)
* `status` (`text`, NOT NULL, default `'open'`, check `IN ('open', 'closed')`)
* `final_grade` (`text`, nullable, check `IN ('A', 'B', 'C')`)
* `opened_at` (`timestamptz`, NOT NULL, default `now()`)

#### 17. `public.dismantling_tickets`
* `dismantle_id` (`uuid`, PK)
* `item_serial_id` (`uuid`, NOT NULL, FK $\rightarrow$ `public.serialized_items(item_serial_id)`)
* `technician_id` (`uuid`, nullable, FK $\rightarrow$ `public.users(user_id)`)
* `trigger` (`text`, NOT NULL, check `IN ('irreparable', 'aged_out')`)
* `status` (`text`, NOT NULL, default `'open'`, check `IN ('open', 'closed')`)
* `created_at` (`timestamptz`, NOT NULL, default `now()`)
* `closed_at` (`timestamptz`, nullable)

#### 7. `public.spare_parts_inventory`
* `part_id` (`uuid`, PK)
* `source_item_serial_id` (`uuid`, NOT NULL, FK $\rightarrow$ `public.serialized_items(item_serial_id)`)
* `part_name` (`text`, NOT NULL)
* `category_id` (`uuid`, NOT NULL, FK $\rightarrow$ `public.categories(category_id)`)
* `status` (`text`, NOT NULL, default `'Available'`, check `IN ('Available', 'Consumed')`)
* `consumed_in_refurb_id` (`uuid`, nullable, FK $\rightarrow$ `public.refurbishment_logs(refurb_id)`)
* `estimated_cost` (`numeric(12,2)`, NOT NULL, default `0` — valuation of harvested part per `FR-14`/`FR-15`; automatically added to target item's `parts_cost` and `Refurbishment_Cost` upon consumption)
* `internal_cost` (`numeric(12,2)`, NOT NULL, default `0` — kept as alias/sync with `estimated_cost` for SRS Section 5.7 compatibility)

#### 8. `public.recycling_batches`
* `batch_id` (`uuid`, PK)
* `recycler_entity_name` (`text`, NOT NULL)
* `material_type` (`text`, NOT NULL, check `IN ('E-waste', 'Metal', 'Wood', 'Plastic', 'Mixed')`)
* `total_weight_kg` (`numeric(10,2)`, NOT NULL)
* `revenue_amount` (`numeric(12,2)`, NOT NULL)
* `handover_date` (`date`, NOT NULL, default `current_date`)
* `recorded_by` (`uuid`, NOT NULL, FK $\rightarrow$ `public.users(user_id)`)

#### 18. `public.scrap_entries`
* `scrap_id` (`uuid`, PK)
* `dismantle_id` (`uuid`, NOT NULL, FK $\rightarrow$ `public.dismantling_tickets(dismantle_id)`)
* `batch_id` (`uuid`, nullable, FK $\rightarrow$ `public.recycling_batches(batch_id)`)
* `material_type` (`text`, NOT NULL, check `IN ('E-waste', 'Metal', 'Wood', 'Plastic')`)
* `weight_kg` (`numeric(8,2)`, NOT NULL)

---

### 3.4 Storefront, Quotes, Checkout, Warranty & Notifications

#### 20. `public.quote_requests`
* `quote_id` (`uuid`, PK)
* `buyer_id` (`uuid`, NOT NULL, FK $\rightarrow$ `public.users(user_id)`)
* `status` (`text`, NOT NULL, default `'requested'`, check `IN ('requested', 'quoted', 'accepted', 'expired')`)
* `discount_pct` (`numeric(5,2)`, NOT NULL, default `0`)
* `valid_until` (`timestamptz`, nullable)
* `created_at` (`timestamptz`, NOT NULL, default `now()`)

#### 21. `public.quote_items`
* `quote_item_id` (`uuid`, PK)
* `quote_id` (`uuid`, NOT NULL, FK $\rightarrow$ `public.quote_requests(quote_id) on delete cascade`)
* `item_serial_id` (`uuid`, NOT NULL, FK $\rightarrow$ `public.serialized_items(item_serial_id)`)

#### 9. `public.orders`
* `order_id` (`uuid`, PK)
* `buyer_id` (`uuid`, NOT NULL, FK $\rightarrow$ `public.users(user_id)`)
* `total_amount` (`numeric(12,2)`, NOT NULL)
* `payment_method` (`text`, NOT NULL, check `IN ('Card', 'Wallet', 'InstaPay')`)
* `payment_transaction_ref` (`text`, nullable)
* `payment_status` (`text`, NOT NULL, default `'Pending_Payment'`, check `IN ('Pending_Payment', 'SUCCESS', 'FAILED', 'Expired')`)
* `invoice_url` (`text`, nullable)
* `created_at` (`timestamptz`, NOT NULL, default `now()`)
* `quote_id` (`uuid`, nullable, FK $\rightarrow$ `public.quote_requests(quote_id)`)
* `reserved_until` (`timestamptz`, NOT NULL)
* `delivery_address` (`text`, NOT NULL)
* `paid_at` (`timestamptz`, nullable)

#### 10. `public.order_items_warranty`
* `order_item_id` (`uuid`, PK)
* `order_id` (`uuid`, NOT NULL, FK $\rightarrow$ `public.orders(order_id) on delete cascade`)
* `item_serial_id` (`uuid`, NOT NULL, FK $\rightarrow$ `public.serialized_items(item_serial_id)`)
* `sold_price` (`numeric(12,2)`, NOT NULL)
* `delivery_date` (`date`, nullable)
* `warranty_end_date` (`date`, nullable)

#### 19. `public.payment_events`
* `event_id` (`uuid`, PK)
* `order_id` (`uuid`, NOT NULL, FK $\rightarrow$ `public.orders(order_id) on delete cascade`)
* `outcome` (`text`, NOT NULL, check `IN ('SUCCESS', 'FAILED')`)
* `source` (`text`, NOT NULL, default `'simulator'`)
* `payload` (`jsonb`, NOT NULL, default `'{}'::jsonb` — strictly PCI-safe per `NFR-01`: never contains PAN/CVV)
* `created_at` (`timestamptz`, NOT NULL, default `now()`)

#### 22. `public.warranty_claims`
* `claim_id` (`uuid`, PK)
* `order_item_id` (`uuid`, NOT NULL, FK $\rightarrow$ `public.order_items_warranty(order_item_id)`)
* `buyer_id` (`uuid`, NOT NULL, FK $\rightarrow$ `public.users(user_id)`)
* `assigned_to` (`uuid`, nullable, FK $\rightarrow$ `public.users(user_id)`)
* `description` (`text`, NOT NULL)
* `status` (`text`, NOT NULL, default `'open'`, check `IN ('open', 'in_review', 'resolved', 'rejected')`)
* `resolution_note` (`text`, nullable)
* `created_at` (`timestamptz`, NOT NULL, default `now()`)

#### 23. `public.notifications`
* `notification_id` (`uuid`, PK)
* `recipient_id` (`uuid`, NOT NULL, FK $\rightarrow$ `public.users(user_id) on delete cascade`)
* `channel` (`text`, NOT NULL, check `IN ('sms', 'email')`)
* `type` (`text`, NOT NULL, check `IN ('otp', 'status', 'price_offer', 'campaign', 'warranty')`)
* `message` (`text`, NOT NULL)
* `status` (`text`, NOT NULL, default `'simulated'`)
* `created_at` (`timestamptz`, NOT NULL, default `now()`)

---

## 4. Database Triggers, Functions & Concurrency Control

1. **`fn_enforce_and_audit_item_status()` (`BEFORE UPDATE` & `AFTER INSERT OR UPDATE` on `serialized_items`):**
   * Validates `(OLD.current_status, NEW.current_status)` against the allowed transition pairs in [PROJECT.md Section 5](file:///d:/Mustadam%20Project/PROJECT.md), including:
     * `Listed_In_Store` $\rightarrow$ `Decommissioned_Aged` (after 90 days unsold per `FR-19`)
     * `Decommissioned_Aged` $\rightarrow$ `Scrap_Ready_For_Recycling` (once dismantled per `FR-14`/`FR-16`/`FR-19`)
     * `Pending_Dismantling` $\rightarrow$ `Scrap_Ready_For_Recycling`
   * Enforces `FR-11`: If `OLD.current_status = 'Received_Pending_Inspection'` and `NEW.current_status = 'Awaiting_Seller_Decision'`, queries `categories.requires_data_wipe`; if `true` and `NEW.data_wiped_bool = false`, raises `P0001: Mandatory NIST 800-88 Data Wipe certification required before leaving inspection`. Also sets `NEW.offer_expires_at := COALESCE(NEW.offer_expires_at, now() + interval '7 days')` (`FR-12`).
   * Enforces `FR-13`: If `OLD.current_status = 'Under_Refurbishment'` and `NEW.current_status = 'Listed_In_Store'`, verifies `NEW.condition_grade IN ('A','B','C')` and no open `refurbishment_logs` exist.
   * Appends a row to `public.item_status_history` (`NFR-02`). Explicitly revokes `UPDATE` and `DELETE` privileges on `public.item_status_history` from all roles to guarantee immutability.
2. **`fn_consume_harvested_spare_part()` (`AFTER UPDATE` on `spare_parts_inventory`):**
   * When `OLD.status = 'Available'` and `NEW.status = 'Consumed'` with a valid `NEW.consumed_in_refurb_id`, automatically adds `NEW.estimated_cost` to `refurbishment_logs.parts_cost` and updates `serialized_items.refurbishment_cost`, `serialized_items.total_unit_cost`, and `serialized_items.target_selling_price = round(total_unit_cost * 1.35, 2)` (`FR-14`, `FR-15`, `FR-17`, `ADR-009`).
3. **`rpc_allocate_batch_logistics_cost(p_manifest_id uuid, p_total_batch_cost numeric)` (`FR-08`, `FR-17`):**
   * Counts all `serialized_items` linked via `acquisition_requests.manifest_id = p_manifest_id`, computes `v_allocated := round(p_total_batch_cost / v_count, 2)`, updates `pickup_manifests.total_batch_logistics_cost`, and sets `serialized_items.logistics_cost = v_allocated` on every item in that batch.
4. **`rpc_create_order_with_reservation(p_buyer_id, p_item_serial_ids, p_payment_method, p_delivery_address, p_quote_id)` (`NFR-04`, `FR-21`):**
   * Locks target `serialized_items` rows using `SELECT ... FOR UPDATE NOWAIT`.
   * Checks that each item has `current_status = 'Listed_In_Store'` and no existing `orders` + `order_items_warranty` join with `payment_status = 'Pending_Payment'` and `reserved_until > now()`.
   * Inserts `orders` (`reserved_until = now() + interval '15 minutes'`) and `order_items_warranty` rows atomically.
5. **`rpc_process_payment_webhook(p_order_id, p_outcome, p_transaction_ref, p_payload)` (`FR-21`, `FR-22`):**
   * Inserts into `payment_events`.
   * If `p_outcome = 'SUCCESS'`, updates `orders.payment_status = 'SUCCESS'`, `paid_at = now()`, and transitions all linked `serialized_items.current_status` to `'Sold'`.
   * If `p_outcome = 'FAILED'`, updates `orders.payment_status = 'FAILED'` and sets `reserved_until = now()` so the serialized items are immediately released for other buyers.
6. **`rpc_run_inventory_aging(p_reference_time timestamptz default now())` (`FR-12`, `FR-19`, `ADR-009`):**
   * **90-Day Inventory Aging (`FR-19`, `ADR-009`):** Computes `days_listed = EXTRACT(DAY FROM (p_reference_time - listed_date))` and `v_target_price = round(total_unit_cost * 1.35, 2)` for all `Listed_In_Store` items and applies:
     * Day 0–30: `target_selling_price = v_target_price`, `selling_price = v_target_price`, `aging_tier = '0_30'` (35% markup on cost)
     * Day 31–60: `target_selling_price = v_target_price`, `selling_price = round(v_target_price * 0.80, 2)`, `aging_tier = '31_60'` (20% markdown off Tier 1)
     * Day 61–90: `target_selling_price = v_target_price`, `selling_price = total_unit_cost`, `aging_tier = '61_90'` (break-even clearance)
     * Day 91+: `aging_tier = '91_plus'`, transitions `current_status` from `'Listed_In_Store'` to **`'Decommissioned_Aged'`**, and inserts an open `dismantling_tickets` row (`trigger = 'aged_out'`).
   * **7-Day (168h) Offer Expiry Auto-Reject (`FR-12`):** Finds all items with `current_status = 'Awaiting_Seller_Decision'` and `offer_expires_at < p_reference_time`, sets `seller_decision = 'auto_rejected'`, transitions `current_status` to `'Return_In_Progress'`, creates a `return_tasks` record, and logs a simulated notification to the seller.

---

## 5. Supabase Security & RLS Standards

Following the Supabase security rules:
1. **RLS Enabled Everywhere:** Every table in `public` has RLS enabled.
2. **8 Clean Role Claims in `app_metadata`:** Role checks in RLS use `(select auth.jwt() -> 'app_metadata' ->> 'role')` or `public.current_user_role()` reading `public.users.role` for `(select auth.uid())` — **never** `raw_user_meta_data`.
   * `Customer` role accesses both `/seller` (rows where `seller_id = (select auth.uid())`) and `/store` (public catalog + orders/quotes/warranties where `buyer_id = (select auth.uid())`).
   * Operational & admin roles (`Courier`, `Partner_Warehouse_Mgr`, `Partner_Inspector`, `Partner_Refurb_Tech`, `Partner_Dismantle_Tech`, `Customer_Service`, `Admin`) are granted scoped table permissions matching their portal responsibilities.
3. **Policy Conventions:**
   * Always specify target Postgres role with `TO authenticated` or `TO anon` (never deprecated `auth.role()`).
   * Wrap `auth.uid()` in `(select auth.uid())` for Postgres query planner initPlan caching.
   * Include both `USING` and `WITH CHECK` on all `UPDATE` policies.
   * Any reporting views created for `FR-26` MIS KPIs use `CREATE VIEW ... WITH (security_invoker = true)`.

---

## 6. External Service Adapter Contracts (SRS Section 6.2)

### 6.1 `PaymentGatewayAdapter` (`src/lib/adapters/payment-gateway.ts`)
```typescript
export type PaymentChannel = 'Card' | 'Wallet' | 'InstaPay';
export type PaymentOutcome = 'SUCCESS' | 'FAILED';

export interface InitiatePaymentInput {
  orderId: string;
  amountEgp: number;
  channel: PaymentChannel;
  simulatedOutcome: PaymentOutcome; // Used by simulator; ignored by real gateways
}

export interface PaymentGatewayAdapter {
  initiatePayment(input: InitiatePaymentInput): Promise<{
    transactionRef: string;
    webhookDispatched: boolean;
  }>;
}
```

### 6.2 `NotificationServiceAdapter` (`src/lib/adapters/notification-service.ts`)
```typescript
export type NotificationChannel = 'sms' | 'email';
export type NotificationType = 'otp' | 'status' | 'price_offer' | 'campaign' | 'warranty';

export interface SendNotificationInput {
  recipientId: string;
  channel: NotificationChannel;
  type: NotificationType;
  message: string;
}

export interface NotificationServiceAdapter {
  send(input: SendNotificationInput): Promise<{ notificationId: string }>;
}
```
