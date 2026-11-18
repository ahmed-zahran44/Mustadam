# Mustadama ("مُستدام") — Full Project Review, Test Scenarios & 12-Persona Graduation Defense Demo Script

> **Document Purpose:** This guide serves as your complete **Graduation Defense Playbook** for **Mustadama ("مُستدام")** — Integrated Circular Re-Commerce, Refurbishment, Spare Parts Harvesting, and Recycling Platform. It includes:
> 1. **Full Project Architecture & Codebase Audit Summary**
> 2. **End-to-End Acceptance Test Scenarios (`TS-01` – `TS-12`)**
> 3. **Step-by-Step Live Graduation Defense Demo Script Across All 12 SRS Personas**

---

## Part 1: Full Project Review & Pre-Defense Verification Summary

### 1.1 Architecture & Database Verification (23 PostgreSQL Tables + RLS + Triggers)
* **Stack:** Next.js 16.4.3 (App Router, TypeScript, Tailwind CSS 4, `next-intl` bilingual `EN` LTR / `AR` RTL) connected to **Cloud Supabase** (`https://xijhkffkmlaghqowmrmz.supabase.co`).
* **23 Relational Tables (`20261102000001_core_schema.sql`):**
  1. `users` (8 DB RBAC roles: `Customer`, `Partner_Inspector`, `Partner_Refurb_Tech`, `Partner_Dismantle_Tech`, `Partner_Warehouse_Mgr`, `Courier`, `Customer_Service`, `Admin` + `account_type = 'Individual' | 'Company'`)
  2. `categories` (Dynamic `diagnostic_questions_json`, `base_reference_price`, `warranty_days`, `is_bulky`, `requires_data_wipe`)
  3. `partner_hubs`
  4. `pickup_manifests` (with `total_batch_logistics_cost`)
  5. `acquisition_requests`
  6. `serialized_items` (with `Decommissioned_Aged` state & 7-day `offer_expires_at`)
  7. `item_photos`
  8. `item_status_history` (Immutable audit log — `REVOKE UPDATE, DELETE`)
  9. `inspection_records`
  10. `return_tasks`
  11. `payouts`
  12. `refurbishment_logs`
  13. `dismantling_tickets` (`trigger IN ('irreparable', 'aged_out')`)
  14. `spare_parts_inventory` (with `estimated_cost`)
  15. `recycling_batches`
  16. `scrap_entries`
  17. `quote_requests`
  18. `quote_items`
  19. `orders` (with 15-minute `reserved_until`)
  20. `order_items_warranty`
  21. `payment_events` (PCI-safe, zero PAN/CVV storage per `NFR-01`)
  22. `warranty_claims`
  23. `notifications`
* **Database Triggers & Atomic RPCs (`0002`, `0004`, `0005` migrations):**
  * `fn_enforce_and_audit_item_status()` & `fn_log_initial_item_status()`: Enforces the exact state transition matrix (`PROJECT.md Section 5`), mandatory NIST 800-88 Data Wipe gate (`FR-11`), refurbishment closure gate (`FR-13`), 7-day (`168h`) offer expiry window (`FR-12`), and appends immutable rows to `item_status_history` (`NFR-02`).
  * `fn_consume_harvested_spare_part()`: Automatically adds a consumed harvested part's `estimated_cost` to `refurbishment_logs.parts_cost`, `serialized_items.refurbishment_cost`, `total_unit_cost`, and recalculates `target_selling_price = round(total_unit_cost * 1.35, 2)` (`FR-14`, `FR-15`, `FR-17`, `ADR-009`).
  * `rpc_allocate_batch_logistics_cost(p_manifest_id, p_total_batch_cost)`: Divides bulky batch transport cost equally across all items in the batch (`Allocated_Logistics_Cost = Total_Batch_Cost / Items_Count_In_Batch`) (`FR-08`, `FR-17`).
  * `rpc_create_order_with_reservation(...)`: Acquires a pessimistic row lock (`SELECT ... FOR UPDATE NOWAIT`) on target `serialized_items` and reserves the order for **15 minutes** (`NFR-04`, `FR-21`), applying any approved B2B quote discount (`FR-20`).
  * `rpc_process_payment_webhook(...)`: Logs `payment_events`; on `SUCCESS`, marks order paid and transitions items to `Sold`; on `FAILED`, immediately releases the 15-minute lock.
  * `rpc_run_inventory_aging(...)`: Enforces the 30–60–90+ day aging cascade (`0_30` at $1.35\times$ cost, `31_60` at $0.80\times$ target price, `61_90` at $1.00\times$ unit cost, `91_plus` $\rightarrow$ **`Decommissioned_Aged`** + `aged_out` dismantling ticket) and auto-rejects expired 7-day offers into `Return_In_Progress`.

---

## Part 2: Comprehensive Test Scenarios Matrix (`TS-01` – `TS-12`)

| Scenario ID | SRS Requirement(s) | Persona / Role | Input / Action | Expected System & DB Outcome | Automated Test Coverage |
|---|---|---|---|---|---|
| **`TS-01`** | `FR-01`, `FR-02`, `ADR-006` | All 12 Personas (8 DB Roles) | Switch personas via Graduation Demo Toolbar or register Corporate Customer (`Tax ID` + `CR`) | Session switches to pre-seeded account; unified `Customer` accesses `/seller` and `/store`; B2B routes gated by `account_type = 'Company'`. | `tests/unit/rbac.test.ts`, `tests/unit/graduation-demo-scenarios.test.ts` |
| **`TS-02`** | `FR-03`, `FR-04`, `NFR-03` | `1. Individual Seller` (`Customer` / `Individual`) | Select category, answer dynamic JSON diagnostic questions, attach 3–5 compressed photos, submit | Computes `Estimated_Min_Price` & `Estimated_Max_Price` with legal disclaimer; inserts `acquisition_requests` + `serialized_items` (`Awaiting_Handover`). | `tests/unit/pricing.test.ts`, `tests/unit/domain-engines.test.ts` |
| **`TS-03`** | `FR-05`, `FR-08` | `2. Corporate Seller (B2B)` (`Customer` / `Company`) | Submit multi-line CSV Corporate Bulk Liquidation manifest | Inserts bulk `acquisition_requests` (`handover_method = 'Batch_Truck'`) and multiple `serialized_items`. | `tests/unit/graduation-demo-scenarios.test.ts` |
| **`TS-04`** | `FR-06`, `FR-07` | `5. Courier / Drop-off Hub` (`Courier`) | Scan Drop-off QR or confirm Courier pickup & dispatch to warehouse | Transitions item `Awaiting_Handover` $\rightarrow$ `Received_At_Dropoff_Hub` $\rightarrow$ `In_Transit_To_Warehouse` and logs `item_status_history`. | `tests/unit/domain-engines.test.ts` |
| **`TS-05`** | `FR-08`, `FR-17` | `6. Bulky Transport Team` (`Courier`) | Enter `Total Batch Cost = 600 EGP` on Zone Manifest & click **Allocate Equal Batch Cost** | Executes `rpc_allocate_batch_logistics_cost`; divides `600 EGP` equally across batch items (`Allocated_Logistics_Cost = Total_Batch_Cost / Items_Count_In_Batch`). | `tests/unit/pricing.test.ts`, `tests/unit/graduation-demo-scenarios.test.ts` |
| **`TS-06`** | `FR-09` | `10. Warehouse Manager` (`Partner_Warehouse_Mgr`) | Click **Confirm Warehouse Receipt & Generate Barcode** on arriving item | Generates unique barcode `MST-2026-NNNNN` and transitions `In_Transit_To_Warehouse` $\rightarrow$ `Received_Pending_Inspection`. | `tests/unit/domain-engines.test.ts` |
| **`TS-07`** | `FR-10`, `FR-11`, `FR-12` | `7. Partner Inspector` (`Partner_Inspector`) | Attempt inspection without NIST 800-88 wipe (blocked by trigger); check NIST wipe, classify (`Ready_For_Sale` / `Repairable` / `Irreparable`), set `Final Purchase Price = 7800 EGP` | Unchecked wipe raises DB exception; checked wipe issues `/api/documents/certificate/[id]`, sets `offer_expires_at = inspected_at + 7 days (168h)`, transitions to `Awaiting_Seller_Decision`, and sends SMS notification. | `tests/unit/domain-engines.test.ts`, `tests/unit/graduation-demo-scenarios.test.ts` |
| **`TS-08`** | `FR-12` | `1. Individual Seller` / `2. Corporate Seller` | Accept offer within 7 days OR Reject / let 7-day timer expire (**Auto-Reject**) | **Accept:** Credits `payouts` and routes to `Listed_In_Store`, `Under_Refurbishment`, or `Pending_Dismantling`. **Reject / Auto-Reject:** Transitions to `Return_In_Progress` and generates `150/300 EGP` `return_tasks` fee. | `tests/unit/domain-engines.test.ts`, `tests/unit/graduation-demo-scenarios.test.ts` |
| **`TS-09`** | `FR-14`, `FR-16`, `FR-19` | `9. Dismantling Tech` (`Partner_Dismantle_Tech`) | Harvest spare part (`16GB DDR4 SODIMM RAM`, `estimated_cost = 450 EGP`) + log `1.8 kg` E-waste scrap | Inserts `spare_parts_inventory` (`Available`, `estimated_cost = 450`), inserts `scrap_entries`, closes ticket, transitions item to `Scrap_Ready_For_Recycling`. | `tests/unit/pricing.test.ts`, `tests/unit/graduation-demo-scenarios.test.ts` |
| **`TS-10`** | `FR-13`, `FR-15`, `FR-17`, `ADR-009` | `8. Refurbishment Tech` (`Partner_Refurb_Tech`) | Consume harvested RAM (`+450 EGP`), enter `Labor Cost = 250 EGP`, assign `Grade A`, close ticket | Trigger adds `450 EGP` to `parts_cost`; computes `Total_Unit_Cost = Purchase + Logistics + 700` and Tier 1 `Target_Selling_Price = round(Total_Unit_Cost * 1.35, 2)`; transitions to `Listed_In_Store`. | `tests/unit/pricing.test.ts`, `tests/unit/graduation-demo-scenarios.test.ts` |
| **`TS-11`** | `FR-18`, `FR-19`, `FR-20`, `FR-21`, `FR-22`, `NFR-01`, `NFR-04` | `3. Individual Buyer` & `4. Corporate Buyer (B2B)` | Lock item (`15-min FOR UPDATE NOWAIT`), test `FAILED` payment (releases lock), then `SUCCESS` payment, download PDF Tax Invoice | Prevents double-buying; `SUCCESS` transitions item to `Sold` and generates `/api/documents/invoice/[id]` with Corporate `Tax ID` & `CR`. | `tests/unit/aging.test.ts`, `tests/unit/graduation-demo-scenarios.test.ts` |
| **`TS-12`** | `FR-23`, `FR-24`, `FR-25`, `FR-26`, `NFR-05` | `11. Customer Service` & `12. Platform Admin (MIS)` | Buyer confirms delivery (`Warranty_End_Date = Delivery + Warranty_Days`) & files claim; CS resolves claim; Admin reviews MIS KPIs, adds dynamic category, dispatches campaign | Updates `order_items_warranty`, resolves `warranty_claims`, adds new category without code changes (`NFR-05`), and updates real-time Financial/Aging/Environmental (`kg`) KPIs. | `tests/unit/graduation-demo-scenarios.test.ts` |

---

## Part 3: Step-by-Step Live Graduation Defense Presentation Script (Click-by-Click Across All 12 Personas)

### Pre-Defense Setup (1 Minute Before Presenting)
1. Start the development server in your terminal:
   ```powershell
   npm.cmd run dev
   ```
2. Open **`http://localhost:3000/en`** in your browser.
3. Point out the **Graduation Demo Toolbar** at the top of the screen:
   * Explain **ADR-006**: *"In PostgreSQL and Supabase RLS, we enforce 8 clean operational RBAC roles where a unified `Customer` role (`Individual` or `Company`) can both buy and sell. For the graduation defense, this toolbar gives us 1-click session switching across all 12 SRS user classes, a live Simulated SMS/Email Notification Drawer, and a manual trigger for the 30–60–90 day inventory aging and 7-day offer Auto-Reject engine."*
   * Click the **Language Switcher (`العربية` / `English`)** in the top header once to show instant **Arabic RTL (`dir="rtl"`)** and **English LTR (`dir="ltr"`)** switching (`ADR-005`).

---

### Act I: Sourcing & Smart Valuation (Personas 1 & 2 — `/seller`)

#### Step 1 — Persona 1: `1. Individual Seller` (`seller.individual@mustadama.eg`)
1. Click **`1. Individual Seller`** in the top Graduation Demo Toolbar. You are routed to **`/en/seller`**.
2. On the **`Sell Single Item (FR-03)`** tab:
   * Select Category: **`Laptops & Notebooks (12,000 EGP)`**.
   * Enter Item Title: **`HP EliteBook 840 G8 (Core i7, 16GB RAM)`**.
   * Toggle the **Category Diagnostic Questions** checkboxes on and off while pointing to the green **`Instant Initial Price Range (FR-04)`** card on the right:
     * Show how answering "No" to a question applies the deduction percentage live, updates the `Min – Max EGP` range, and displays the mandatory **7-day (168-hour) inspection legal disclaimer**.
   * Notice that 3 compressed condition photos (`Photo #1 ✓`, `Photo #2 ✓`, `Photo #3 ✓`) are pre-attached (satisfying the `FR-03` 3–5 photo requirement and `NFR-03` client-side compression).
   * Under **2. Handover & Logistics Selection (`FR-06`)**, click **`Partner Drop-off Hub (QR)`** (or keep **`Door-to-Door Courier`**).
   * Click **`Submit Acquisition Request & Generate Tracking Code`**.
   * **What the Committee Sees:** Green banner with generated tracking code `MST-TRK-XXXXXX`, plus a new SMS notification inside the **Simulated Inbox (`Notifications`)** drawer in the top toolbar!

#### Step 2 — Persona 2: `2. Corporate Seller (B2B)` (`seller.corporate@mustadama.eg`)
1. Click **`2. Corporate Seller (B2B)`** in the Demo Toolbar.
2. Click the **`Corporate Bulk (FR-05)`** tab in the Seller Portal.
   * Point out the badge: **`Account Type: Company`** (this tab warns Individual accounts that bulk liquidation is B2B-gated).
   * Review the pre-filled CSV manifest lines (`Dell Latitude 7400` and `Executive Ergonomic Desk Chair`).
   * Click **`Submit Corporate Bulk Manifest`**.
   * **What the Committee Sees:** Bulk batch `MST-BLK-XXXXXX` is created for 2 corporate assets and routed to `Batch_Truck` collection.

---

### Act II: Logistics, Equal Batch Cost Split & Warehouse Intake (Personas 5, 6 & 10 — `/partner`)

#### Step 3 — Persona 5: `5. Courier / Drop-off Hub` (`courier@mustadama.eg`)
1. Click **`5. Courier / Drop-off Hub`** in the Demo Toolbar. You are routed to **`/en/partner`**.
2. Click tab **`1. Logistics & Batch Split (FR-07/08)`**.
3. Under **Courier Pickup & Partner Drop-off Custody (`FR-07`)**:
   * Click **`Drop-off Hub Scan (QR)`** on an `Awaiting_Handover` item $\rightarrow$ status transitions to `Received_At_Dropoff_Hub`.
   * Click **`Dispatch to Warehouse`** $\rightarrow$ status transitions to `In_Transit_To_Warehouse`.

#### Step 4 — Persona 6: `6. Bulky Transport Team` (`transport@mustadama.eg`)
1. Click **`6. Bulky Transport Team`** in the Demo Toolbar.
2. Stay on tab **`1. Logistics & Batch Split (FR-07/08)`** and look at the right card: **Bulky Batch Manifest Equal Logistics Cost Split (`FR-08 & FR-17`)**.
3. Explain the formula:
   $$\text{Allocated\_Logistics\_Cost} = \frac{\text{Total\_Batch\_Cost}}{\text{Items\_Count\_In\_Batch}}$$
4. Keep `Total Batch Cost (EGP)` at **`600`** and click **`Allocate Equal Batch Cost`** on the `New Cairo & 5th Settlement` manifest.
   * **What the Committee Sees:** The PostgreSQL RPC `rpc_allocate_batch_logistics_cost` divides `600 EGP` equally across the items in that batch (`300 EGP` per item) and updates their `logistics_cost` and `total_unit_cost`.

#### Step 5 — Persona 10: `10. Warehouse Manager` (`warehouse.mgr@mustadama.eg`)
1. Click **`10. Warehouse Manager`** in the Demo Toolbar.
2. Click tab **`2. Warehouse Intake (FR-09)`**.
3. Click **`Confirm Warehouse Receipt & Generate Barcode`** on the arriving item.
   * **What the Committee Sees:** System generates a unique serialized warehouse barcode (`MST-2026-XXXXX`) and transitions the item to `Received_Pending_Inspection`.

---

### Act III: Technical Inspection, Mandatory NIST 800-88 Gate, Refurbishment & Dismantling (Personas 7, 9 & 8 — `/partner`)

#### Step 6 — Persona 7: `7. Partner Inspector` (`inspector@mustadama.eg`)
1. Click **`7. Partner Inspector`** in the Demo Toolbar and open tab **`3. Inspection & NIST Wipe (FR-10/11)`**.
2. **Demonstrate the Mandatory NIST 800-88 Gate (`FR-11`) Live:**
   * Select `Dell Latitude 5490 (MST-2026-00002)` (or your newly received laptop).
   * **Uncheck** `Confirm NIST 800-88 Data Destruction & Issue Certificate` and click **`Submit Inspection & Dispatch 7-Day Offer to Seller`**.
   * **What the Committee Sees:** PostgreSQL trigger `fn_enforce_and_audit_item_status` rejects the transition with a red error banner: *"Mandatory NIST 800-88 Data Wipe certification required before leaving inspection (FR-11)"*!
3. Now **check** `Confirm NIST 800-88 Data Destruction & Issue Certificate`, set **Technical Classification** to **`Repairable (Routes to Refurbishment on Accept)`**, keep **Final Purchase Offer Price** at **`7800` EGP**, and click **`Submit Inspection & Dispatch 7-Day Offer to Seller`**.
   * **What the Committee Sees:** Inspection is logged, `offer_expires_at` is set to **7 days (168 hours)** from now (`FR-12`), and the item transitions to `Awaiting_Seller_Decision`.

#### Step 7 — Seller Offer Decision & Printable NIST 800-88 Certificate (`FR-11`, `FR-12`)
1. Switch back to **`2. Corporate Seller (B2B)`** (who owns `MST-2026-00002`) or **`1. Individual Seller`** (who owns your newly submitted item) in the Demo Toolbar.
2. Open the **`My Items & 7d Offers`** tab in `/seller`.
3. Click **`📄 Download NIST 800-88 Data Destruction Certificate`** $\rightarrow$ opens `/api/documents/certificate/[id]` in a new tab showing the printable compliance certificate (`FR-11`).
4. Click **`Accept Offer & Instant Payout`** on the `Awaiting_Seller_Decision` item (or click **`Reject Offer & Return Item`** on another item to show the `150 EGP` return fee lock and **`Settle Return Fee (Simulated)`** button!).
   * **What the Committee Sees:** Instant payout reference `PAY-XXXXXX` is generated, and because the item was classified as `Repairable`, it automatically transitions to `Under_Refurbishment` and opens a refurbishment ticket!

#### Step 8 — Persona 9: `9. Dismantling Tech` (`dismantle.tech@mustadama.eg`) — Harvesting Spare Parts (`FR-14`, `FR-16`)
*(Note: You can trigger dismantling on any `Irreparable` item or after running the 90-day `Decommissioned_Aged` job in Act V. If a dismantling ticket is open under tab **`5. Dismantling & Recycling (FR-14/16)`**:)*
1. Click **`9. Dismantling Tech`** in the Demo Toolbar and open tab **`5. Dismantling & Recycling (FR-14/16)`**.
2. Show the fields: **Harvested Spare Part Name** (`16GB DDR4 SODIMM RAM Module`), **Part Estimated Cost (`450 EGP`)**, **Scrap Material Category** (`E-waste`), and **Scrap Weight (`1.8 kg`)**.
3. Click **`Harvest Part & Transition to Scrap_Ready_For_Recycling`**.
   * **What the Committee Sees:** The harvested component is added to `spare_parts_inventory` with `estimated_cost = 450 EGP`, `1.8 kg` of scrap is logged in `scrap_entries`, and the item moves to `Scrap_Ready_For_Recycling`.
4. Switch to **`10. Warehouse Manager`** and click **`Record Recycler Handover Batch`** at the bottom of tab 5 to transition `Scrap_Ready_For_Recycling` items to the terminal state **`Recycled_Closed`** (`FR-16`).

#### Step 9 — Persona 8: `8. Refurbishment Tech` (`refurb.tech@mustadama.eg`) — Consuming Harvested Parts & 35% Markup Rollup (`FR-13`, `FR-15`, `FR-17`, `ADR-009`)
1. Click **`8. Refurbishment Tech`** in the Demo Toolbar and open tab **`4. Refurbishment & Parts (FR-13/15)`**.
2. Set **Labor Cost** = `250 EGP`, optionally select an available harvested part from **Consume Harvested Part (`FR-15`)**, and select **Final Condition Grade** = `Grade A (Like New)`.
3. Click **`Close Ticket, Rollup Cost & List in Store`**.
   * **What the Committee Sees:**
     * Any consumed harvested part's `estimated_cost` is automatically added to `parts_cost` and `Refurbishment_Cost` by the database trigger `fn_consume_harvested_spare_part`.
     * `Total_Unit_Cost = Final_Purchase_Price + Allocated_Logistics_Cost + Refurbishment_Cost`.
     * Tier 1 `Target_Selling_Price = round(Total_Unit_Cost * 1.35, 2)` (**35% Markup on Cost**, `ADR-009`).
     * The item transitions from `Under_Refurbishment` $\rightarrow$ **`Listed_In_Store`**!

---

### Act IV: Serialized Storefront, B2B Bulk Quotes, 15-Minute Lock & Simulated Payment (Personas 3 & 4 — `/store`)

#### Step 10 — Persona 3: `3. Individual Buyer` (`buyer.individual@mustadama.eg`)
1. Click **`3. Individual Buyer`** in the Demo Toolbar. You are routed to **`/en/store`**.
2. Point out the seeded catalog items:
   * **`Lenovo ThinkPad T480 (MST-2026-00001)`**: `Total_Unit_Cost = 9,000 EGP` $\rightarrow$ Tier 1 (`0_30` days) price = **`12,150 EGP`** (`9,000 × 1.35`).
   * **`Ergonomic Mesh Office Chair (MST-2026-00003)`**: `Total_Unit_Cost = 4,000 EGP`, Tier 1 Target Price = ~~`5,400 EGP`~~, currently in Tier 3 (`61_90` days) with amber badge **`Clearance at Unit Cost (61-90d)`** at **`4,000 EGP`**!
3. Click **`Select Serialized Unit`** on the `Lenovo ThinkPad T480`.
4. In the right checkout box (**15-Min Atomic Reservation & PCI-Safe Payment Simulator**):
   * Point out **NFR-01**: No Cash on Delivery (`FR-21`) and zero card PAN/CVV inputs—only channel selection (`Bank Card`, `Mobile Wallet`, `InstaPay`) and webhook outcome simulation.
   * Click **`1. Lock Serialized Items & Reserve Order (15-Min Timer)`**.
   * **What the Committee Sees:** `rpc_create_order_with_reservation` acquires a `FOR UPDATE NOWAIT` row lock (`NFR-04`) and reserves the item for 15 minutes.
5. **Demonstrate Failed Payment Release First:**
   * Select `FAILED (Release 15-Min Lock Immediately)` in the dropdown and click **`2. Trigger Simulated Payment Webhook`**.
   * **What the Committee Sees:** The reservation lock is immediately released so the item remains `Listed_In_Store` for other buyers.
6. **Demonstrate Successful Payment & Tax Invoice:**
   * Select the item again, click **`1. Lock Serialized Items & Reserve Order (15-Min Timer)`**, keep outcome as `SUCCESS (Mark Sold + Issue Tax Invoice)`, and click **`2. Trigger Simulated Payment Webhook`**.
   * **What the Committee Sees:** Order status becomes `SUCCESS`, item transitions to `Sold`, and under the **`My Orders & Warranty`** tab you can click **`📄 Download Tax Invoice (FR-22)`**!

#### Step 11 — Delivery Confirmation & Automated Warranty Claim (`FR-23`, `FR-24`)
1. Still as **`3. Individual Buyer`**, open the **`My Orders & Warranty`** tab in `/store`.
2. Click **`Confirm Delivery & Start Warranty (FR-23)`** on the purchased item.
   * **What the Committee Sees:** `Delivery Date` is recorded as today, and `Warranty Valid Until` is automatically computed as $\text{Delivery\_Date} + 90\text{ days}$ (`FR-23`).
3. Click **`File Warranty Claim (FR-24)`** right next to it $\rightarrow$ submits an active warranty claim to Customer Service!

#### Step 12 — Persona 4: `4. Corporate Buyer (B2B)` (`buyer.corporate@mustadama.eg`)
1. Click **`4. Corporate Buyer (B2B)`** in the Demo Toolbar.
2. Select a listed item in `/store` and click **`Request Corporate B2B Bulk Quote (FR-20)`** (this button only appears for `account_type = 'Company'`).
   * **What the Committee Sees:** Quote request is created in status `requested` and routed to the Admin portal.

---

### Act V: Customer Service, Admin MIS, Sustainability KPIs & 30–60–90 Aging Engine (Personas 11 & 12 — `/admin`)

#### Step 13 — Persona 11: `11. Customer Service` (`customer.service@mustadama.eg`)
1. Click **`11. Customer Service`** in the Demo Toolbar. You are routed to **`/en/admin`**.
2. Click tab **`5. Warranty Claims`** (`FR-24`).
3. Review the buyer's warranty claim and click **`Approve & Resolve`**.
   * **What the Committee Sees:** Claim status updates to `RESOLVED` with the resolution note logged.

#### Step 14 — Persona 12: `12. Platform Admin (MIS)` (`admin@mustadama.eg`)
1. Click **`12. Platform Admin (MIS)`** in the Demo Toolbar.
2. **Tab `1. MIS & Sustainability KPIs (FR-26)`:**
   * Highlight the 4 live executive KPI cards:
     * **Total Circular Revenue (Sales + Scrap)**
     * **Avg Profit Margin / Unit (`FR-17`)**
     * **Seller Offer Acceptance Rate (`FR-12`)**
     * **Environmental Impact: Diverted Mass (`kg` diverted from landfills, `FR-26`)**
   * Highlight the **30–60–90+ Day Inventory Aging & `Decommissioned_Aged` Breakdown (`FR-19`)** and the **Immutable Audit Log Entries (`NFR-02`)** counter.
3. **Tab `2. Dynamic Categories (NFR-05)`:**
   * Enter Category Name (EN): `Smartphones & Tablets`, (AR): `الهواتف الذكية والأجهزة اللوحية`, Base Price: `8000`, Warranty Days: `60`, check `Requires NIST 800-88 Data Wipe`, and click **`Save Dynamic Category`**.
   * **What the Committee Sees:** A new category with its own JSON diagnostic questionnaire is live immediately in `/seller` without any code change (`NFR-05`)!
4. **Tab `3. Segment Campaigns (FR-25)`:**
   * Choose Segment `Startup / SME`, Channel `Email`, and click **`Dispatch Targeted Campaign`** $\rightarrow$ dispatches targeted notifications to matching corporate accounts.
5. **Tab `4. B2B Quotes (FR-20)`:**
   * Click **`Approve Quote (Valid 7 Days)`** with `12%` discount $\rightarrow$ approves the Corporate Buyer's quote and sends an email notification.
6. **Trigger the Automated Aging & 7-Day Auto-Reject Engine (`FR-12`, `FR-19`):**
   * Click the amber button **`Run 30-60-90d Aging & 7d Auto-Reject`** in the top Graduation Demo Toolbar.
   * **What the Committee Sees:** `rpc_run_inventory_aging` evaluates all `Listed_In_Store` items across Tiers 1–4 (`0_30`, `31_60`, `61_90`, `91_plus` $\rightarrow$ `Decommissioned_Aged`) and auto-rejects any expired 7-day offers into `Return_In_Progress`.

