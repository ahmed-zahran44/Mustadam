# Mustadama ("مُستدام" – Sustainable) — Project Specification & Domain Truth

> **Single Source of Truth (Domain & Requirements):** This file translates [software_requirements_specification_srs_mustadama.md](file:///d:/Mustadam%20Project/software_requirements_specification_srs_mustadama.md) into a structured, zero-ambiguity reference for developers and AI agents. **Never invent roles, item states, or pricing formulas outside this document.** If a requirement evolves, update this file and log the decision in [DECISIONS.md](file:///d:/Mustadam%20Project/DECISIONS.md) first.

---

## 1. Project Identity & Vision

* **Project Name:** Mustadama (مُستدام – "Sustainable")
* **Category:** Circular E-Commerce & Re-Commerce Management Information System (MIS) for E-Waste and Used Furniture
* **Business Models:** B2C & B2B2C Acquisition, Partner-Operated Inspection/Refurbishment/Dismantling, Serialized Re-Commerce Storefront, and Licensed Scrap Recycling
* **Supported Languages:** Bilingual **English (`en`, LTR)** and **Arabic (`ar`, RTL)**
* **Currency & Locale:** Egyptian Pound (`EGP` / `ج.م`), Egypt (`ar-EG` / `en-EG`)
* **Core Constraint:** Every acquired product is tracked as a **unique serialized instance (`item_serial_id`, Quantity = 1)** from acquisition through inspection, refurbishment or dismantling, sale, warranty, or recycling. Cash on Delivery (COD) is strictly prohibited.

---

## 2. Four Primary Subsystems (Portals)

1. **Seller Portal (`/seller` — Acquisition Engine):**
   * Accessible to any authenticated `Customer` (`Individual` or `Company`).
   * Individual single-item sale submissions with photo upload (min 3, max 5 with client-side compression) and dynamic category diagnostic questionnaires (`FR-03`, `NFR-03`, `NFR-05`).
   * Automated non-binding estimated price range (`Min EGP – Max EGP`) with legal disclaimer (`FR-04`).
   * Corporate (B2B) bulk liquidation requests via multi-line entry or structured manifest upload (`FR-05`).
   * Handover selection: Door-to-door courier pickup, Authorized Partner Drop-off QR/Tracking code, or Bulky Furniture pre-verified batch routing (`FR-06`, `FR-08`).
   * **7-Day (168-Hour) Final Price Offer decision workflow (`FR-12`):**
     * **Accept:** Triggers simulated digital payout and transfers legal ownership to Mustadama.
     * **Reject:** Calculates Return Transport & Inspection Fee, generates a `Return_Tasks` record, transitions item to `Return_In_Progress`, and locks release until fee settlement.
     * **No Response within 7 Days (168 Hours) — Auto-Reject:** Automatically marks the offer as rejected (`Auto-Reject`), transitions the item to `Return_In_Progress`, and generates the return workflow task.
2. **Buyer E-Commerce Storefront (`/store`):**
   * Accessible to any `Customer` (`Individual` or `Company`).
   * Serialized catalog displaying only `Listed_In_Store` items with real photos, technical specs, Condition Grade (`Grade A`, `Grade B`, `Grade C`), current selling price (reflecting 30–60–90 day aging), and category warranty duration (`FR-18`).
   * Corporate (B2B) Bulk Quote Request workflow with custom admin discount and 7-day validity (`FR-20`).
   * Digital checkout with 15-minute inventory reservation lock (`NFR-04`) and Simulated Multi-Channel Payment Gateway (Bank Cards, Mobile Wallets, InstaPay) (`FR-21`, `NFR-01`).
   * Automated PDF Tax Invoice generation (including Corporate Tax ID & Commercial Registration) (`FR-22`).
   * Order tracking, delivery confirmation, automated warranty end-date calculation (`FR-23`), and warranty claim submission (`FR-24`).
3. **Partner Operations Portal (`/partner` — WMS & Technical Hub):**
   * **Logistics View (`Courier`):** Courier doorstep pickup confirmation, Partner Drop-off Hub QR/tracking scan (`FR-07`), and Bulky Transport Team batch pickup manifest execution (`FR-08`).
   * **Warehouse Manager View (`Partner_Warehouse_Mgr`):** Serialized warehouse intake generating unique `item_serial_id` & barcode (`FR-09`), return shipment release after fee payment (`FR-12`), and licensed recycler scrap batch handover logging (`FR-16`).
   * **Inspection Officer View (`Partner_Inspector`):** Technical inspection report (`Ready_For_Sale`, `Repairable`, `Irreparable`), mandatory NIST 800-88 Data Wipe verification & certificate generation for storage-bearing electronics (`FR-11`), and `final_purchase_price` submission setting `offer_expires_at = inspected_at + 7 days` (`FR-10`, `FR-12`).
   * **Refurbishment Technician View (`Partner_Refurb_Tech`):** Work order management, spare part consumption from `Spare_Parts_Inventory` (automatically adding the harvested part's `estimated_cost` to `parts_cost` and `Refurbishment_Cost` per `FR-15`), labor cost logging, final grade assignment (`Grade A/B/C`), and ticket closure (`FR-13`).
   * **Dismantling Technician View (`Partner_Dismantle_Tech`):** Dismantling of `Pending_Dismantling` (irreparable) and `Decommissioned_Aged` (aged > 90 days) items, functional spare parts harvesting with `estimated_cost` valuation linked to parent `item_serial_id` (`FR-14`), and remaining scrap weight logging by material category (`E-waste`, `Metal`, `Wood`, `Plastic`) (`FR-16`).
4. **Core Admin & MIS Analytics Dashboard (`/admin`):**
   * **Customer Service View (`Customer_Service`):** Buyer/seller inquiry handling, `Warranty_Claims` triage, and return authorizations (`FR-24`).
   * **Platform Manager View (`Admin`):** Category & dynamic JSON diagnostic questionnaire configuration, base pricing & deduction rules, warranty policy configuration, bulky pre-verification approval (`FR-04`, `FR-08`, `FR-23`, `NFR-05`), Corporate B2B Bulk Quote discount approval (`FR-20`), customer segmentation campaigns (`FR-25`), and real-time MIS & Sustainability KPIs (`FR-26`).

---

## 3. RBAC Database Roles vs. Graduation Demo Toolbar Personas (`FR-01`, `FR-02`)

### 3.1 Clean Database RBAC Roles (`Users.role` & Auth JWT `app_metadata.role`)
Buyers and sellers are consolidated into a single unified **`Customer`** role paired with `Users.account_type` (`Individual` | `Company`). Any `Customer` can both buy on `/store` and sell on `/seller` using the same account.

| # | Database `Users.role` | Allowed `account_type` | Portal Access | Capabilities |
|---|---|---|---|---|
| 1 | `Customer` | `Individual` or `Company` | `/seller` & `/store` | Buy and sell items; `Company` accounts unlock B2B bulk liquidation (`FR-05`), B2B bulk quotes (`FR-20`), and tax-compliant invoices (`FR-22`). |
| 2 | `Courier` | `Individual` | `/partner/logistics` | Doorstep small-device custody confirmation (`FR-07`), Partner Drop-off Hub QR scan (`FR-07`), and Bulky Batch Pickup manifest execution (`FR-08`). |
| 3 | `Partner_Warehouse_Mgr` | `Individual` | `/partner/warehouse` | Serialized warehouse intake & barcode generation (`FR-09`), return shipment release (`FR-12`), and `Recycling_Batches` handover logging (`FR-16`). |
| 4 | `Partner_Inspector` | `Individual` | `/partner/inspection` | Bulky pre-verification (`FR-08`), technical inspection (`FR-10`), NIST 800-88 data wipe certification (`FR-11`), and setting `final_purchase_price` (`FR-12`). |
| 5 | `Partner_Refurb_Tech` | `Individual` | `/partner/refurbishment` | Refurbishment work orders (`FR-13`), consuming harvested parts from `Spare_Parts_Inventory` (`FR-15`), logging labor/parts cost, and assigning `Grade A/B/C`. |
| 6 | `Partner_Dismantle_Tech` | `Individual` | `/partner/dismantling` | Dismantling `Pending_Dismantling` & `Decommissioned_Aged` items, harvesting parts with `estimated_cost` (`FR-14`), and logging `Scrap_Entries` (`FR-16`). |
| 7 | `Customer_Service` | `Individual` | `/admin/support` | Managing buyer/seller inquiries, `Warranty_Claims` (`FR-24`), and return authorizations. |
| 8 | `Admin` | `Individual` | `/admin` | Full platform configuration, pricing/aging rules, B2B quote discounts (`FR-20`), segmentation campaigns (`FR-25`), and MIS KPIs (`FR-26`). |

### 3.2 Graduation Demo Toolbar Personas (12 UI Buttons — SRS Table 2.2)
The **Graduation Demo Toolbar** displays all **12 SRS User Personas** as one-click buttons. Clicking any button switches the active session to a dedicated pre-seeded user account and navigates directly to that persona's workspace:

| Demo Button # | SRS Persona Label | Pre-Seeded Account `Users.role` | `account_type` | Target Route |
|---|---|---|---|---|
| 1 | **Individual Seller** | `Customer` | `Individual` | `/[locale]/seller` |
| 2 | **Corporate Seller (B2B)** | `Customer` | `Company` | `/[locale]/seller/bulk` |
| 3 | **Individual Buyer** | `Customer` | `Individual` | `/[locale]/store` |
| 4 | **Corporate Buyer (B2B)** | `Customer` | `Company` | `/[locale]/store/quotes` |
| 5 | **Courier / Partner Drop-off Agent** | `Courier` | `Individual` | `/[locale]/partner/logistics` |
| 6 | **Transport Team (Bulky)** | `Courier` | `Individual` | `/[locale]/partner/logistics/manifests` |
| 7 | **Partner Inspection Officer** | `Partner_Inspector` | `Individual` | `/[locale]/partner/inspection` |
| 8 | **Partner Refurbishment Tech** | `Partner_Refurb_Tech` | `Individual` | `/[locale]/partner/refurbishment` |
| 9 | **Partner Dismantling Tech** | `Partner_Dismantle_Tech` | `Individual` | `/[locale]/partner/dismantling` |
| 10 | **Partner Warehouse Manager** | `Partner_Warehouse_Mgr` | `Individual` | `/[locale]/partner/warehouse` |
| 11 | **Customer Service Agent** | `Customer_Service` | `Individual` | `/[locale]/admin/support` |
| 12 | **Platform Manager (Admin)** | `Admin` | `Individual` | `/[locale]/admin` |

---

## 4. Core Business Formulas & Rules

### 4.1 Automated Estimated Price Range (`FR-04`)
When a seller submits a diagnostic questionnaire for a category:
$$\text{Estimated\_Mid\_Price} = \max\left(\text{Category\_Min\_Floor},\; \text{Base\_Reference\_Price} \times \left(1 - \sum \text{Diagnostic\_Deduction\_Pct}\right) - \sum \text{Flat\_Deductions}\right)$$
* $\text{Estimated\_Min\_Price} = \text{round}(\text{Estimated\_Mid\_Price} \times 0.90)$
* $\text{Estimated\_Max\_Price} = \text{round}(\text{Estimated\_Mid\_Price} \times 1.10)$
* Always displayed with the mandatory legal disclaimer that the final offer is subject to physical technical inspection.

### 4.2 Bulky Batch Logistics Cost Allocation (`FR-08` & `FR-17`)
For bulky furniture and large appliances collected via a scheduled `Pickup_Manifest`:
* The total transport cost of the batch (`total_batch_logistics_cost` on `Pickup_Manifests`) is **divided equally** among all serialized items collected in that batch:
$$\text{Allocated\_Logistics\_Cost} = \frac{\text{Total\_Batch\_Cost}}{\text{Items\_Count\_In\_Batch}}$$
* For single-item small device pickups/drop-offs, `Allocated_Logistics_Cost` is the configured single-item courier/drop-off tariff stored in `Serialized_Items.logistics_cost`.

### 4.3 Harvested Spare Parts Valuation & Refurbishment Cost (`FR-13`, `FR-14`, `FR-15` & `FR-17`)
* When a Dismantling Technician harvests a functional component into `Spare_Parts_Inventory` (`FR-14`), they record its `estimated_cost` (EGP).
* When a Refurbishment Technician consumes one or more harvested parts from `Spare_Parts_Inventory` to repair another item (`FR-15`), each consumed part's `estimated_cost` is **automatically added** to the target refurbishment ticket's `parts_cost` (alongside any external parts cost):
$$\text{Parts\_Cost} = \sum \text{Consumed\_Harvested\_Part.estimated\_cost} + \text{External\_Parts\_Cost}$$
$$\text{Refurbishment\_Cost} = \text{Labor\_Cost} + \text{Parts\_Cost}$$

### 4.4 Total Unit Cost & Tier 1 Target Selling Price (`FR-17`, `ADR-009`)
Before listing an item in the storefront:
$$\text{Total\_Unit\_Cost} = \text{Final\_Purchase\_Price} + \text{Allocated\_Logistics\_Cost} + \text{Refurbishment\_Cost}$$
* **Tier 1 Target Selling Price (35% Markup on Cost):**
$$\text{Target\_Selling\_Price} = \text{round}(\text{Total\_Unit\_Cost} \times 1.35,\; 2)$$
* **Unit Net Margin (`FR-17`, `FR-26`):**
$$\text{Unit\_Net\_Margin} = \text{Sold\_Price} - \text{Total\_Unit\_Cost}$$

### 4.5 7-Day (168-Hour) Offer Decision Window & Auto-Reject (`FR-12`)
When the Partner Inspection Officer submits the inspection report and sets `Final_Purchase_Price`:
$$\text{Offer\_Expires\_At} = \text{Inspected\_At} + \text{7 days (168 hours)}$$
* **Within 7 Days:** Seller may **Accept** (triggers simulated payout in `Payouts` and transfers ownership) or **Reject** (generates `Return_Tasks` and transitions item to `Return_In_Progress`).
* **After 7 Days (`Current_Time > Offer_Expires_At` with `seller_decision = 'pending'`):** The system triggers an **Automatic Rejection (`Auto-Reject`)**, sets `seller_decision = 'auto_rejected'`, transitions `current_status` to `'Return_In_Progress'`, creates a `Return_Tasks` row with the calculated return & inspection fee, and notifies the seller via the Simulated Notification Service.

### 4.6 Automated 30–60–90 Day Inventory Aging Engine (`FR-19`, `ADR-009`)
Evaluated daily (and via manual Demo Toolbar trigger) using $\text{Days\_Listed} = \text{Current\_Date} - \text{Listed\_Date}$ for all items with `current_status = 'Listed_In_Store'`:
* **Tier 1 (Day 0 to 30):** `aging_tier = '0_30'`, `target_selling_price = round(total_unit_cost * 1.35, 2)`, `selling_price = target_selling_price` (flat 35% markup on cost)
* **Tier 2 (Day 31 to 60):** `aging_tier = '31_60'`, `selling_price = round(target_selling_price * 0.80, 2)` (20% markdown off Tier 1 price, i.e., $1.08\times$ cost)
* **Tier 3 (Day 61 to 90):** `aging_tier = '61_90'`, `selling_price = total_unit_cost` (break-even clearance)
* **Tier 4 (Day 91+):** `aging_tier = '91_plus'`, automatically unlist item from the storefront, transition `current_status` from `'Listed_In_Store'` to **`'Decommissioned_Aged'`**, and generate an open `Dismantling_Tickets` row with `trigger = 'aged_out'`. Once the Dismantling Technician harvests parts and logs scrap weight, the item transitions from **`'Decommissioned_Aged'`** to **`'Scrap_Ready_For_Recycling'`**.

### 4.7 Category-Based Warranty Calculation (`FR-23`, `FR-24`)
Upon order delivery confirmation:
$$\text{Warranty\_End\_Date} = \text{Delivery\_Date} + \text{Category\_Warranty\_Days}$$
* Warranty claims (`FR-24`) are permitted if and only if $\text{Current\_Date} \le \text{Warranty\_End\_Date}$.

---

## 5. Strict Item Lifecycle State Transition Matrix (SRS Section 4 + `FR-12` & `FR-19`)

Every `Serialized_Items.current_status` update is validated against this table and recorded in `Item_Status_History`:

| # | Current State (`from_status`) | Trigger / Action | Next State (`to_status`) | Responsible Role | Gate / Invariant |
|---|---|---|---|---|---|
| 1 | *(New)* | Seller submits sale request (`FR-03`/`FR-05`) | `Submitted` | `Customer` (Seller) | Min 3 photos + valid `diagnostic_answers`. |
| 2 | `Submitted` | Seller accepts estimated price range & selects handover (`FR-06`/`FR-08`) | `Awaiting_Handover` | `Customer` (Seller) | Bulky items require `preverification_status = 'approved'` before truck dispatch (`FR-08`). |
| 3a | `Awaiting_Handover` | Partner drop-off agent scans tracking/QR code (`FR-07`) | `Received_At_Dropoff_Hub` | `Courier` (Drop-off Hub) | Valid `tracking_code` & `dropoff_partner_id`. |
| 3b | `Received_At_Dropoff_Hub` | Drop-off hub dispatches item to warehouse (`FR-07`) | `In_Transit_To_Warehouse` | `Courier` | — |
| 3c | `Awaiting_Handover` | Courier collects at doorstep OR bulky transport picks up (`FR-07`/`FR-08`) | `In_Transit_To_Warehouse` | `Courier` | For batch truck pickups, computes equal `Allocated_Logistics_Cost` (`FR-08`/`FR-17`). |
| 4 | `In_Transit_To_Warehouse` | Warehouse Manager logs arrival & generates barcode (`FR-09`) | `Received_Pending_Inspection` | `Partner_Warehouse_Mgr` | Unique `barcode` generated. |
| 5 | `Received_Pending_Inspection` | Inspector logs `Inspection_Records` & sets `final_purchase_price` (`FR-10`/`FR-11`/`FR-12`) | `Awaiting_Seller_Decision` | `Partner_Inspector` | If `Categories.requires_data_wipe = true`, **must** have `data_wiped_bool = true` and `data_wipe_certificate_url` (`FR-11`). Sets `offer_expires_at = inspected_at + interval '7 days'` (168 hours). |
| 6a | `Awaiting_Seller_Decision` | Seller rejects Final Price OR 7-day (168h) window expires (**Auto-Reject**) (`FR-12`) | `Return_In_Progress` | `Customer` / System Cron / `Partner_Warehouse_Mgr` | Creates `Return_Tasks` row with fee; warehouse release locked until `fee_status = 'paid'`. |
| 6b | `Awaiting_Seller_Decision` | Seller accepts Final Price within 7 days (`Ready_For_Sale`) (`FR-12`) | `Listed_In_Store` | `Customer` / System | Creates simulated `Payouts` row; sets `listed_date = now()`, `total_unit_cost` (`FR-17`). |
| 6c | `Awaiting_Seller_Decision` | Seller accepts Final Price within 7 days (`Repairable`) (`FR-12`/`FR-13`) | `Under_Refurbishment` | `Customer` / `Partner_Refurb_Tech` | Creates simulated `Payouts` row + open `Refurbishment_Logs` ticket. |
| 6d | `Awaiting_Seller_Decision` | Seller accepts Final Price within 7 days (`Irreparable`) (`FR-12`/`FR-14`) | `Pending_Dismantling` | `Customer` / `Partner_Dismantle_Tech` | Creates simulated `Payouts` row + open `Dismantling_Tickets` (`trigger = 'irreparable'`). |
| 7 | `Under_Refurbishment` | Refurb Tech logs costs (incl. harvested `estimated_cost`), assigns `Grade A/B/C` & closes ticket (`FR-13`/`FR-15`) | `Listed_In_Store` | `Partner_Refurb_Tech` | `Refurbishment_Logs.status = 'closed'`, `condition_grade IN ('A','B','C')`, updates `total_unit_cost` & `listed_date`. |
| 8a | `Listed_In_Store` | Buyer completes payment (`Payment_Events.outcome = 'SUCCESS'`) (`FR-21`) | `Sold` | `Customer` (Buyer) / Payment Simulator | Active reservation (`reserved_until >= now()`) & `Orders.payment_status = 'SUCCESS'`. |
| 8b | `Listed_In_Store` | Unsold for $> 90$ days (`FR-19` Automated Job) | `Decommissioned_Aged` | System Cron Job | Unlists item from store, sets `current_status = 'Decommissioned_Aged'`, and creates `Dismantling_Tickets` (`trigger = 'aged_out'`). |
| 9a | `Pending_Dismantling` | Dismantling Tech harvests parts (`estimated_cost`) & logs scrap weight (`FR-14`/`FR-16`) | `Scrap_Ready_For_Recycling` | `Partner_Dismantle_Tech` | `Dismantling_Tickets.status = 'closed'` & $\ge 1$ `Scrap_Entries` or `Spare_Parts_Inventory` logged. |
| 9b | `Decommissioned_Aged` | Dismantling Tech harvests parts (`estimated_cost`) & logs scrap weight (`FR-14`/`FR-16`/`FR-19`) | `Scrap_Ready_For_Recycling` | `Partner_Dismantle_Tech` | `Dismantling_Tickets.status = 'closed'` & $\ge 1$ `Scrap_Entries` or `Spare_Parts_Inventory` logged. |
| 10 | `Scrap_Ready_For_Recycling` | Warehouse Manager records handover in `Recycling_Batches` (`FR-16`) | `Recycled_Closed` | `Partner_Warehouse_Mgr` | Linked to valid `batch_id` with `revenue_amount` & `total_weight_kg`. |

---

## 6. MoSCoW Requirements Traceability Matrix

| ID | Module | Requirement Summary | Priority | Status |
|---|---|---|---|---|
| `FR-01` | M1: Auth & RBAC | User Registration (`Customer` with `Individual` or `Company` Tax ID / Commercial Reg) | **Must** | Complete |
| `FR-02` | M1: Auth & RBAC | Role-Based Access Control (8 DB roles + 12 Demo Toolbar personas across 4 portals) | **Must** | Complete |
| `FR-03` | M2: Sourcing | Individual Sale Request, 3+ photos & dynamic diagnostic questionnaire | **Must** | Complete |
| `FR-04` | M2: Sourcing | Automated non-binding Estimated Price Range (`Min–Max EGP`) + disclaimer | **Must** | Complete |
| `FR-05` | M2: Sourcing | Corporate Bulk Sale Request (multi-item or structured manifest upload) | **Must** | Complete |
| `FR-06` | M3: Logistics | Small Device Handover Selection (Courier slot vs. Partner Drop-off QR) | **Must** | Complete |
| `FR-07` | M3: Logistics | Custody Confirmation (`In_Transit_To_Warehouse` / `Received_At_Dropoff_Hub`) | **Must** | Complete |
| `FR-08` | M3: Logistics | Bulky Furniture Pre-Verification, Zone Batch Pickup Manifest & Equal Cost Split | **Must** | Complete |
| `FR-09` | M3: Logistics | Serialized Warehouse Intake (`item_serial_id` & barcode generation) | **Must** | Complete |
| `FR-10` | M4: Inspection | Technical Inspection & Classification (`Ready_For_Sale`, `Repairable`, `Irreparable`) | **Must** | Complete |
| `FR-11` | M4: Inspection | Mandatory NIST 800-88 Data Wipe Certification & Certificate PDF | **Must** | Complete |
| `FR-12` | M4: Inspection | Final Price Offer, **7-Day (168h)** Seller Decision Window, Auto-Reject, Payout & Return Task | **Must** | Complete |
| `FR-13` | M5: Circular Engine | Refurbishment Work Order Management, Cost Logging & Grade A/B/C Assignment | **Must** | Complete |
| `FR-14` | M5: Circular Engine | Dismantling & Spare Parts Harvesting (`estimated_cost`) linked to parent `item_serial_id` | **Must** | Complete |
| `FR-15` | M5: Circular Engine | Internal Spare Parts Issuance (auto-adding `estimated_cost` to `parts_cost` & `Refurbishment_Cost`) | **Should** | Complete |
| `FR-16` | M5: Circular Engine | Scrap Weight (`kg` by material) & Licensed Recycler Batch Handover | **Must** | Complete |
| `FR-17` | M6: Storefront | Unit-Cost & Margin Calculation (`Final_Purchase_Price + Allocated_Logistics_Cost + Refurbishment_Cost`) | **Should** | Complete |
| `FR-18` | M6: Storefront | Serialized Storefront Catalog with Category/Price/Grade filters | **Must** | Complete |
| `FR-19` | M6: Storefront | Automated 30–60–90 Day Aging Engine & Day 91+ `Decommissioned_Aged` $\rightarrow$ `Scrap_Ready_For_Recycling` | **Should** | Complete |
| `FR-20` | M6: Storefront | Corporate Bulk Quote Request & Admin B2B Discount (7-day validity) | **Could** | Complete |
| `FR-21` | M7: Checkout & Warranty | Simulated Multi-Channel Payment (Card/Wallet/InstaPay), 15m Lock & Webhook | **Must** | Complete |
| `FR-22` | M7: Checkout & Warranty | Automated PDF Tax Invoicing (with Corporate Tax ID & Commercial Reg) | **Must** | Complete |
| `FR-23` | M7: Checkout & Warranty | Automated Category-Based Warranty Calculation on Delivery | **Must** | Complete |
| `FR-24` | M7: Checkout & Warranty | Warranty Claim Submission & Routing (`Current_Date <= Warranty_End_Date`) | **Should** | Complete |
| `FR-25` | M8: Admin & MIS | Customer Segmentation (`Individual`/`Startup`/`Enterprise`) & Campaigns | **Could** | Complete |
| `FR-26` | M8: Admin & MIS | Real-Time MIS & Sustainability Dashboard (Financial, Operational, Environmental) | **Must** | Complete |
| `NFR-01` | Security | PCI-Safe Payment Simulation (never store/log card numbers or CVVs) | **Must** | Complete |
| `NFR-02` | Auditability | Immutable `Item_Status_History` audit log for every state transition | **Must** | Complete |
| `NFR-03` | Performance | Storefront load $\le 2.5\text{s}$ & client-side photo compression (up to 5 photos) | **Must** | Complete |
| `NFR-04` | Concurrency | Row-level locking on serialized items (`Quantity = 1`) during checkout | **Must** | Complete |
| `NFR-05` | Modularity | Dynamic JSON diagnostic questionnaires per category (`diagnostic_questions_json`) | **Must** | Complete |
