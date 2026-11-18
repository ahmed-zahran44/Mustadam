# Software Requirements Specification (SRS)

## Graduation Project: “Mustadama” (مُستدام – “Sustainable”)

**A Circular E-Commerce & Re-Commerce Management Information System for E-Waste and Used Furniture**

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) document provides a complete technical and functional description of the **"Mustadama"** web-based platform. It translates the business requirements defined in the Business Requirements Document (BRD) into detailed system features, functional requirements, external interfaces, data models, and non-functional constraints to guide developers, system architects, testers, and academic evaluators.

### 1.2 Document Conventions

* **FR-XX:** Functional Requirement identifier.

* **NFR-XX:** Non-Functional Requirement identifier.

* **Priority Levels (MoSCoW):**

  * **Must:** Critical for system operation and MVP launch.

  * **Should:** Important functional enhancement implemented if schedule permits.

  * **Could:** Desirable feature postponed if time is constrained.

### 1.3 Intended Audience

* **Development Team:** Frontend, backend, and database engineers building the platform.

* **System Analysts & QA Testers:** Responsible for UML modeling, database design, and writing test cases against acceptance criteria.

* **Academic Supervision Committee:** Evaluating the Management Information System (MIS) architecture and systems analysis rigor.

### 1.4 Product Scope

**Mustadama** is a B2C and B2B2C re-commerce platform that acquires used electronics and furniture from individuals and corporate entities, coordinates inspection, refurbishment, or dismantling through **Authorized Technical & Warehousing Partners**, resells refurbished items with category-specific warranties via an online store, and routes non-repairable scrap to licensed recycling entities.

## 2. Overall Description

### 2.1 Product Perspective

Mustadama is a centralized cloud-hosted Management Information System (MIS) and E-Commerce platform consisting of four primary subsystems:

1. **Seller Portal (Acquisition Engine):** Enables individuals and companies to submit items, complete diagnostic questionnaires, receive estimated price ranges, and coordinate item handover.

2. **Buyer E-Commerce Storefront:** Allows individual and corporate buyers to browse unique serialized refurbished items, request bulk quotes, and complete digital checkouts.

3. **Partner Operations Portal (WMS & Technical Hub):** Used by authorized partner warehouses, couriers, drop-off hubs, inspection officers, refurbishment technicians, and dismantling technicians to manage item lifecycles.

4. **Core Admin & Analytics Dashboard:** Used by platform managers and customer service to manage pricing algorithms, inventory aging rules, marketing campaigns, warranties, and sustainability reports.

### 2.2 User Classes and Characteristics

| User Class | Access Portal | Primary Responsibilities | 
| ----- | ----- | ----- | 
| **Individual Seller** | Seller Web Portal | Submits single-item sale requests, completes diagnostic checklists, chooses courier pickup or partner drop-off, accepts/rejects final price offers. | 
| **Corporate Seller** | Seller Web Portal (B2B) | Submits bulk liquidation requests with inventory manifests, coordinates batch furniture transport, reviews itemized or batch final offers. | 
| **Individual Buyer** | E-Commerce Storefront | Browses serialized products, pays via digital methods (Cards, Wallets, InstaPay), tracks orders, submits warranty claims. | 
| **Corporate Buyer** | E-Commerce Storefront (B2B) | Registers with tax credentials, requests bulk order quotes, receives tax-compliant invoices. | 
| **Courier / Partner Drop-off Agent** | Partner Logistics View | Confirms physical custody of small devices via QR/Tracking code at doorsteps or authorized partner drop-off locations. | 
| **Transport Team (Bulky)** | Partner Logistics View | Executes scheduled batch-pickup routes for pre-verified furniture and large appliances. | 
| **Partner Inspection Officer** | Partner Operations Portal | Conducts technical assessment, assigns condition grade, triggers mandatory data wipe verification, sets final acquisition price. | 
| **Partner Refurbishment Tech** | Partner Operations Portal | Logs repair tasks, requests internal spare parts, logs repair costs, closes refurbishment tickets. | 
| **Partner Dismantling Tech** | Partner Operations Portal | Dismantles irreparable items, registers harvested spare parts into inventory, logs remaining scrap weight. | 
| **Partner Warehouse Manager** | Partner Operations Portal | Manages serialized item intake, tracks storage locations, processes return shipments, records scrap handovers to recyclers. | 
| **Customer Service Agent** | Admin Dashboard | Manages buyer/seller inquiries, processes warranty claims and return authorizations. | 
| **Platform Manager (Admin)** | Admin Dashboard | Configures pricing rules, warranty policies, 30-60-90 day aging automation, customer segmentation campaigns, and views MIS reports. | 

### 2.3 Operating Environment

* **Client-Side:** Responsive web application compatible with modern desktop and mobile browsers (Chrome, Safari, Firefox, Edge).

* **Server-Side:** RESTful API backend architecture with relational database management system (RDBMS) supporting ACID transactions for inventory and financial tracking.

* **External Integrations:**

  * **Simulated Payment Service:** Internal simulation module (defined in FR-21 and Section 6.2) mimicking Bank Cards, Mobile Wallets, and InstaPay checkout flows; external payment gateways (e.g., Paymob, Fawry, Kashier) are supported as possible future replacements behind the same adapter interface.

  * **Simulated Notification Service:** Internal simulation module (defined in Section 6.2) that records OTPs, status updates, and final price offers in the database and displays them in the UI, with external SMS/email providers serving only as possible future replacements.

### 2.4 Design and Implementation Constraints

1. **Unique Item Serialization:** Unlike standard e-commerce platforms that manage stock solely by SKU quantities, every acquired item must be tracked as a **unique serialized instance** (`Item_Serial_ID`) with its own condition grade, inspection history, acquisition cost, refurbishment cost, and age counter.

2. **Cashless Operations:** Cash on Delivery (COD) is strictly prohibited. All buyer payments, seller payouts, and return-fee settlements are executed as simulated digital transactions recorded in the database, with no real funds transferred.

3. **Outsourced Physical Operations:** Physical warehousing, inspection, repair, and transport are executed by authorized partners using the platform's Partner Portal.

4. **Simulated External Services:** Payments, payouts, return-fee settlements, SMS, and email are simulated across the entire system. Wherever other sections mention payment, payout, notification, OTP, or email campaigns, they refer to the simulated services.

## 3. System Features and Functional Requirements

### 3.1 Module 1: User Authentication & Account Management

* **FR-01 (User Registration & Role Assignment) \[Must\]:** The system shall allow users to register as an Individual or a Company.

  * *Input:* Name, Email, Phone, Password, Account Type. For Companies: Commercial Registration Number, Tax ID, Company Address.

  * *Processing:* Validate uniqueness of email/phone and format of Tax ID.

  * *Output:* Account created with corresponding role permissions.

* **FR-02 (Role-Based Access Control - RBAC) \[Must\]:** The system shall restrict portal access based on assigned user roles (Buyer, Seller, Partner Warehouse, Technician, Admin).

### 3.2 Module 2: Sourcing, Diagnostic Pricing & Acquisition

* **FR-03 (Individual Sale Request & Diagnostic Questionnaire) \[Must\]:** The system shall allow sellers to submit an item for sale by selecting a category, uploading photos (minimum 3), and completing a category-specific mandatory diagnostic questionnaire (e.g., screen condition, battery health, repair history for electronics; structural integrity, fabric tear for furniture).

* **FR-04 (Automated Estimated Price Range Generation) \[Must\]:** Upon questionnaire submission, the system shall calculate and display a **non-binding estimated price range** (Min EGP – Max EGP) based on base model value and diagnostic deductions, accompanied by a mandatory legal disclaimer.

* **FR-05 (Corporate Bulk Sale Request) \[Must\]:** The system shall allow Corporate Sellers to submit bulk liquidation requests by either adding multiple line items or uploading a structured inventory sheet with representative photos.

### 3.3 Module 3: Logistics, Drop-off & Partner Warehouse Intake

* **FR-06 (Small Device Handover Selection) \[Must\]:** For small electronics, the system shall require the seller to select one of two handover methods after accepting the estimated price range:

  1. **Door-to-door Courier Pickup:** Seller selects address and time slot.

  2. **Authorized Partner Drop-off Location:** Seller selects a nearby partner hub from a map/list and receives a unique **Drop-off QR/Tracking Code**.

* **FR-07 (Custody Confirmation for Small Devices) \[Must\]:** The system shall record custody transfer when either the pickup courier confirms collection on their mobile view or the authorized drop-off partner scans/enters the seller's tracking code, updating status to `In_Transit_To_Warehouse` or `Received_At_Dropoff_Hub`.

* **FR-08 (Bulky Furniture Pre-Verification & Batch Routing) \[Must\]:** For bulky furniture/appliances, the system shall block vehicle dispatch until an admin/inspector approves a remote video verification or on-site pre-check. Approved requests shall be grouped by geographic zone into a **Batch Pickup Manifest** at zero upfront cost to the seller.

* **FR-09 (Serialized Warehouse Intake) \[Must\]:** Upon arrival at the partner warehouse, the Warehouse Manager shall confirm receipt, generating a unique system barcode (`Item_Serial_ID`) and setting the status to `Received_Pending_Inspection`.

### 3.4 Module 4: Technical Inspection, Data Wiping & Final Offer

* **FR-10 (Technical Inspection & Classification) \[Must\]:** The Inspection Officer shall log an inspection report for each `Item_Serial_ID`, classifying the item into one of three technical states:

  1. `Ready_For_Sale` (requires cleaning/grading only).

  2. `Repairable` (requires refurbishment).

  3. `Irreparable` (routed to dismantling).

* **FR-11 (Mandatory Data Wipe Certification) \[Must\]:** For all storage-bearing electronic devices, the system shall enforce a mandatory "Data Wipe Completed" checkbox and log generation (following NIST 800-88 standards) before the item can transition out of inspection. A digital **Data Destruction Certificate** shall be linked to the seller's request.

* **FR-12 (Final Price Offer & Seller Decision Workflow) \[Must\]:** Based on the inspection report, the officer sets the `Final_Purchase_Price`. The system notifies the seller and provides a 48-hour window to **Accept** or **Reject**:

  * **On Acceptance:** System triggers a digital payout order to the seller and transfers legal ownership of `Item_Serial_ID` to the platform.

  * **On Rejection:** System displays the calculated **Return Transport & Inspection Fee**, generates a `Return_To_Seller` logistics task, and locks release until fee settlement.

  * Seller notifications shall be dispatched through the Simulated Notification Service, the "digital payout order" shall be executed as a simulated payout recorded in the **`Payouts`** table, and the return-fee settlement shall be processed as a simulated payment recorded in the **`Return_Tasks`** table.

### 3.5 Module 5: Refurbishment, Dismantling & Recycling (Circular Engine)

* **FR-13 (Refurbishment Work Order Management) \[Must\]:** Items classified as `Repairable` shall automatically generate a Refurbishment Ticket. The Refurbishment Technician shall log labor descriptions, consumed spare parts, and total repair cost, and assign a final Condition Grade (`Grade A`, `Grade B`, or `Grade C`). An item cannot be listed on the store until its Refurbishment Ticket is marked `Closed`.

* **FR-14 (Dismantling & Spare Parts Harvesting) \[Must\]:** Items classified as `Irreparable` shall generate a Dismantling Ticket. The Dismantling Technician shall log extracted functional components (e.g., RAM, screens, power supplies, chair pistons) into a dedicated **Spare Parts Inventory**, linking each part's `Part_ID` to its parent `Item_Serial_ID`.

* **FR-15 (Internal Spare Parts Issuance) \[Should\]:** Refurbishment Technicians shall be able to request and consume harvested parts from the Spare Parts Inventory to repair other devices, automatically adjusting internal repair cost calculations.

* **FR-16 (Scrap Weight & Recycler Handover Tracking) \[Must\]:** Remaining non-usable material after dismantling shall be logged by weight (in kg) and material category (E-waste, Metal, Wood, Plastic). When sold to an external licensed Recycling Entity, the Warehouse Manager shall record the Batch ID, Entity Name, Total Weight (kg), Handover Date, and Revenue generated.

### 3.6 Module 6: E-Commerce Storefront, Automated Aging & B2B Quotes

* **FR-17 (Unit-Cost & Margin Calculation) \[Should\]:** Before listing an item, the system shall calculate the `Total_Unit_Cost` as:
  

  $$
  \text{Total\_Unit\_Cost} = \text{Final\_Purchase\_Price} + \text{Allocated\_Logistics\_Cost} + \text{Refurbishment\_Cost}
  $$

* **FR-18 (Serialized Storefront Catalog) \[Must\]:** The storefront shall display `Listed` items with actual photos, technical specs, assigned Condition Grade (`Grade A/B/C`), price, and category-specific warranty summary. Users can search and filter by Category, Price Range, and Condition Grade.

* **FR-19 (Automated 30–60–90 Day Inventory Aging Engine) \[Should\]:** A scheduled daily background job (Cron Job) shall evaluate `Days_Listed = Current_Date - Listing_Date` for all unsold items:

  * **Day 0 to 30:** Listed at `Target_Selling_Price`.

  * **Day 31 to 60:** Automatically apply a **20% markdown** to the listing price.

  * **Day 61 to 90:** Automatically adjust listing price to `Total_Unit_Cost` (Break-even clearance).

  * **Day 91+:** Automatically unlist item from the store, change status to `Decommissioned_Aged`, and generate a Dismantling Ticket to free up partner warehouse space.

* **FR-20 (Corporate Bulk Quote Request) \[Could\]:** Corporate Buyers shall be able to add multiple items to a "Quote Request" instead of standard checkout. The Platform Manager reviews the request, applies a custom B2B discount percentage, and sends a binding digital quote valid for 7 days.

### 3.7 Module 7: Digital Checkout, Payments & Warranty Management

* **FR-21 (Simulated Multi-Channel Payment Module) \[Must\]:** At checkout, the system shall provide an internal Payment Simulation Service that mimics a payment gateway for the three payment channels displayed in the UI:

  1. **Bank Cards** (Visa / Mastercard / Meeza).

  2. **Mobile Wallets** (Vodafone Cash, Orange Cash, etc.).

  3. **Instant Payment Network (InstaPay)**.

  * The simulator shall return a `SUCCESS` or `FAILED` outcome (allowing the tester or demo user to select the outcome via test card numbers or a scenario selector) and dispatch a simulated webhook to the same endpoint a real payment gateway would call. No real funds are transferred.

  * *Rule:* An order remains in `Pending_Payment` status and inventory is temporarily reserved for 15 minutes until the payment gateway webhook returns a `SUCCESS` status.

  * The result shall be recorded in the **`Orders`** table (`payment_method`, `payment_transaction_ref` as a simulated reference, and `payment_status`). The simulation module shall be implemented behind a clear payment gateway interface/adapter so that a real provider can replace it in the future without altering the checkout or order flow.

* **FR-22 (Automated Tax Invoicing) \[Must\]:** Upon successful payment, the system shall generate a downloadable PDF invoice. For Corporate Buyers, the invoice shall automatically include their registered Tax ID and Commercial Registration details.

* **FR-23 (Automated Category-Based Warranty Calculation) \[Must\]:** Each product category shall have a configured warranty duration (e.g., 90 days for Grade A Electronics, 30 days for Furniture). Upon order delivery confirmation, the system shall automatically calculate and record:
  

  $$
  \text{Warranty\_End\_Date} = \text{Delivery\_Date} + \text{Category\_Warranty\_Days}
  $$

* **FR-24 (Warranty Claim Submission) \[Should\]:** Buyers shall be able to submit a warranty claim from their order history only if $\text{Current\_Date} \le \text{Warranty\_End\_Date}$, routing the ticket to Customer Service and the Partner Technical Hub.

### 3.8 Module 8: Admin Management, Marketing & MIS Reporting

* **FR-25 (Customer Segmentation & Targeted Campaigns) \[Could\]:** The Admin Dashboard shall allow filtering registered buyers by segment (`Individual`, `Startup/Small Office`, `Large Enterprise`) and sending targeted promotional discount codes or email campaigns.

* **FR-26 (MIS & Sustainability Dashboard) \[Must\]:** The system shall generate real-time visual reports for the Platform Manager covering:

  1. **Financial KPIs:** Total revenue, average profit margin per item after transport/repair costs, seller offer acceptance rate.

  2. **Operational KPIs:** Inventory aging breakdown (0–30, 31–60, 61–90 days), average turnaround time from receipt to sale.

  3. **Environmental Impact KPIs:** Total weight (in kg) of e-waste and furniture diverted from landfills via refurbishment and licensed recycling handovers.

## 4. State Transition Matrix (Core Item Lifecycle)

Every item (`Item_Serial_ID`) must strictly follow these state transitions in the database:

| Current State | Trigger / Action | Next State | Responsible Role | 
| ----- | ----- | ----- | ----- | 
| `Submitted` | Seller accepts estimated price range | `Awaiting_Handover` | Seller | 
| `Awaiting_Handover` | Courier collects OR Partner Drop-off scans QR | `In_Transit_To_Warehouse` | Courier / Partner Hub | 
| `In_Transit_To_Warehouse` | Warehouse Manager logs physical arrival | `Received_Pending_Inspection` | Partner Warehouse Mgr | 
| `Received_Pending_Inspection` | Inspector logs report & sets Final Price | `Awaiting_Seller_Decision` | Partner Inspector | 
| `Awaiting_Seller_Decision` | Seller rejects Final Price & pays return fee | `Return_In_Progress` | Seller / Warehouse Mgr | 
| `Awaiting_Seller_Decision` | Seller accepts Final Price (Ready as-is) | `Listed_In_Store` | Seller / System | 
| `Awaiting_Seller_Decision` | Seller accepts Final Price (Needs repair) | `Under_Refurbishment` | Partner Refurb Tech | 
| `Awaiting_Seller_Decision` | Seller accepts Final Price (Irreparable) | `Pending_Dismantling` | Partner Dismantling Tech | 
| `Under_Refurbishment` | Tech closes repair ticket & assigns Grade | `Listed_In_Store` | Partner Refurb Tech | 
| `Listed_In_Store` | Buyer completes digital payment (simulated SUCCESS) | `Sold` | Buyer / Payment Simulation Service | 
| `Listed_In_Store` | Unsold for > 90 days (Automated Job) | `Pending_Dismantling` | System Cron Job | 
| `Pending_Dismantling` | Tech extracts spare parts & weighs scrap | `Scrap_Ready_For_Recycling` | Partner Dismantling Tech | 
| `Scrap_Ready_For_Recycling` | Warehouse logs handover to recycling entity | `Recycled_Closed` | Partner Warehouse Mgr | 

## 5. Logical Database Entities (Conceptual Data Model Preview)

To support the transition from SRS to ERD (Entity-Relationship Diagram), the database schema must include the following core tables:

 1. **`Users`**: `user_id`, `role`, `account_type` (Individual/Company), `name`, `email`, `phone`, `tax_id`, `commercial_reg`, `segment` (Individual/Startup/Enterprise), `company_address`, `created_at`.

 2. **`Categories`**: `category_id`, `name` (Electronics/Furniture), `parent_id`, `warranty_days`, `diagnostic_questions_json`, `is_bulky`, `requires_data_wipe`.

 3. **`Acquisition_Requests`**: `request_id`, `seller_id`, `submission_date`, `handover_method` (Courier / Partner_Dropoff / Batch_Truck), `dropoff_partner_id`, `status`, `request_type` (single/bulk), `manifest_id`, `tracking_code`, `pickup_address`, `pickup_slot`, `preverification_status`, `preverified_by`.

 4. **`Serialized_Items`**: `item_serial_id`, `request_id`, `category_id`, `estimated_min_price`, `estimated_max_price`, `final_purchase_price`, `logistics_cost`, `refurbishment_cost`, `selling_price`, `condition_grade` (A/B/C), `current_status`, `data_wiped_bool`, `listed_date`, `aging_tier`, `title`, `diagnostic_answers`, `barcode`, `weight_kg`, `target_selling_price`, `total_unit_cost` (calculated per FR-17), `seller_decision`, `offer_expires_at`, `created_at`.

 5. **`Inspection_Records`**: `inspection_id`, `item_serial_id`, `inspector_id`, `technical_classification`, `condition_notes`, `data_wipe_certificate_url`, `inspected_at`.

 6. **`Refurbishment_Logs`**: `refurb_id`, `item_serial_id`, `technician_id`, `work_description`, `labor_cost`, `parts_cost`, `closed_at`, `status` (open/closed), `final_grade`, `opened_at`.

 7. **`Spare_Parts_Inventory`**: `part_id`, `source_item_serial_id`, `part_name`, `category_id`, `status` (Available / Consumed), `consumed_in_refurb_id`, `internal_cost`.

 8. **`Recycling_Batches`**: `batch_id`, `recycler_entity_name`, `material_type`, `total_weight_kg`, `revenue_amount`, `handover_date`, `recorded_by`.

 9. **`Orders`**: `order_id`, `buyer_id`, `total_amount`, `payment_method` (Card / Wallet / InstaPay), `payment_transaction_ref`, `payment_status`, `invoice_url`, `created_at`, `quote_id`, `reserved_until`, `delivery_address`, `paid_at`.

10. **`Order_Items_Warranty`**: `order_item_id`, `order_id`, `item_serial_id`, `sold_price`, `delivery_date`, `warranty_end_date`.

11. **`Partner_Hubs`**: `hub_id`, `name`, `city`, `zone`, `address`, `is_dropoff`, `is_warehouse`.

12. **`Pickup_Manifests`**: `manifest_id`, `transport_user_id`, `zone`, `scheduled_date`, `status`.

13. **`Item_Photos`**: `photo_id`, `item_serial_id`, `url`, `photo_type` (seller/inspection/listing), `sort_order`.

14. **`Item_Status_History`**: `history_id`, `item_serial_id`, `changed_by`, `from_status`, `to_status`, `note`, `changed_at`.

15. **`Return_Tasks`**: `return_id`, `item_serial_id`, `fee_amount`, `fee_status` (pending/paid), `fee_payment_ref` (simulated), `status`, `created_at`.

16. **`Payouts`**: `payout_id`, `item_serial_id`, `seller_id`, `amount`, `status` (pending/paid), `payout_ref` (simulated), `created_at`.

17. **`Dismantling_Tickets`**: `dismantle_id`, `item_serial_id`, `technician_id`, `trigger` (irreparable/aged_out), `status` (open/closed), `created_at`, `closed_at`.

18. **`Scrap_Entries`**: `scrap_id`, `dismantle_id`, `batch_id` (nullable), `material_type` (E-waste/Metal/Wood/Plastic), `weight_kg`.

19. **`Payment_Events`**: `event_id`, `order_id`, `outcome` (SUCCESS/FAILED), `source` (simulator), `payload`, `created_at`.

20. **`Quote_Requests`**: `quote_id`, `buyer_id`, `status` (requested/quoted/accepted/expired), `discount_pct`, `valid_until`, `created_at`.

21. **`Quote_Items`**: `quote_item_id`, `quote_id`, `item_serial_id`.

22. **`Warranty_Claims`**: `claim_id`, `order_item_id`, `buyer_id`, `assigned_to`, `description`, `status` (open/in_review/resolved/rejected), `resolution_note`, `created_at`.

23. **`Notifications`**: `notification_id`, `recipient_id`, `channel` (sms/email), `type` (otp/status/price_offer), `message`, `status` (simulated), `created_at`.

## 6. External Interface Requirements

### 6.1 User Interfaces (UI)

* **Responsive Customer Web App:** Mobile-first design for sellers taking live photos of used devices on smartphones, and clean filterable catalog for buyers.

* **Partner Operations Interface:** Task-oriented dashboard optimized for barcode/QR scanning, quick checklist toggles for inspectors, and clear kanban/table views for refurbishment and dismantling queues.

* **Admin MIS Interface:** Data-heavy dashboard featuring tabular filters, aging alerts, and charts for financial and environmental KPIs.

### 6.2 Software Interfaces (APIs)

* **Simulated Payment Service:** Internal adapter-based simulation interface (as defined in FR-21) that mimics checkout authorization and asynchronous webhook callbacks (`SUCCESS` / `FAILED`) for Bank Cards, Mobile Wallets, and InstaPay without transferring real funds. The interface is designed so external gateways (e.g., Paymob / Fawry / Kashier) can replace the simulator in the future without modifying the core order flow.

* **Simulated Notification Service (SMS/Email):** Internal service where OTPs, status updates, and final price offers are written to a `notifications` table (`type`, `recipient`, `message`, `status`, `timestamp`) and displayed directly in the UI instead of being dispatched through external SMS or email providers.

* **Cloud Storage Service (e.g., AWS S3 / Cloudinary):** For storing seller-uploaded item condition photos, inspection images, and PDF tax invoices.

## 7. Non-Functional Requirements (NFRs)

* **NFR-01 (Security & Payment Compliance):** The system shall not collect, store, or log real bank card numbers or CVV codes in its database or logs, even in simulation—storing only the selected `payment_method` type and a simulated `payment_transaction_ref`. A production deployment would delegate all sensitive card handling to a PCI-DSS compliant payment gateway using secure tokens or hosted iframes.

* **NFR-02 (Auditability & Traceability):** Every state transition of an `Item_Serial_ID` (from intake to sale or recycling) shall be logged in an immutable `Item_Audit_Log` table with `timestamp`, `previous_state`, `new_state`, and `actor_user_id`.

* **NFR-03 (Performance):** Storefront catalog pages shall load within $\le 2.5\text{ seconds}$, and image uploads during seller requests shall support automatic client-side compression to handle up to 5 photos per item smoothly on mobile networks.

* **NFR-04 (Concurrency Control):** Because each refurbished item is a unique serialized instance (`Quantity = 1`), the database shall enforce pessimistic or optimistic locking during checkout so two buyers cannot simultaneously pay for the same `Item_Serial_ID`.

* **NFR-05 (Scalability & Modularity):** The system shall store diagnostic questionnaires as dynamic JSON schemas linked to categories, allowing administrators to add new electronics or furniture subcategories without altering database tables.