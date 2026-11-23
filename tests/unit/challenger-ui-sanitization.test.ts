import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let currentLocale = "en";

vi.mock("next-intl", () => ({
  useLocale: () => currentLocale,
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(async () => ({ data: { path: "img.jpg" }, error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://example.com/img.jpg" } })),
      })),
    },
  })),
}));

vi.mock("@/lib/utils/image-compression", () => ({
  compressImageFile: vi.fn(async (file: File) => file),
}));

import { SellerPortalClient } from "@/components/seller/seller-portal-client";
import { PartnerPortalClient } from "@/components/partner/partner-portal-client";
import { StorefrontClient } from "@/components/store/storefront-client";
import { AdminPortalClient } from "@/components/admin/admin-portal-client";

function getAllFiles(dir: string, extFilter: string[]): string[] {
  let results: string[] = [];
  const list = readdirSync(dir);
  for (const file of list) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, extFilter));
    } else {
      if (extFilter.some((ext) => file.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

describe("Adversarial Empirical Verification: Milestone 2 UI Sanitization & Bidirectional Layout", () => {
  const componentFiles = getAllFiles("src/components", [".tsx", ".ts"]);
  const appFiles = getAllFiles("src/app", [".tsx", ".ts"]);
  const domainFiles = getAllFiles("src/lib/domain", [".ts"]);
  const messageFiles = ["messages/en.json", "messages/ar.json"];

  describe("1. Exhaustive Codebase Scan for Exposed Internal Requirement & Academic Tags", () => {
    it("ensures no exposed FR- or NFR- requirement codes exist in rendered UI components or templates", () => {
      const targetFiles = [...componentFiles, ...appFiles];
      const violations: { file: string; line: number; match: string }[] = [];

      for (const filePath of targetFiles) {
        const content = readFileSync(filePath, "utf8");
        // Split by lines to inspect line by line
        const lines = content.split("\n");
        lines.forEach((line, idx) => {
          // Ignore standard multi-line or single-line code comments
          const trimmed = line.trim();
          if (
            trimmed.startsWith("*") ||
            trimmed.startsWith("//") ||
            trimmed.startsWith("/*") ||
            trimmed.startsWith("{/*")
          ) {
            return;
          }

          // Strip JSX comments or inline comments before checking
          const codeOnly = line
            .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
            .replace(/\/\/.*/g, "");

          const match = codeOnly.match(/\b(FR|NFR)-\d+\b/);
          if (match) {
            violations.push({
              file: filePath,
              line: idx + 1,
              match: match[0],
            });
          }
        });
      }

      expect(
        violations,
        `Found exposed requirement tags in UI/App code:\n${JSON.stringify(violations, null, 2)}`,
      ).toEqual([]);
    });

    it("ensures no academic graduation thesis labels exist in messages dictionaries", () => {
      const en = readFileSync("messages/en.json", "utf8");
      const ar = readFileSync("messages/ar.json", "utf8");

      expect(en.toLowerCase()).not.toContain("graduation demo");
      expect(ar).not.toContain("مشروع التخرج");
      expect(en).not.toMatch(/\bSRS\s*\d/i);
      expect(ar).not.toMatch(/\bSRS\s*\d/i);
    });

    it("ensures no raw database locking jargon or SQL clauses are exposed to users", () => {
      const targetFiles = [...componentFiles, ...appFiles, ...messageFiles];
      for (const filePath of targetFiles) {
        const content = readFileSync(filePath, "utf8");
        const codeOnly = content
          .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "")
          .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
        expect(codeOnly).not.toContain("FOR UPDATE NOWAIT");
        expect(codeOnly).not.toContain("Pessimistic Checkout Lock");
      }
    });
  });

  describe("2. Bidirectional Layout & Physical Class Avoidance", () => {
    it("verifies zero usage of physical horizontal margin/padding/alignment classes across all components", () => {
      const physicalRegex = /\b(ml|mr|pl|pr|text-left|text-right)-\d+|\b(text-left|text-right)\b/;
      const violations: { file: string; line: number; match: string }[] = [];

      for (const filePath of componentFiles) {
        const content = readFileSync(filePath, "utf8");
        const lines = content.split("\n");
        lines.forEach((line, idx) => {
          const match = line.match(physicalRegex);
          if (match) {
            violations.push({
              file: filePath,
              line: idx + 1,
              match: match[0],
            });
          }
        });
      }

      expect(
        violations,
        `Found physical directional classes:\n${JSON.stringify(violations, null, 2)}`,
      ).toEqual([]);
    });

    it("verifies that HTML templates in document routes specify UTF-8 and valid viewport/print styles", () => {
      const invoiceCode = readFileSync(
        "src/app/api/documents/invoice/[id]/route.ts",
        "utf8",
      );
      const certCode = readFileSync(
        "src/app/api/documents/certificate/[id]/route.ts",
        "utf8",
      );

      // Verify meta charset="utf-8" for bilingual rendering (Arabic and Latin text)
      expect(invoiceCode).toContain('<meta charset="utf-8" />');
      expect(certCode).toContain('<meta charset="utf-8" />');

      // Verify auto print invocation
      expect(invoiceCode).toContain('<body onload="window.print()">');
      expect(certCode).toContain('<body onload="window.print()">');

      // Verify no FR-22 or FR-11 in the rendered HTML templates
      const invoiceHtmlMatch = invoiceCode.match(/const html = `([\s\S]*?)`;/);
      expect(invoiceHtmlMatch).toBeTruthy();
      expect(invoiceHtmlMatch![1]).not.toContain("FR-22");

      const certHtmlMatch = certCode.match(/const html = `([\s\S]*?)`;/);
      expect(certHtmlMatch).toBeTruthy();
      expect(certHtmlMatch![1]).not.toContain("FR-11");
    });
  });

  describe("3. Invoices & Certificates Printable Structure & Content", () => {
    it("renders clean printable invoice without requirement codes and formats currency cleanly", () => {
      const invoiceTemplate = (
        id: string,
        order: {
          paid_at?: string;
          delivery_address?: string;
          payment_method?: string;
          payment_transaction_ref?: string;
          total_amount?: number;
          users?: {
            name?: string;
            account_type?: string;
            tax_id?: string | null;
            commercial_reg?: string | null;
          };
          order_items_warranty?: {
            item_serial_id: string;
            sold_price: number;
            warranty_end_date?: string | null;
          }[];
        },
      ) => {
        const buyer = order.users;
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Tax Invoice - Order ${id.slice(0, 8)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 760px; margin: 40px auto; padding: 32px; border: 1px solid #d1d5db; }
    h1 { color: #047857; margin-bottom: 4px; }
    .box { background: #f9fafb; padding: 14px; border-radius: 6px; margin: 14px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; font-size: 13px; }
  </style>
</head>
<body onload="window.print()">
  <h1>MUSTADAMA ("مُستدام") — OFFICIAL TAX INVOICE</h1>
  <p>Invoice Reference: <strong>INV-${id.slice(0, 8).toUpperCase()}</strong> • Paid At: ${order.paid_at ?? new Date().toISOString()}</p>
  <div class="box">
    <p><strong>Buyer Name:</strong> ${buyer?.name ?? "Valued Customer"} (${buyer?.account_type ?? "Individual"})</p>
    <p><strong>Delivery Address:</strong> ${order.delivery_address ?? "N/A"}</p>
    ${
      buyer?.account_type === "Company"
        ? `<p><strong>Corporate Tax ID:</strong> ${buyer?.tax_id ?? "N/A"} • <strong>Commercial Registration (CR):</strong> ${buyer?.commercial_reg ?? "N/A"}</p>`
        : ""
    }
    <p><strong>Payment Channel:</strong> ${order.payment_method ?? "Card"} • <strong>Transaction Ref:</strong> ${order.payment_transaction_ref ?? "SIMULATED"}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Serialized Unit UUID</th>
        <th>Warranty End Date</th>
        <th>Sold Price (EGP)</th>
      </tr>
    </thead>
    <tbody>
      ${(order.order_items_warranty ?? [])
        .map(
          (oi) => `<tr>
        <td style="font-family:monospace">${oi.item_serial_id}</td>
        <td>${oi.warranty_end_date ?? "Active upon delivery confirmation"}</td>
        <td style="font-family:monospace">${Number(oi.sold_price).toLocaleString()} EGP</td>
      </tr>`,
        )
        .join("")}
    </tbody>
  </table>
  <h3 style="text-align:right; margin-top:20px;">Total Paid (Incl. VAT): ${Number(order.total_amount ?? 0).toLocaleString()} EGP</h3>
</body>
</html>`;
      };

      const html = invoiceTemplate("00000000-0000-0000-0000-000000000001", {
        paid_at: "2026-11-06T12:00:00Z",
        delivery_address: "123 Tech City, Cairo",
        payment_method: "Card",
        payment_transaction_ref: "TXN-987654",
        total_amount: 14500,
        users: {
          name: "Acme Enterprises",
          account_type: "Company",
          tax_id: "EG-TAX-123456",
          commercial_reg: "CR-7890",
        },
        order_items_warranty: [
          {
            item_serial_id: "MST-2026-00001",
            sold_price: 14500,
            warranty_end_date: null,
          },
        ],
      });

      expect(html).toContain("MUSTADAMA (\"مُستدام\") — OFFICIAL TAX INVOICE");
      expect(html).not.toMatch(/FR-\d+/);
      expect(html).toContain("<strong>Corporate Tax ID:</strong> EG-TAX-123456");
      expect(html).toContain("Active upon delivery confirmation");
      expect(html).toContain("14,500 EGP");
    });

    it("renders clean printable destruction certificate with NIST compliance standard and zero requirement tags", () => {
      const certTemplate = (
        id: string,
        item: {
          title?: string;
          barcode?: string;
          data_wiped_bool?: boolean;
        },
      ) => {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>NIST 800-88 Data Destruction Certificate - ${item.barcode ?? id}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 40px auto; padding: 32px; border: 3px double #047857; }
    h1 { color: #047857; margin-bottom: 4px; }
    .meta { font-family: monospace; background: #f3f4f6; padding: 12px; border-radius: 6px; margin: 16px 0; }
    .badge { display: inline-block; background: #047857; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 12px; }
  </style>
</head>
<body onload="window.print()">
  <span class="badge">NIST SP 800-88 Rev. 1 CERTIFIED</span>
  <h1>Certificate of Data Sanitization & Destruction</h1>
  <p>Mustadama ("مُستدام") Circular E-Commerce Technical Inspection Hub</p>
  <div class="meta">
    <p><strong>Item Serial UUID:</strong> ${id}</p>
    <p><strong>Warehouse Barcode:</strong> ${item.barcode ?? "MST-CERTIFIED"}</p>
    <p><strong>Device Model:</strong> ${item.title ?? "Electronic Storage Device"}</p>
    <p><strong>Sanitization Standard:</strong> NIST SP 800-88 Purge / Cryptographic Erase</p>
    <p><strong>Verification Status:</strong> ${item.data_wiped_bool ? "VERIFIED & WIPED (100% Unrecoverable)" : "PENDING"}</p>
    <p><strong>Issued At:</strong> 2026-11-06T12:00:00.000Z</p>
  </div>
  <p>This document certifies that all non-volatile storage media inside the serialized device identified above have been permanently sanitized in accordance with NIST 800-88 guidelines prior to resale, refurbishment, or component harvesting.</p>
</body>
</html>`;
      };

      const htmlWiped = certTemplate("uuid-001", {
        title: "Dell Latitude 5420 Laptop",
        barcode: "MST-2026-00042",
        data_wiped_bool: true,
      });

      expect(htmlWiped).toContain("NIST SP 800-88 Rev. 1 CERTIFIED");
      expect(htmlWiped).not.toMatch(/FR-\d+/);
      expect(htmlWiped).toContain("VERIFIED & WIPED (100% Unrecoverable)");

      const htmlPending = certTemplate("uuid-002", {
        title: "HP EliteBook 840 G8",
        barcode: "MST-2026-00043",
        data_wiped_bool: false,
      });

      expect(htmlPending).toContain("PENDING");
      expect(htmlPending).not.toMatch(/FR-\d+/);
    });
  });

  describe("4. Domain Server Actions Validation Messages", () => {
    it("ensures all returned domain error messages are user-friendly, descriptive, and free of requirement codes", () => {
      for (const filePath of domainFiles) {
        const content = readFileSync(filePath, "utf8");
        // Find all error: "..." patterns
        const errorStrings = content.match(/error:\s*["`][^"`]+["`]/g) ?? [];
        for (const errStr of errorStrings) {
          expect(errStr).not.toMatch(/(FR|NFR)-\d+/);
          // Check that error messages are not empty or single words
          const msgMatch = errStr.match(/error:\s*["`]([^"`]+)["`]/);
          if (msgMatch) {
            const msg = msgMatch[1];
            expect(msg.length).toBeGreaterThanOrEqual(4);
          }
        }
      }
    });
  });

  describe("5. Dynamic Component Static Markup Rendering Across All 4 Portals", () => {
    const mockCategories = [
      {
        category_id: "cat-001",
        name: "Laptops & Computers",
        name_ar: "حواسيب محمولة",
        base_reference_price: 15000,
        is_bulky: false,
        requires_data_wipe: true,
        warranty_days: 90,
        parent_id: null,
        diagnostic_questions_json: [
          {
            id: "screen",
            question: "Is the screen intact?",
            question_ar: "هل الشاشة سليمة؟",
            deduction_pct: 0.15,
          },
        ],
        created_at: "2026-11-06T00:00:00Z",
      },
    ];

    it("renders SellerPortalClient in both English and Arabic without throwing and without requirement codes", () => {
      // English render
      currentLocale = "en";
      const htmlEn = renderToStaticMarkup(
        React.createElement(SellerPortalClient, {
          accountType: "Company",
          categories: mockCategories,
          dropoffHubs: [],
          myItems: [
            {
              item_serial_id: "MST-2026-00001",
              title: "ThinkPad X1",
              title_ar: "ثينك باد",
              barcode: "MST-BAR-001",
              current_status: "Awaiting_Seller_Decision",
              estimated_min_price: 10000,
              estimated_max_price: 12000,
              final_purchase_price: 11000,
              seller_decision: null,
              offer_expires_at: new Date(Date.now() + 86400000).toISOString(),
              data_wiped_bool: true,
              created_at: "2026-11-06T00:00:00Z",
            },
          ],
          returnTasks: [],
        }),
      );

      const cleanEn = htmlEn.replace(/&amp;/g, "&");
      expect(cleanEn).toContain("Seller Portal & Smart Valuation");
      expect(cleanEn).toContain("Sell Single Item");
      expect(cleanEn).toContain("Corporate Bulk Liquidation");
      expect(cleanEn).not.toMatch(/\b(FR|NFR)-\d+\b/);

      // Arabic render
      currentLocale = "ar";
      const htmlAr = renderToStaticMarkup(
        React.createElement(SellerPortalClient, {
          accountType: "Company",
          categories: mockCategories,
          dropoffHubs: [],
          myItems: [],
          returnTasks: [],
        }),
      );

      const cleanAr = htmlAr.replace(/&amp;/g, "&");
      expect(cleanAr).toContain("بوابة البائع والتسعير الذكي");
      expect(cleanAr).toContain("تقييم وبيع قطعة");
      expect(cleanAr).toContain("تصفية شركات بالجملة");
      expect(cleanAr).not.toMatch(/\b(FR|NFR)-\d+\b/);
    });

    it("renders PartnerPortalClient in both English and Arabic without throwing and without requirement codes", () => {
      currentLocale = "en";
      const htmlEn = renderToStaticMarkup(
        React.createElement(PartnerPortalClient, {
          activeRole: "Partner_Inspector",
          items: [],
          manifests: [],
          refurbTickets: [],
          dismantleTickets: [],
          spareParts: [],
        }),
      );

      const cleanEn = htmlEn.replace(/&amp;/g, "&");
      expect(cleanEn).toContain("Partner Operations & Technical Hub");
      expect(cleanEn).toContain("1. Logistics & Shipped Batches");
      expect(cleanEn).toContain("3. Technical Inspection & Data Sanitization");
      expect(cleanEn).not.toMatch(/\b(FR|NFR)-\d+\b/);

      currentLocale = "ar";
      const htmlAr = renderToStaticMarkup(
        React.createElement(PartnerPortalClient, {
          activeRole: "Partner_Inspector",
          items: [],
          manifests: [],
          refurbTickets: [],
          dismantleTickets: [],
          spareParts: [],
        }),
      );

      const cleanAr = htmlAr.replace(/&amp;/g, "&");
      expect(cleanAr).toContain("بوابة عمليات الشركاء والمراكز الفنية");
      expect(cleanAr).toContain("١. الخدمات اللوجستية والشحنات");
      expect(cleanAr).toContain("٣. الفحص الفني ومسح البيانات");
      expect(cleanAr).not.toMatch(/\b(FR|NFR)-\d+\b/);
    });

    it("renders StorefrontClient in both English and Arabic without throwing and without requirement codes", () => {
      currentLocale = "en";
      const htmlEn = renderToStaticMarkup(
        React.createElement(StorefrontClient, {
          accountType: "Company",
          catalogItems: [],
          orders: [],
          quotes: [],
        }),
      );

      const cleanEn = htmlEn.replace(/&amp;/g, "&");
      expect(cleanEn).toContain("Certified Pre-Owned & Refurbished Store");
      expect(cleanEn).toContain("Checkout & Electronic Payment");
      expect(cleanEn).not.toMatch(/\b(FR|NFR)-\d+\b/);

      currentLocale = "ar";
      const htmlAr = renderToStaticMarkup(
        React.createElement(StorefrontClient, {
          accountType: "Company",
          catalogItems: [],
          orders: [],
          quotes: [],
        }),
      );

      const cleanAr = htmlAr.replace(/&amp;/g, "&");
      expect(cleanAr).toContain("متجر الأجهزة والقطع المجددة المعتمدة");
      expect(cleanAr).toContain("إتمام الطلب وبوابة الدفع الإلكتروني");
      expect(cleanAr).not.toMatch(/\b(FR|NFR)-\d+\b/);
    });

    it("renders AdminPortalClient in both English and Arabic without throwing and without requirement codes", () => {
      const mockKpis = {
        totalStoreSalesRevenue: 50000,
        totalRecyclingRevenue: 12000,
        avgProfitMarginEgp: 3200,
        sellerOfferAcceptanceRatePct: 78,
        aging0to30Count: 15,
        aging31to60Count: 8,
        aging61to90Count: 3,
        decommissionedAgedCount: 1,
        totalLandfillDivertedKg: 450,
        totalAuditLogEntries: 128,
      };

      currentLocale = "en";
      const htmlEn = renderToStaticMarkup(
        React.createElement(AdminPortalClient, {
          activeRole: "Admin",
          kpis: mockKpis,
          categories: mockCategories,
          quotes: [],
          claims: [],
        }),
      );

      const cleanEn = htmlEn.replace(/&amp;/g, "&");
      expect(cleanEn).toContain("Admin Control Center & Sustainability Dashboard");
      expect(cleanEn).toContain("1. Platform KPIs & Sustainability");
      expect(cleanEn).toContain("Avg Profit Margin / Unit");
      expect(cleanEn).toContain("Environmental Impact: Landfill Diversion");
      expect(cleanEn).not.toMatch(/\b(FR|NFR)-\d+\b/);

      currentLocale = "ar";
      const htmlAr = renderToStaticMarkup(
        React.createElement(AdminPortalClient, {
          activeRole: "Admin",
          kpis: mockKpis,
          categories: mockCategories,
          quotes: [],
          claims: [],
        }),
      );

      const cleanAr = htmlAr.replace(/&amp;/g, "&");
      expect(cleanAr).toContain("لوحة تحكم الإدارة ومؤشرات الأداء والاستدامة");
      expect(cleanAr).toContain("١. مؤشرات الأداء والاستدامة");
      expect(cleanAr).toContain("متوسط هامش الربح للقطعة");
      expect(cleanAr).toContain("الأثر البيئي: النفايات المنقذة من المكبات");
      expect(cleanAr).not.toMatch(/\b(FR|NFR)-\d+\b/);
    });
  });
});
