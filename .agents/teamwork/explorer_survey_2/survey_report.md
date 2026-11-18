# Requirement R2: Authentic Production UI & Academic Label Scrubbing
## Authoritative Codebase Investigation & Comprehensive Sanitization Inventory Report

**Author:** `explorer_survey_2` (UI Sanitization & Localization Explorer)  
**Date:** 2026-11-06  
**Workspace:** `d:\Mustadam Project`  
**Parent Agent:** `aa8e9444-643b-42e4-aaa4-cc5204480e27`  
**Reference Documents:** `ORIGINAL_REQUEST.md`, `AGENTS.md`, `PROJECT.md`, `ARCHITECTURE.md`, `DECISIONS.md`

---

## 1. Executive Summary

As part of the platform transition from a capstone graduation prototype to an authentic commercial circular re-commerce system ("Mustadama" / "مُستدام"), this investigation conducts an exhaustive audit of the entire codebase for **Requirement R2 (Authentic Production UI & Academic Label Scrubbing)**.

### Key Audit Findings:
1. **Total Files with Exposed Academic / Requirement Labels:** **10 files** across client components, layout localization files, document generation API endpoints, and server action validation returns.
2. **Total Exposed Academic Instances Identified:** **62 distinct occurrences** of requirement codes (`FR-01` through `FR-26`, `NFR-01`, `NFR-02`, `NFR-04`, `NFR-05`), spec citations (`SRS 6.2`), thesis project tags (`GRADUATION DEMO TOOLBAR`, `شريط عرض مشروع التخرج`), and database engine clauses (`FOR UPDATE NOWAIT`, `Pessimistic Checkout Lock`).
3. **Localization Architecture:** The platform uses `next-intl` with bilingual dictionary files (`messages/en.json`, `messages/ar.json`) alongside localized inline ternary patterns (`isAr ? ... : ...`) across client portal views. All 4 portals (`/seller`, `/partner`, `/store`, `/admin`) currently render prominent FR/NFR badges in headers, tabs, cards, form labels, and toast notifications.
4. **Zero Test Regressions:** Execution of `cmd /c npm test` (Vitest) verified that all **31 existing unit tests** in `tests/unit/` assert on underlying domain functions (`pricing-engine`, `aging-engine`, `state-machine`, `warranty-engine`, `rbac`), and do **not** assert on literal `"FR-XX"` strings in the DOM. Scrubbing these tags is completely safe and non-breaking for existing unit tests.
5. **RTL/LTR Directional Parity:** The styling strictly adheres to Tailwind CSS logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`) with `dir="rtl"` dynamically bound to `<html>` for Arabic and `dir="ltr"` for English. Numeric values, serial IDs (`MST-YYYY-NNNNN`), and currencies are isolated with `dir="ltr"` and `font-mono`.

---

## 2. Exhaustive File-by-File Inventory & Proposed Replacement Copy

Below is the complete catalog of all exposed tags, academic terminology, and specifications citations, paired with professional, authentic production-grade copy in both English (LTR) and Arabic (RTL).

---

### Category A: Localization Files (`messages/`)

#### 1. `messages/en.json` & 2. `messages/ar.json`

| Key / Location | Current English (`en.json`) | Current Arabic (`ar.json`) | Exposed Tag / Academic Issue | Proposed Production English (`en.json`) | Proposed Production Arabic (`ar.json`) | Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DemoToolbar.badge` (Line 29) | `"GRADUATION DEMO TOOLBAR"` | `"شريط عرض مشروع التخرج"` | Academic capstone thesis badge | `"ROLE SIMULATION"` | `"محاكي الأدوار"` | Professional dev/demo toolbar header for multi-persona simulation. |
| `DemoToolbar.subtitle` (Line 30) | `"1-Click Switch Across All 12 SRS Personas (8 Clean DB Roles)"` | `"تبديل فوري بين ١٢ شخصية في المواصفات (٨ أدوار قاعدة بيانات)"` | Academic SRS specification citation and DB architecture commentary | `"Instant switching across 12 user personas (8 system roles)"` | `"تبديل فوري بين ١٢ شخصية مستخدم (٨ أدوار للنظام)"` | Focuses on user testing and multi-role simulation without citing academic spec sheets. |
| `DemoToolbar.runAgingBtn` (Line 32) | `"Run 30-60-90d Aging & 7d Offer Auto-Reject"` | `"تشغيل تقادم المخزون (٣٠-٦٠-٩٠ يوم) والرفض التلقائي (٧ أيام)"` | Internal batch script jargon | `"Run Inventory Aging & Expired Offers Check"` | `"تشغيل دورة تقادم المخزون ومراجعة العروض المنتهية"` | Clear business operational trigger. |
| `DemoToolbar.agingJobSuccess` (Line 33) | `"Executed 30-60-90d Inventory Aging & 7d Offer Auto-Reject job."` | `"تم تنفيذ فحص تقادم المخزون (٩٠ يوماً) والرفض التلقائي للعروض المنتهية (٧ أيام)."` | Internal technical batch job log | `"Inventory aging evaluation and offer expiration checks completed successfully."` | `"تم فحص تقادم المخزون ومراجعة صلاحية عروض الشراء بنجاح."` | Authentic enterprise toast feedback. |
| `DemoToolbar.inboxTitle` (Line 35) | `"Simulated SMS & Email Notifications (SRS 6.2)"` | `"إشعارات الرسائل النصية والبريد المحاكاة (SRS 6.2)"` | Academic spec citation `(SRS 6.2)` | `"Simulated SMS & Email Notifications"` | `"إشعارات الرسائل النصية والبريد الإلكتروني التجريبية"` | Clean notification drawer title. |

---

### Category B: Seller Portal Component

#### 3. `src/components/seller/seller-portal-client.tsx`

| Line(s) | UI Element | Current Rendered Text | Exposed Code | Proposed Production English | Proposed Production Arabic | Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **250–251** | Portal Header `<h1>` | `isAr ? "بوابة البائع والتسعير الذكي (FR-03 — FR-12)" : "Seller Portal & Smart Valuation (FR-03 – FR-12)"` | `(FR-03 — FR-12)` | `"Seller Portal & Smart Valuation"` | `"بوابة البائع والتسعير الذكي"` | Removes requirement bracket codes while retaining portal purpose. |
| **270** | Tab 1 Button | `isAr ? "تقييم وبيع قطعة (FR-03)" : "Sell Single Item (FR-03)"` | `(FR-03)` | `"Sell Single Item"` | `"تقييم وبيع قطعة"` | Professional action label. |
| **281** | Tab 2 Button | `isAr ? "تصفية شركات بالجملة (FR-05)" : "Corporate Bulk (FR-05)"` | `(FR-05)` | `"Corporate Bulk Liquidation"` | `"تصفية شركات بالجملة"` | Full commercial term. |
| **294** | Tab 3 Button | `isAr ? `مقتنياتي والعروض (${myItems.length})` : `My Items & 7d Offers (${myItems.length})`` | `"7d Offers"` (informal abbreviation) | `My Items & Offers (${myItems.length})` | `مقتنياتي وعروض الشراء (${myItems.length})` | Clean commercial copy. |
| **319–320** | Section 1 `<h2>` | `isAr ? "١. بيانات القطعة والاستبيان الفني الديناميكي (NFR-05)" : "1. Item Details & Dynamic Diagnostic Questionnaire (NFR-05)"` | `(NFR-05)` | `"1. Item Details & Diagnostic Assessment"` | `"١. بيانات القطعة والاستبيان الفني"` | Clean consumer-facing diagnostic heading. |
| **438–439** | Section 2 `<h3>` | `isAr ? "٢. طريقة التسليم واللوجستيات (FR-06 / FR-08)" : "2. Handover & Logistics Selection (FR-06 / FR-08)"` | `(FR-06 / FR-08)` | `"2. Handover & Logistics Selection"` | `"٢. طريقة التسليم والخدمات اللوجستية"` | Removes requirement tag. |
| **445–446** | Bulky Furniture Banner | `isAr ? "قطعة أثاث ضخمة (FR-08): تخضع للمراجعة المسبقة للصور ويتم جدولتها ضمن شاحنة النقل المجمعة حسب المنطقة الجغرافية." : "Bulky Furniture Item (FR-08): Automatically routed to Pre-Verification & Zone Batch Truck collection."` | `(FR-08)` | `"Bulky Furniture Item: Routed to pre-verification and scheduled for zone-based batch truck collection."` | `"قطعة أثاث ضخمة: تخضع للمراجعة المسبقة للصور وتُجدول ضمن شاحنات النقل المجمعة حسب المنطقة الجغرافية."` | Commercial explanation of bulky logistics without requirement codes. |
| **557–558** | Valuation Card `<h3>` | `isAr ? "التقييم السعري المبدئي الفوري (FR-04)" : "Instant Initial Price Range (FR-04)"` | `(FR-04)` | `"Instant Estimated Price Range"` | `"التقييم السعري المبدئي الفوري"` | Authentic pricing card header. |
| **600–601** | Tab 2 Manifest `<h2>` | `isAr ? "طلبات التصفية بالجملة للشركات (FR-05)" : "Corporate Bulk Liquidation Manifest (FR-05)"` | `(FR-05)` | `"Corporate Bulk Liquidation Manifest"` | `"طلبات التصفية بالجملة للشركات"` | Removes requirement tag. |
| **611–613** | Account Switch Alert | `isAr ? "ملاحظة: هذه الميزة مخصصة لحسابات الشركات (٢. بائع شركات في شريط العرض بالأعلى)." : "Note: Switch to '2. Corporate Seller (B2B)' in the Graduation Demo Toolbar above to submit corporate bulk manifests."` | Academic `"Graduation Demo Toolbar"` | `"Note: Corporate liquidation is available exclusively to corporate accounts. Switch to 'Corporate Seller (B2B)' using the role switcher above."` | `"ملاحظة: هذه الميزة مخصصة لحسابات الشركات فقط (يمكنك التبديل إلى حساب بائع شركات عبر قائمة محاكاة الأدوار أعلاه)."` | Eliminates academic thesis wording; aligns with the new consolidated dropdown switcher. |
| **794–795** | Return Tasks `<h3>` | `isAr ? "مهام إرجاع القطع المرفوضة ورسوم الفحص والنقل (FR-12)" : "Rejected / Auto-Rejected Item Return Tasks & Fee Settlement (FR-12)"` | `(FR-12)` | `"Item Returns & Fee Settlement"` | `"مهام إرجاع القطع وتسوية رسوم النقل والفحص"` | Professional returns header. |

---

### Category C: Partner Operations Portal Component

#### 4. `src/components/partner/partner-portal-client.tsx`

| Line(s) | UI Element | Current Rendered Text | Exposed Code | Proposed Production English | Proposed Production Arabic | Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **172** | Toast Feedback | `` `Equal Batch Logistics Split applied (FR-08 / FR-17): ${JSON.stringify(res.result)}` `` | `(FR-08 / FR-17)` | `` `Batch logistics cost successfully allocated across ${res.result?.itemsCount ?? 0} items (${res.result?.allocatedCostPerItem ?? 0} EGP per item).` `` | `` `تم توزيع تكلفة النقل المجمع بنجاح على ${res.result?.itemsCount ?? 0} قطع (${res.result?.allocatedCostPerItem ?? 0} ج.م لكل قطعة).` `` | Human-readable business metrics instead of raw JSON dump and requirement IDs. |
| **305–306** | Portal Header `<h1>` | `isAr ? "بوابة عمليات الشركاء والمراكز الفنية (FR-06 — FR-16)" : "Partner Operations & Circular Technical Hub (FR-06 – FR-16)"` | `(FR-06 — FR-16)` | `"Partner Operations & Technical Hub"` | `"بوابة عمليات الشركاء والمراكز الفنية"` | Clean portal branding. |
| **315** | Tab 1 Button | `isAr ? "١. اللوجستيات والدفعات (FR-07/08)" : "1. Logistics & Batch Split (FR-07/08)"` | `(FR-07/08)` | `"1. Logistics & Shipped Batches"` | `"١. الخدمات اللوجستية والشحنات"` | Commercial operations tab label. |
| **316** | Tab 2 Button | `isAr ? "٢. استلام المستودع والباركود (FR-09)" : "2. Warehouse Intake (FR-09)"` | `(FR-09)` | `"2. Warehouse Intake & Barcode"` | `"٢. استلام المستودع والباركود"` | Standard warehouse terminology. |
| **317** | Tab 3 Button | `isAr ? "٣. الفحص ومسح البيانات (FR-10/11)" : "3. Inspection & NIST Wipe (FR-10/11)"` | `(FR-10/11)` | `"3. Technical Inspection & Data Sanitization"` | `"٣. الفحص الفني ومسح البيانات"` | Authentic technical testing terminology. |
| **318** | Tab 4 Button | `isAr ? "٤. التجديد وقطع الغيار (FR-13/15)" : "4. Refurbishment & Parts (FR-13/15)"` | `(FR-13/15)` | `"4. Refurbishment & Spare Parts"` | `"٤. التجديد وقطع الغيار"` | Clean workbench label. |
| **319** | Tab 5 Button | `isAr ? "٥. التفكيك وإعادة التدوير (FR-14/16)" : "5. Dismantling & Recycling (FR-14/16)"` | `(FR-14/16)` | `"5. Dismantling & Recycling"` | `"٥. التفكيك وإعادة التدوير"` | Clean dismantling label. |
| **363–364** | Tab 1 Section 1 `<h2>` | `isAr ? "استلام المندوب ونقاط التسليم (FR-07)" : "Courier Pickup & Partner Drop-off Custody (FR-07)"` | `(FR-07)` | `"Courier Pickup & Drop-Off Intake"` | `"استلام المندوب ونقاط التسليم"` | Standard custody transfer title. |
| **420–421** | Tab 1 Section 2 `<h2>` | `isAr ? "توزيع تكلفة النقل المجمع بالتساوي (FR-08 & FR-17)" : "Bulky Batch Manifest Equal Logistics Cost Split (FR-08 & FR-17)"` | `(FR-08 & FR-17)` | `"Bulky Batch Logistics Cost Allocation"` | `"توزيع تكلفة النقل المجمع للشحنات الضخمة"` | Clear accounting label without spec tags. |
| **475–476** | Tab 2 Section `<h2>` | `isAr ? "استلام المستودع المركزي وإصدار السيريال/الباركود الفريد (FR-09)" : "Warehouse Intake & Unique Serial Barcode Generation (FR-09)"` | `(FR-09)` | `"Warehouse Intake & Unique Barcode Generation"` | `"استلام المستودع المركزي وإصدار باركود التتبع الفريد"` | Removes spec ID. |
| **513–514** | Tab 3 Section `<h2>` | `Technical Inspection, Mandatory NIST 800-88 Data Wipe Gate & 7-Day Final Offer (FR-10 – FR-12)` | `(FR-10 – FR-12)` | `"Technical Inspection, Data Sanitization & 7-Day Final Offer"` | `"الفحص الفني، مسح البيانات المعتمد، وإصدار العرض النهائي (صالح لمدة ٧ أيام)"` | Clean engineering heading. |
| **550** | Inspection Form Label | `"Technical Classification (FR-10)"` | `(FR-10)` | `"Technical Classification"` | `"التصنيف الفني"` | Field label cleanup. |
| **581** | Offer Price Label | `"Final Purchase Offer Price (EGP) (FR-12)"` | `(FR-12)` | `"Final Purchase Offer Price (EGP)"` | `"سعر عرض الشراء النهائي (جنيه)"` | Field label cleanup. |
| **604** | Wipe Checkbox Label | `Confirm NIST 800-88 Data Destruction & Issue Certificate (Mandatory Gate FR-11)` | `(Mandatory Gate FR-11)` | `"Confirm NIST 800-88 Data Destruction & Issue Certificate (Required for Resale)"` | `"تأكيد مسح البيانات وفق معيار NIST 800-88 وإصدار الشهادة (إلزامي للبيع)"` | Retains the NIST standard while eliminating requirement gate syntax. |
| **644–645** | Tab 4 Section `<h2>` | `isAr ? "بوابة فني التجديد واستهلاك قطع الغيار المستخرجة (FR-13 & FR-15)" : "Refurbishment Workbench & Harvested Spare Parts Cost Rollup (FR-13, FR-15, FR-17)"` | `(FR-13 & FR-15)`, `(FR-13, FR-15, FR-17)` | `"Refurbishment Workbench & Spare Parts Inventory"` | `"منصة التجديد وإدارة قطع الغيار المستخرجة"` | Professional workshop heading. |
| **671** | Parts Select Label | `"Consume Harvested Part (FR-15)"` | `(FR-15)` | `"Install Harvested Spare Part"` | `"تركيب قطعة غيار مستخرجة"` | Clear action description. |
| **770–771** | Tab 5 Section `<h2>` | `isAr ? "تفكيك القطع غير القابلة للإصلاح أو المتقادمة (>٩٠ يوماً Decommissioned_Aged) واستخراج قطع الغيار (FR-14)" : "Dismantling Workbench (Pending_Dismantling & Decommissioned_Aged) & Spare Parts Harvesting (FR-14, FR-19)"` | `(FR-14)`, `(FR-14, FR-19)` | `"Dismantling Workbench & Spare Parts Harvesting"` | `"منصة التفكيك للقطع غير القابلة للإصلاح واستخراج قطع الغيار"` | Clean circular economy terminology. |
| **795** | Estimated Cost Label | `"Part Estimated Cost (EGP) (FR-14)"` | `(FR-14)` | `"Part Estimated Value (EGP)"` | `"القيمة التقديرية للقطعة (جنيه)"` | Accurate accounting label. |
| **904** | Recycler Handover Note | ``Transitions all ready scrap items to terminal state <code className="font-mono">Recycled_Closed</code> (FR-16).`` | `(FR-16)` | ``Transfers certified scrap materials to licensed recycling facilities for final processing.`` | ``توثيق تسليم المواد والمخلفات إلى مصانع إعادة التدوير المرخصة والمعتمدة.`` | Authentic environmental compliance description. |

---

### Category D: Storefront & Re-Commerce Portal Component

#### 5. `src/components/store/storefront-client.tsx`

| Line(s) | UI Element | Current Rendered Text | Exposed Code | Proposed Production English | Proposed Production Arabic | Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **131** | Checkout Lock Toast | `` `15-Minute Pessimistic Checkout Lock acquired (NFR-04)! Order ${res.orderId!.slice(0, 8)} reserved until ${new Date(res.reservedUntil!).toLocaleTimeString()}.` `` | `(NFR-04)!` & DB locking jargon (`Pessimistic Checkout Lock`) | `` `Order #${res.orderId!.slice(0, 8)} reserved! Complete payment within 15 minutes (until ${new Date(res.reservedUntil!).toLocaleTimeString()}) to secure your items.` `` | `` `تم حجز الطلب #${res.orderId!.slice(0, 8)}! يرجى إتمام الدفع خلال ١٥ دقيقة (حتى ${new Date(res.reservedUntil!).toLocaleTimeString()}) لتأكيد الشراء.` `` | Converts DB locking terminology into customer-friendly checkout reservation notice. |
| **184** | Delivery Confirm Toast | `` `Delivery confirmed (${res.deliveryDate})! Automated Warranty active until ${res.warrantyEndDate} (FR-23).` `` | `(FR-23)` | `` `Delivery confirmed (${res.deliveryDate})! Your warranty is active until ${res.warrantyEndDate}.` `` | `` `تم تأكيد الاستلام (${res.deliveryDate})! الضمان سارٍ حتى ${res.warrantyEndDate}.` `` | Clean customer assurance notice. |
| **204** | Claim Toast | `"Warranty claim submitted and routed to Customer Service (FR-24)!"` | `(FR-24)` | `"Warranty claim submitted successfully! Our support team will review your request shortly."` | `"تم تقديم طلب الضمان بنجاح! سيقوم فريق خدمة العملاء بمراجعته والتواصل معك."` | Authentic customer service response. |
| **216–217** | Store Header `<h1>` | `isAr ? "متجر القطع المجددة بالسيريال والدفع المحاكي (FR-17 — FR-24)" : "Serialized Re-Commerce Storefront & Checkout (FR-17 – FR-24)"` | `(FR-17 — FR-24)` | `"Certified Pre-Owned & Refurbished Store"` | `"متجر الأجهزة والقطع المجددة المعتمدة"` | E-commerce storefront title. |
| **221–222** | Store Subtitle `<p>` | `isAr ? "كل قطعة معروضة هي وحدة فريدة (Quantity = 1) مع حجز ذري لمدة ١٥ دقيقة عند الدفع (NFR-04)." : "Every listing is a unique serialized unit (Quantity = 1) with atomic 15-minute checkout locking (NFR-04)."` | `(NFR-04)` & technical jargon (`atomic 15-minute checkout locking`) | `"Every product is an individually verified, serialized unit with a 15-minute checkout reservation hold."` | `"كل منتج معروض هو قطعة فريدة مفحوصة وموثقة برقم تسلسلي، مع حجز مؤقت لمدة ١٥ دقيقة أثناء إتمام الدفع."` | Explains item-level uniqueness clearly to consumers. |
| **398–399** | Checkout Card `<h2>` | `isAr ? "الحجز الذري (١٥ دقيقة) وبوابة الدفع المحاكاة (FR-21 / NFR-01)" : "15-Min Atomic Reservation & PCI-Safe Payment Simulator (FR-21)"` | `(FR-21 / NFR-01)`, `(FR-21)` | `"Checkout & Electronic Payment"` | `"إتمام الطلب وبوابة الدفع الإلكتروني"` | Clean checkout header. |
| **403–405** | Checkout Note `<p>` | `Selected Serialized Units: <strong>{selectedIds.length}</strong> (No Cash on Delivery per FR-21; No card PAN/CVV stored per NFR-01).` | `per FR-21`, `per NFR-01` | `Selected Items: <strong>{selectedIds.length}</strong> (Electronic payment required; Cash on Delivery is not supported).` | `القطع المحددة: <strong>{selectedIds.length}</strong> (الدفع إلكتروني آمن؛ الدفع عند الاستلام غير متاح).` | Explains payment policy without citing non-functional requirement codes. |
| **454–455** | Reservation Button | `isAr ? "١. قفل القطع وحجز الطلب لمدة ١٥ دقيقة (FOR UPDATE NOWAIT)" : "1. Lock Serialized Items & Reserve Order (15-Min Timer)"` | `(FOR UPDATE NOWAIT)` SQL clause | `"1. Reserve Items & Proceed to Payment"` | `"١. حجز المنتجات وإتمام الدفع (١٥ دقيقة)"` | Replaces raw SQL lock clause with user action. |
| **466–467** | Bulk Quote Button | `isAr ? "طلب عرض سعر جملة للشركات (FR-20)" : "Request Corporate B2B Bulk Quote (FR-20)"` | `(FR-20)` | `"Request Corporate Bulk Quote"` | `"طلب عرض أسعار للشركات (B2B)"` | Clean B2B action. |
| **489** | Payment Simulator Label | `"Simulated Webhook Scenario Outcome (FR-21):"` | `(FR-21)` | `"Simulated Payment Outcome:"` | `"نتيجة الدفع المحاكية:"` | Clean label for developer demo simulator. |
| **557** | Invoice Link Button | `"📄 Download Tax Invoice (FR-22)"` | `(FR-22)` | `"📄 Download Tax Invoice"` | `"📄 تحميل الفاتورة الضريبية"` | Standard invoice action. |
| **589** | Delivery Button | `"Confirm Delivery & Start Warranty (FR-23)"` | `(FR-23)` | `"Confirm Delivery & Activate Warranty"` | `"تأكيد الاستلام وتفعيل الضمان"` | Standard order delivery confirmation. |
| **608** | Claim Button | `"File Warranty Claim (FR-24)"` | `(FR-24)` | `"Submit Warranty Claim"` | `"تقديم طلب ضمان"` | Standard warranty claim action. |
| **625** | Quotes Tab `<h2>` | `"Corporate Bulk Quote Requests (FR-20)"` | `(FR-20)` | `"Corporate Bulk Quote Requests"` | `"طلبات عروض الأسعار للشركات"` | Clean B2B management title. |

---

### Category E: Admin Control Center & MIS Component

#### 6. `src/components/admin/admin-portal-client.tsx`

| Line(s) | UI Element | Current Rendered Text | Exposed Code | Proposed Production English | Proposed Production Arabic | Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **117** | Dynamic Cat Toast | `` `Dynamic Category "${catName}" created without code deployment (NFR-05)!` `` | `(NFR-05)!` | `` `Category "${catName}" and diagnostic assessment schema published successfully!` `` | `` `تم نشر فئة "${catName}" واستبيان الفحص الفني بنجاح!` `` | Authentic CMS confirmation. |
| **143** | Campaign Toast | `` `Targeted campaign dispatched to ${res.sentCount} "${segment}" recipients via ${campaignChannel} (FR-25)!` `` | `(FR-25)!` | `` `Targeted campaign dispatched to ${res.sentCount} "${segment}" recipients via ${campaignChannel.toUpperCase()}.` `` | `` `تم إرسال الحملة الترويجية بنجاح إلى ${res.sentCount} من عملاء شريحة "${segment}" عبر ${campaignChannel.toUpperCase()}.` `` | Clean marketing broadcast message. |
| **187–188** | Admin Header `<h1>` | `isAr ? "لوحة معلومات الإدارة ومؤشرات الاستدامة (MIS & Sustainability — FR-25 / FR-26)" : "Admin Control Center, MIS & Sustainability Dashboard (FR-25 / FR-26)"` | `(FR-25 / FR-26)` | `"Admin Control Center & Sustainability Dashboard"` | `"لوحة تحكم الإدارة ومؤشرات الأداء والاستدامة"` | Clean executive dashboard title. |
| **197** | Tab 1 Button | `isAr ? "١. مؤشرات الأداء والاستدامة (FR-26)" : "1. MIS & Sustainability KPIs (FR-26)"` | `(FR-26)` | `"1. Platform KPIs & Sustainability"` | `"١. مؤشرات الأداء والاستدامة"` | Removes requirement tag. |
| **198** | Tab 2 Button | `isAr ? "٢. الفئات والاستبيان الديناميكي (NFR-05)" : "2. Dynamic Categories (NFR-05)"` | `(NFR-05)` | `"2. Categories & Diagnostic Schemas"` | `"٢. إدارة الفئات والاستبيانات الفنية"` | Removes non-functional tag. |
| **199** | Tab 3 Button | `isAr ? "٣. شرائح العملاء والحملات (FR-25)" : "3. Segment Campaigns (FR-25)"` | `(FR-25)` | `"3. Customer Segments & Campaigns"` | `"٣. شرائح العملاء والحملات الترويجية"` | Removes requirement tag. |
| **267–268** | KPI Card 2 Label | `isAr ? "متوسط هامش الربح للقطعة (FR-17)" : "Avg Profit Margin / Unit (FR-17)"` | `(FR-17)` | `"Avg Profit Margin / Unit"` | `"متوسط هامش الربح للقطعة"` | Removes requirement tag. |
| **284** | KPI Card 3 Label | `"نسبة قبول عروض البائعين (FR-12)"` (AR) | `(FR-12)` | `"Seller Offer Acceptance Rate"` | `"نسبة قبول عروض البائعين"` | Harmonizes EN and AR KPI cards. |
| **301** | KPI Card 4 Label | `"الأثر البيئي: النفايات المنقذة (FR-26)"` (AR) | `(FR-26)` | `"Environmental Impact: Landfill Diversion"` | `"الأثر البيئي: النفايات المنقذة من المكبات"` | Professional ESG metric title. |
| **321–322** | Aging Title `<h2>` | `isAr ? "توزيع تقادم المخزون (٣٠ — ٦٠ — ٩٠+ يوماً — FR-19)" : "30–60–90+ Day Inventory Aging & Decommissioned_Aged Breakdown (FR-19)"` | `(FR-19)` | `"Inventory Aging & Lifecycle Breakdown"` | `"توزيع تقادم المخزون ودورة التسعير التدريجي"` | Clean supply-chain metric heading. |
| **325–326** | Audit Log Label | `Immutable Audit Log Entries (NFR-02): <strong>{kpis.totalAuditLogEntries}</strong>` | `(NFR-02)` | `Lifecycle Audit Log Entries: <strong>{kpis.totalAuditLogEntries}</strong>` | `سجلات تدقيق دورة الحياة: <strong>{kpis.totalAuditLogEntries}</strong>` | Standard audit log label. |
| **374** | Category Form `<h2>` | `"Add Dynamic Category & Diagnostic JSON Schema (NFR-05)"` | `(NFR-05)` | `"Add Category & Diagnostic Schema"` | `"إضافة فئة جديدة واستبيان تشخيصي"` | Clean form heading. |
| **416** | Warranty Field Label | `"Warranty Days (FR-23)"` | `(FR-23)` | `"Standard Warranty (Days)"` | `"فترة الضمان القياسية (أيام)"` | Standard setting label. |
| **443** | NIST Wipe Checkbox | `"Requires NIST 800-88 Data Wipe (FR-11)"` | `(FR-11)` | `"Requires NIST 800-88 Data Sanitization"` | `"تتطلب مسح البيانات المعتمد (NIST 800-88)"` | Retains cybersecurity standard without requirement code. |
| **506** | Campaigns Tab `<h2>` | `"Customer Segmentation & Promotional Campaigns (FR-25)"` | `(FR-25)` | `"Customer Segmentation & Promotional Campaigns"` | `"الحملات الترويجية الموجهة حسب شرائح العملاء"` | Clean marketing heading. |
| **575** | Quotes Tab `<h2>` | `"Corporate Bulk Quote Approval (FR-20)"` | `(FR-20)` | `"Corporate Bulk Quote Approval"` | `"مراجعة واعتماد عروض الأسعار للشركات"` | Clean B2B approval heading. |
| **621** | Warranty Tab `<h2>` | `"Customer Service Warranty Claims Queue (FR-24)"` | `(FR-24)` | `"Customer Service Warranty Claims Queue"` | `"قائمة مطالبات الضمان وخدمة العملاء"` | Clean customer service heading. |

---

### Category F: Document Generation API Endpoints (Printable PDF / HTML)

#### 7. `src/app/api/documents/invoice/[id]/route.ts`

| Line | Document HTML Element | Current Rendered String | Exposed Tag | Proposed Production Replacement | Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **45** | Invoice Title `<h1>` | `<h1>MUSTADAMA ("مُستدام") — OFFICIAL TAX INVOICE (FR-22)</h1>` | `(FR-22)` | `<h1>MUSTADAMA ("مُستدام") — OFFICIAL TAX INVOICE</h1>` | Tax invoices are legal accounting documents; statutory invoices must never contain internal software requirement tags. |
| **70** | Warranty Column Fallback `<td>` | `<td>${oi.warranty_end_date ?? "Calculated Upon Delivery (FR-23)"}</td>` | `(FR-23)` | `<td>${oi.warranty_end_date ?? "Active upon delivery confirmation"}</td>` | Clear, professional customer invoice statement. |

#### 8. `src/app/api/documents/certificate/[id]/route.ts`

| Line | Certificate HTML Element | Current Rendered String | Exposed Tag | Proposed Production Replacement | Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **35** | Standard Compliance Badge `<span>` | `<span class="badge">NIST SP 800-88 Rev. 1 COMPLIANT (FR-11)</span>` | `(FR-11)` | `<span class="badge">NIST SP 800-88 Rev. 1 CERTIFIED</span>` | An official certificate of destruction given to enterprise customers must cite the NIST SP 800-88 cybersecurity standard, but not the university software spec requirement code. |

---

### Category G: Server Action Validation Error Returns

#### 9. `src/lib/domain/seller-actions.ts`

| Line | Returned Error Object | Current Verbatim Message | Exposed Tag | Proposed Production Replacement | Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **34** | Photo Upload Validation | `error: "Please provide between 3 and 5 condition photos (FR-03)."` | `(FR-03)` | `error: "Please provide between 3 and 5 clear photos showing item condition."` | Direct feedback shown to users in error banners. |
| **159** | Account Type Restriction | `error: "Corporate Bulk Liquidation is restricted to Company accounts (FR-05)."` | `(FR-05)` | `error: "Corporate bulk liquidation requests are restricted to registered company accounts."` | Clean authorization error message. |

#### 10. `src/lib/domain/store-actions.ts`

| Line | Returned Error Object | Current Verbatim Message | Exposed Tag | Proposed Production Replacement | Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **128** | B2B Buyer Validation | `error: "Bulk Quote Requests are restricted to Corporate Buyers (FR-20)."` | `(FR-20)` | `error: "Bulk quote requests are restricted to registered corporate accounts."` | Clean B2B authorization error message. |
| **228** | Warranty Validity Check | `error: "Warranty period has expired or delivery is not yet confirmed (FR-24)."` | `(FR-24)` | `error: "Warranty claim cannot be processed: the warranty period has expired or delivery has not been confirmed."` | Clear customer-facing reason. |

---

## 3. Directional Parity (RTL/LTR) & Layout Styling Inspection

A comprehensive analysis of layout directionality and styling rules was conducted across all pages and components:

### 1. Zero Physical Directional Classes
- Grep scan for physical Tailwind directional classes (`ml-*`, `mr-*`, `pl-*`, `pr-*`, `text-left`, `text-right`, `left-*`, `right-*`) across `src/` returned **zero instances**.
- The entire project correctly uses Tailwind CSS logical utilities:
  - Margins: `ms-*` (margin-inline-start), `me-*` (margin-inline-end)
  - Paddings: `ps-*` (padding-inline-start), `pe-*` (padding-inline-end)
  - Text alignment: `text-start`, `text-end`

### 2. Bidirectional Data Isolation
- Serial numbers (e.g. `MST-2026-00042`), UUIDs, monetary amounts, phone numbers (`+201000000000`), and dates are properly wrapped with:
  ```tsx
  <span dir="ltr" className="font-mono">...</span>
  ```
  or marked with the `.ltr-data` utility (`src/app/globals.css:33-37`):
  ```css
  .ltr-data {
    direction: ltr;
    unicode-bidi: isolate;
    font-variant-numeric: tabular-nums;
  }
  ```
- This prevents numeric and Latin character inversion when rendering Arabic text (e.g., ensuring `EGP 12,000` or `12,000 ج.م` displays cleanly in RTL without inverted dashes or brackets).

### 3. Font Family Hierarchy
- In `src/app/globals.css`, Arabic text is prioritized with Cairo:
  ```css
  html[lang="ar"] body {
    font-family: var(--font-cairo), var(--font-inter), system-ui, sans-serif;
  }
  ```
  while English uses Inter first (`var(--font-inter)`).

---

## 4. Impact Analysis & Implementation Guardrails

### 1. Existing Unit Tests (`tests/unit/`)
- All 31 tests in `tests/unit/` (`pricing.test.ts`, `aging.test.ts`, `rbac.test.ts`, `domain-engines.test.ts`, `graduation-demo-scenarios.test.ts`, `messages-parity.test.ts`, `routing.test.ts`) were executed and passed in 616ms.
- **Verification Result:** None of the unit tests assert on UI DOM elements or match on `"FR-"` substrings in HTML. Modifying the 10 files in the inventory will not cause any unit test regressions.
- **Key Requirement:** When modifying `messages/en.json` and `messages/ar.json`, both files must maintain exact key-set symmetry to satisfy `tests/unit/messages-parity.test.ts`.

### 2. Playwright End-to-End Tests (Requirement R4)
- When implementing Playwright test scenarios (under Requirement R4), tests should locate elements by:
  - Accessible roles and robust labels: e.g. `page.getByRole('button', { name: /sell single item|تقييم وبيع/i })`
  - Explicit test attributes: `data-testid="sell-single-item-tab"`
  - Avoid brittle selectors that match on raw requirement IDs like `button:has-text('FR-03')`.

### 3. Business Requirement Integrity
- Scrubbing visible requirement labels does **not** alter any underlying business formulas or state transitions:
  - 7-day (168-hour) Auto-Reject window (`FR-12`) remains enforced in `pricing-engine.ts` and `state-machine.ts`.
  - 30-60-90 day aging cascade and `Decommissioned_Aged` state (`FR-19`) remain intact in `aging-engine.ts`.
  - Equal batch logistics split (`FR-08` / `FR-17`) remains computed by `calculateAllocatedBatchLogisticsCost`.
  - Mandatory NIST 800-88 data destruction checkbox (`FR-11`) remains an enforced operational gate in `partner-actions.ts`.

---

## 5. Recommended Implementation Steps for the Implementer

1. **Step 1 (Localization Files):** Update `messages/en.json` and `messages/ar.json` with the scrubbed `DemoToolbar` entries. Run `cmd /c npm test` to verify message parity.
2. **Step 2 (Seller Portal):** Replace exposed tags in `src/components/seller/seller-portal-client.tsx` (11 entries).
3. **Step 3 (Partner Portal):** Replace exposed tags in `src/components/partner/partner-portal-client.tsx` (19 entries).
4. **Step 4 (Storefront Portal):** Replace exposed tags in `src/components/store/storefront-client.tsx` (14 entries).
5. **Step 5 (Admin Portal):** Replace exposed tags in `src/components/admin/admin-portal-client.tsx` (17 entries).
6. **Step 6 (Document API Routes):** Clean invoice and certificate headers in `src/app/api/documents/invoice/[id]/route.ts` and `src/app/api/documents/certificate/[id]/route.ts`.
7. **Step 7 (Domain Action Error Returns):** Remove requirement tags from validation errors in `src/lib/domain/seller-actions.ts` and `src/lib/domain/store-actions.ts`.
8. **Step 8 (Regression Verification):** Run `cmd /c npm test` and inspect rendered pages in both English (`/en/...`) and Arabic (`/ar/...`) to ensure perfect visual presentation and zero exposed requirement tags.
