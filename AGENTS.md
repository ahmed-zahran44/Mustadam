# Mustadama ("مُستدام") — Mandatory Agent & Developer Rules

> **ANTI-HALLUCINATION PROTOCOL (ALWAYS ACTIVE):** Every AI agent or developer working in `d:\Mustadam Project` MUST follow this living-documentation protocol on every task without exception.

## 1. Pre-Flight Context Check (Before Writing Any Code or SQL)

Before creating or modifying any code, database migration, or UI component, you **MUST** inspect the relevant sections of:
1. **[PROJECT.md](file:///d:/Mustadam%20Project/PROJECT.md):** For the 8 DB RBAC roles vs. 12 Demo Toolbar personas, MoSCoW requirements (`FR-01`–`FR-26`, `NFR-01`–`NFR-05`), exact business formulas (`FR-04` pricing, `FR-08`/`FR-17` equal batch logistics split, `FR-14`/`FR-15` harvested `estimated_cost` rollup, `FR-12` 7-day / 168h offer Auto-Reject, `FR-19` 30–60–90 aging with `Decommissioned_Aged`, `FR-23` warranty), and the strict item lifecycle transition matrix.
2. **[ARCHITECTURE.md](file:///d:/Mustadam%20Project/ARCHITECTURE.md):** For directory layout, exact 23-table PostgreSQL schema & column names, database triggers/RPCs, Supabase RLS rules, and adapter interfaces.
3. **[DECISIONS.md](file:///d:/Mustadam%20Project/DECISIONS.md):** To respect settled Architecture Decision Records (`ADR-001`–`ADR-010`).
4. **[TASKS.md](file:///d:/Mustadam%20Project/TASKS.md):** To identify the current active task and its acceptance criteria.

## 2. Zero-Hallucination Guardrails

* **Never invent table or column names:** Only use the 23 tables and columns defined in `ARCHITECTURE.md` (derived from SRS Section 5 + approved refinements: `pickup_manifests.total_batch_logistics_cost` and `spare_parts_inventory.estimated_cost`). If a new column or helper table is genuinely needed, document it in `ARCHITECTURE.md` and log the rationale in `DECISIONS.md` first.
* **Decouple DB RBAC Roles from Role Simulator Personas (`FR-01`, `FR-02`, `ADR-006`, `ADR-010`):**
  * In `users.role` and Auth JWT `app_metadata.role`, use ONLY the 8 clean roles: `'Customer'` (paired with `account_type = 'Individual' | 'Company'`), `'Partner_Inspector'`, `'Partner_Refurb_Tech'`, `'Partner_Dismantle_Tech'`, `'Partner_Warehouse_Mgr'`, `'Courier'`, `'Customer_Service'`, and `'Admin'`. Any `Customer` can both buy and sell.
  * In the Role Simulator Toolbar UI (`<select data-testid="persona-select">`), expose all **12 SRS personas**, switching sessions across the 3 isolated commercial domains (`localhost:3000`, `partner.localhost:3000`, `admin.localhost:3000`) via `/api/auth/demo-switch`.
  * **Three-Domain Commercial Isolation (`ADR-010`):** Never expose `/partner` or `/admin` links on the customer navbar, footer, or landing page. Partner Operations lives strictly on `partner.*` (`/partner/login`) and Admin & MIS lives strictly on `admin.*` (`/admin/login`).
* **Never bypass the item lifecycle state machine (`NFR-02`, `FR-12`, `FR-19`):**
  * All changes to `serialized_items.current_status` must obey the transition table in `PROJECT.md Section 5` and record an immutable entry in `item_status_history`.
  * Unsold items after 90 days must transition `Listed_In_Store` $\rightarrow$ **`Decommissioned_Aged`**, and then **`Decommissioned_Aged`** $\rightarrow$ `Scrap_Ready_For_Recycling` once dismantled.
  * Seller offer decision window (`FR-12`) is **7 days (168 hours)** (`offer_expires_at = inspected_at + interval '7 days'`), with automatic rejection (**Auto-Reject** $\rightarrow$ `Return_In_Progress`) upon expiry.
* **Never store real payment credentials (`NFR-01`):** Cash on Delivery (COD) is prohibited, and card PANs/CVVs must never be accepted, logged, or stored. Always route checkout through `PaymentGatewayAdapter` (`SimulatedPaymentGatewayAdapter`) and notifications through `NotificationServiceAdapter` (`SimulatedNotificationAdapter`).
* **Always maintain Bilingual English (LTR) + Arabic (RTL) parity (`ADR-005`):** Every new UI view or message key must be added to both `messages/en.json` and `messages/ar.json` using logical Tailwind directional classes (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`).
* **Supabase Security Checklist:**
  * Enable RLS on every table in `public`.
  * Store and check user roles in `raw_app_meta_data` / `public.users`, never `raw_user_meta_data`.
  * Use `TO authenticated` / `TO anon` and `(select auth.uid())` in RLS policies (never `auth.role()`).

## 3. Post-Task Documentation Sync (Before Declaring Any Task Complete)

No code change or milestone is complete until you update the living documentation in the same turn:
1. **[TASKS.md](file:///d:/Mustadam%20Project/TASKS.md):** Mark completed task checkboxes (`- [x]`) and update requirement statuses in **[PROJECT.md](file:///d:/Mustadam%20Project/PROJECT.md)** when a module finishes.
2. **[CHANGELOG.md](file:///d:/Mustadam%20Project/CHANGELOG.md):** Add a dated entry under `[Unreleased]` or the current milestone summarizing files added/modified, migrations applied, and tests verified.
3. **[ARCHITECTURE.md](file:///d:/Mustadam%20Project/ARCHITECTURE.md) & [DECISIONS.md](file:///d:/Mustadam%20Project/DECISIONS.md):** Update immediately whenever a schema detail, RPC signature, route structure, or architectural decision is added or refined.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
