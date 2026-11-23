# Mustadama ("مُستدام") — Full Project Review, Test Scenarios & 12-Persona Live Demo Script

> **Document Purpose:** Complete **Live Demo & Acceptance Playbook** for **Mustadama ("مُستدام")** — aligned 100% with the implemented commercial 3-domain architecture (`ADR-010`), sanitized production UI, and Cloud Supabase backend.

---

## Part 1: Architecture & Database Verification Summary

### 1.1 Commercial 3-Domain Isolation & Stack
* **Stack:** Next.js `16.4.6` (App Router, Turbopack, TypeScript 5, Tailwind CSS 4, `next-intl` bilingual `EN` LTR / `AR` RTL, Light/Dark theme toggle) connected to **Cloud Supabase** (`https://xijhkffkmlaghqowmrmz.supabase.co`).
* **Three Commercial Domains (`ADR-010`):**
  1. **Customer Website (`http://localhost:3000`):** Public Landing (`/`), Certified Storefront (`/store` with 16 curated laptops + 8 refurbished furniture items), Seller Portal (`/seller`), and Customer Auth (`/login`, `/register`). Blocks `/partner` and `/admin` completely and contains zero internal operational links.
  2. **Partner Operations Subdomain (`http://partner.localhost:3000`):** Dedicated `/[locale]/partner/login` gate (`partnerLoginAction`) restricted to `Courier`, `Partner_Warehouse_Mgr`, `Partner_Inspector`, `Partner_Refurb_Tech`, `Partner_Dismantle_Tech`, and `Admin`.
  3. **Admin & MIS Subdomain (`http://admin.localhost:3000`):** Dedicated `/[locale]/admin/login` gate (`adminLoginAction`) restricted to `Admin` and `Customer_Service`.
* **23 Relational Tables (`20261102000001_core_schema.sql`) + 6 Migrations (`0001`–`0006`):**
  * `users` (8 DB RBAC roles + `account_type = 'Individual' | 'Company'`), `categories`, `partner_hubs`, `pickup_manifests` (`total_batch_logistics_cost`), `acquisition_requests`, `serialized_items` (`Decommissioned_Aged`, 7-day `offer_expires_at`), `item_photos`, `item_status_history` (immutable — `REVOKE UPDATE, DELETE`), `inspection_records`, `return_tasks`, `payouts`, `refurbishment_logs`, `dismantling_tickets`, `spare_parts_inventory` (`estimated_cost`), `recycling_batches`, `scrap_entries`, `quote_requests`, `quote_items`, `orders` (15-min `reserved_until`), `order_items_warranty`, `payment_events` (PCI-safe, zero PAN/CVV), `warranty_claims`, and `notifications`.
* **Database Triggers & Atomic RPCs:**
  * `fn_enforce_and_audit_item_status()` & `fn_log_initial_item_status()` — strict state transition guard, NIST 800-88 wipe gate (`FR-11`), refurbishment closure gate (`FR-13`), 7-day offer window (`FR-12`), and immutable audit trail (`NFR-02`).
  * `fn_consume_harvested_spare_part()` — auto-rolls consumed harvested part `estimated_cost` into `parts_cost`, `refurbishment_cost`, `total_unit_cost`, and Tier 1 `target_selling_price = round(total_unit_cost * 1.35, 2)` (`ADR-009`).
  * `rpc_allocate_batch_logistics_cost(p_manifest_id, p_total_batch_cost)` — equal bulky batch cost split (`Total_Batch_Cost / Items_Count_In_Batch`).
  * `rpc_create_order_with_reservation(...)` — `SELECT ... FOR UPDATE NOWAIT` 15-minute checkout reservation lock (`NFR-04`, `FR-21`).
  * `rpc_process_payment_webhook(...)` — marks order `SUCCESS` $\rightarrow$ `Sold`, or `FAILED` $\rightarrow$ immediate lock release.
  * `rpc_run_inventory_aging(...)` — 30–60–90+ day pricing cascade (`Decommissioned_Aged` at Day 91+) + 7-day offer Auto-Reject.

---

## Part 2: End-to-End Acceptance Test Scenarios Matrix (`TS-01` – `TS-12`)

| Scenario ID | SRS Requirement(s) | Persona / Role | Action | Expected Outcome | Automated Coverage |
|---|---|---|---|---|---|
| **`TS-01`** | `FR-01`, `FR-02`, `ADR-006`, `ADR-010` | All 12 Personas (8 DB Roles) | Switch personas via Role Simulator dropdown or sign in via `/login`, `partner.*/partner/login`, `admin.*/admin/login` | Enforces 3-domain subdomain isolation; unified `Customer` accesses `/seller` and `/store`; B2B gated by `account_type = 'Company'`. | `tests/unit/rbac.test.ts`, `tests/unit/admin-subdomain-gate.test.ts`, `tests/e2e/02-auth-personas.spec.ts` |
| **`TS-02`** | `FR-03`, `FR-04`, `NFR-03` | Individual Seller (`Customer`) | Select category, answer dynamic JSON diagnostic questions, attach 3–5 compressed photos, submit | Computes `Estimated_Min_Price` – `Estimated_Max_Price` with legal disclaimer; creates `acquisition_requests` + `serialized_items` (`Awaiting_Handover`). | `tests/unit/pricing.test.ts`, `tests/e2e/04-seller-portal.spec.ts` |
| **`TS-03`** | `FR-05`, `FR-08` | Corporate Seller (`Customer` / `Company`) | Submit multi-line CSV Corporate Bulk Liquidation manifest | Creates bulk `acquisition_requests` (`Batch_Truck`) and multiple `serialized_items`. | `tests/unit/graduation-demo-scenarios.test.ts`, `tests/e2e/04-seller-portal.spec.ts` |
| **`TS-04`** | `FR-06`, `FR-07` | Courier / Drop-off Hub (`Courier`) | Confirm Drop-off QR scan or Courier pickup on `partner.localhost:3000` | Transitions `Awaiting_Handover` $\rightarrow$ `Received_At_Dropoff_Hub` $\rightarrow$ `In_Transit_To_Warehouse` and logs `item_status_history`. | `tests/unit/domain-engines.test.ts`, `tests/e2e/05-partner-portal.spec.ts` |
| **`TS-05`** | `FR-08`, `FR-17` | Bulky Transport Team (`Courier`) | Enter batch transport cost & click **Allocate Equal Batch Cost** | Executes `rpc_allocate_batch_logistics_cost`; divides cost equally across all items in the manifest. | `tests/unit/pricing.test.ts`, `tests/e2e/05-partner-portal.spec.ts` |
| **`TS-06`** | `FR-09` | Warehouse Manager (`Partner_Warehouse_Mgr`) | Click **Confirm Warehouse Receipt & Generate Barcode** | Generates `MST-2026-NNNNN` barcode and transitions to `Received_Pending_Inspection`. | `tests/e2e/05-partner-portal.spec.ts` |
| **`TS-07`** | `FR-10`, `FR-11`, `FR-12` | Partner Inspector (`Partner_Inspector`) | Test unchecked NIST wipe (blocked by DB trigger), then check wipe, classify item, set final purchase price | Issues `/api/documents/certificate/[id]`, sets 7-day `offer_expires_at`, transitions to `Awaiting_Seller_Decision`, and notifies seller. | `tests/unit/domain-engines.test.ts`, `tests/e2e/05-partner-portal.spec.ts` |
| **`TS-08`** | `FR-12` | Individual / Corporate Seller | Accept offer within 7 days OR Reject / Auto-Reject | **Accept:** Logs `payouts` and routes to `Listed_In_Store` / `Under_Refurbishment` / `Pending_Dismantling`. **Reject / Auto-Reject:** Transitions to `Return_In_Progress` with return fee task. | `tests/unit/graduation-demo-scenarios.test.ts`, `tests/e2e/04-seller-portal.spec.ts` |
| **`TS-09`** | `FR-14`, `FR-16`, `FR-19` | Dismantling Tech (`Partner_Dismantle_Tech`) | Harvest spare part (`estimated_cost`) + log scrap weight (`kg`) by material | Inserts `spare_parts_inventory` (`Available`), logs `scrap_entries`, transitions to `Scrap_Ready_For_Recycling`. | `tests/unit/pricing.test.ts`, `tests/e2e/05-partner-portal.spec.ts` |
| **`TS-10`** | `FR-13`, `FR-15`, `FR-17`, `ADR-009` | Refurbishment Tech (`Partner_Refurb_Tech`) | Consume harvested part, enter labor cost, assign `Grade A/B/C`, close ticket | Trigger rolls harvested `estimated_cost` into `parts_cost` and `total_unit_cost`; sets Tier 1 price at `round(total_unit_cost * 1.35, 2)` and lists in store. | `tests/unit/pricing.test.ts`, `tests/e2e/05-partner-portal.spec.ts` |
| **`TS-11`** | `FR-18`, `FR-19`, `FR-20`, `FR-21`, `FR-22`, `NFR-01`, `NFR-04` | Individual & Corporate Buyer | Search/filter laptops & furniture, lock 15-min checkout, test `FAILED` release then `SUCCESS` webhook, download Tax Invoice | Prevents double-buying; `SUCCESS` transitions to `Sold` and renders `/api/documents/invoice/[id]` with Corporate `Tax ID` & `CR`. | `tests/unit/aging.test.ts`, `tests/e2e/03-storefront.spec.ts` |
| **`TS-12`** | `FR-23`, `FR-24`, `FR-25`, `FR-26`, `NFR-05` | Customer Service & Platform Admin (`admin.*`) | Resolve warranty claims & return authorizations; edit/add categories via visual schema builder; segment customers & send campaigns; inspect MIS KPIs, turnaround time, bulky gate & audit trail | Full 6-tab Admin & CS Control Center verified live against Cloud Supabase. | `tests/unit/admin-portal.test.ts`, `tests/e2e/06-admin-portal.spec.ts` |

---

## Part 3: Step-by-Step Live Walkthrough Across All 12 Personas

### Setup (1 Minute)
1. Start the dev server: `npm run dev`
2. Open **`http://localhost:3000/en`** in Chrome/Edge/Firefox.
3. Show the **Commercial Customer Website** first:
   * Notice the clean commercial navbar (**Store**, **Seller Portal**, **Sign In**, **Theme Toggle**, **EN/AR Language Switcher**) — zero internal Partner or Admin links are exposed to customers (`ADR-010`).
   * Toggle **Dark/Light Mode** and **English (LTR) / Arabic (RTL)** to show full directional parity (`ADR-005`).
   * Show the **Quick Persona Switcher** dropdown (`Role Simulator` bar at the top) with all 12 personas grouped under *Customers*, *Partner Operations*, and *Platform Administration*, plus the live **Simulated Notifications** inbox and **Inventory Aging & Expiry Check** button.

---

### Act I: Customer Sourcing & Smart Valuation (`http://localhost:3000/en/seller`)
1. **Individual Seller:** Pick **Individual Seller** from the Quick Persona Switcher $\rightarrow$ lands on `/en/seller`.
   * Select a category, toggle diagnostic questions to see the live `Min – Max EGP` valuation update with the 7-day inspection disclaimer, verify 3+ compressed condition photos, select **Door-to-Door Courier** or **Partner Drop-off Hub**, and submit to generate a tracking code (`MST-TRK-XXXXXX`).
2. **Corporate Seller (B2B):** Pick **Corporate Seller (B2B)** $\rightarrow$ open **Corporate Bulk Liquidation** tab (`Account Type: Company`) $\rightarrow$ submit multi-line manifest (`MST-BLK-XXXXXX`).

---

### Act II: Partner Operations Subdomain (`http://partner.localhost:3000`)
*(You can either pick a Partner persona from the dropdown — which automatically hands off cookies via `/api/auth/demo-switch` to `partner.localhost:3000` — or open `http://partner.localhost:3000/en/partner/login` directly and sign in with `inspector@mustadama.eg` / `Mustadama2026!`.)*

1. **Courier / Drop-off Hub:** Open Tab **1. Logistics & Shipped Batches** $\rightarrow$ confirm **Drop-off Hub Scan** (`Received_At_Dropoff_Hub`) and **Dispatch to Warehouse** (`In_Transit_To_Warehouse`).
2. **Bulky Transport Team:** On Tab 1, enter `Total Batch Cost (EGP)` and click **Allocate Equal Batch Cost** (`rpc_allocate_batch_logistics_cost`).
3. **Warehouse Manager:** Open Tab **2. Warehouse Intake** $\rightarrow$ click **Confirm Warehouse Receipt & Generate Barcode** (`MST-2026-XXXXX` $\rightarrow$ `Received_Pending_Inspection`).
4. **Partner Inspector:** Open Tab **3. Technical Inspection & Data Sanitization**:
   * Uncheck NIST 800-88 wipe and submit to show the PostgreSQL trigger blocking exit from inspection.
   * Check NIST 800-88 wipe, choose classification (`Ready_For_Sale`, `Repairable`, or `Irreparable`), set `Final Purchase Price`, and submit (sets 7-day `offer_expires_at` and notifies seller).
5. **Seller Offer Acceptance & NIST Certificate:** Switch back to the item's Seller (`localhost:3000/en/seller`) $\rightarrow$ download the printable **NIST 800-88 Data Destruction Certificate** (`/api/documents/certificate/[id]`) and click **Accept Offer** (or **Reject** to demonstrate the return fee lock).
6. **Dismantling Tech & Warehouse Recycler Handover:** On `partner.localhost:3000`, open Tab **5. Dismantling & Scrap Recycling** $\rightarrow$ harvest a spare part with `estimated_cost` + log scrap weight (`kg`) $\rightarrow$ record licensed recycler batch handover (`Recycled_Closed`).
7. **Refurbishment Tech:** Open Tab **4. Refurbishment & Parts** $\rightarrow$ consume a harvested spare part (auto-adding `estimated_cost` to `parts_cost`), add labor cost, assign `Grade A/B/C`, and close ticket $\rightarrow$ item computes `Total_Unit_Cost`, sets Tier 1 price (`× 1.35`), and lists on `/store`.

---

### Act III: Certified Storefront, B2B Quotes, 15-Min Lock & Warranty (`http://localhost:3000/en/store`)
1. **Individual Buyer:** Pick **Individual Buyer** $\rightarrow$ browse curated refurbished **Laptops** and **Office & Studio Furniture** with search, category/brand/grade filters, and Quick-View gallery modal.
2. Select a serialized unit $\rightarrow$ **Reserve Items & Proceed (15-Min Lock)** (`FOR UPDATE NOWAIT`).
3. Test `FAILED` simulated webhook first (releases 15-min lock immediately), then reserve again and trigger `SUCCESS` webhook (`Card`, `Wallet`, or `InstaPay`) $\rightarrow$ item transitions to `Sold`.
4. Open **My Orders & Warranty** $\rightarrow$ download the printable **Tax Invoice** (`/api/documents/invoice/[id]`), click **Confirm Delivery & Start Warranty**, and file a warranty claim.
5. **Corporate Buyer (B2B):** Pick **Corporate Buyer (B2B)** $\rightarrow$ select units and click **Request Corporate Bulk Quote**.

---

### Act IV: Admin & Customer Service Control Center (`http://admin.localhost:3000`)
*(Open `http://admin.localhost:3000/en/admin/login` directly or pick **Customer Service** / **Platform Admin (MIS)** in the Quick Persona Switcher.)*

1. **Customer Service (`customer.service@mustadama.eg`):** Lands directly on Tab **5. Warranty Claims** (`Customer Service Warranty Claims Queue` + `Seller Return Authorizations`). Triage open claims (`Mark In Review` / `Approve & Resolve Claim` / `Reject`) with buyer notifications, and manage seller return fee authorizations.
2. **Platform Admin (`admin@mustadama.eg`):**
   * **Tab 1 — Platform KPIs & Sustainability:** Review Circular Revenue, Avg & Realized Unit Margins, Offer Acceptance Funnel, **Avg Turnaround Time (Receipt to Sale)**, 30–60–90+ Aging stacked bar & cards, Lifecycle Pipeline chart, Material Diversion & CO₂e impact, and click **Run Aging & Offer Expiry Engine**.
   * **Tab 2 — Categories & Diagnostic Schemas:** Edit any existing category or create a new one using the **Visual Diagnostic Question Builder** (synced live with JSON) and inspect the live valuation preview.
   * **Tab 3 — Customer Segments & Campaigns:** Filter the **Registered Customer Directory** (`Individual`, `Startup`, `Enterprise`), reassign segments inline, dispatch SMS/Email promo campaigns with optional promo code, and review recent dispatch logs.
   * **Tab 4 — B2B Quotes:** Review itemized corporate quote requests with buyer Tax ID & discounted subtotal preview, then click **Approve Quote (Valid 7 Days)** or **Expire**.
   * **Tab 6 — Operations & Audit Trail:** Review the **Bulky Furniture Pre-Verification Gate**, inspect **Serialized Inventory & Unit Economics**, and search the **Immutable Lifecycle Audit Log**.
