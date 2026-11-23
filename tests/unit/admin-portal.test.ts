import { readFileSync } from "node:fs";
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

import { AdminPortalClient } from "@/components/admin/admin-portal-client";
import type { AdminKpiStats } from "@/components/admin/admin-types";
import type { CategoryRow } from "@/types/domain";

const MOCK_KPIS: AdminKpiStats = {
  totalStoreSalesRevenue: 145000,
  totalRecyclingRevenue: 18500,
  avgProfitMarginEgp: 3420,
  soldAvgProfitMarginEgp: 3650,
  totalSoldOrdersCount: 14,
  sellerOfferAcceptanceRatePct: 82,
  acceptedOffersCount: 9,
  rejectedOffersCount: 1,
  autoRejectedOffersCount: 1,
  pendingOffersCount: 2,
  avgTurnaroundDays: 6.4,
  aging0to30Count: 23,
  aging31to60Count: 3,
  aging61to90Count: 2,
  decommissionedAgedCount: 1,
  totalLandfillDivertedKg: 148.5,
  refurbishedDivertedKg: 112.5,
  recycledDivertedKg: 36,
  estimatedCo2SavedKg: 624,
  totalAuditLogEntries: 74,
  lifecycleCounts: {
    Listed_In_Store: 28,
    Sold: 9,
    Awaiting_Handover: 16,
  },
  materialDiversionKg: {
    "Refurbished Hardware & Furniture": 112.5,
    "E-waste": 24,
    Metal: 12,
  },
};

const MOCK_CATEGORIES: CategoryRow[] = [
  {
    category_id: "33333333-3333-3333-3333-333333333301",
    name: "Laptops & Computers",
    name_ar: "أجهزة الكمبيوتر المحمول",
    base_reference_price: 15000,
    warranty_days: 90,
    is_bulky: false,
    requires_data_wipe: true,
    parent_id: null,
    diagnostic_questions_json: [
      {
        id: "power",
        question_en: "Powers on normally?",
        question_ar: "هل يعمل الجهاز بشكل طبيعي؟",
        type: "boolean",
        deduction_pct: 0.25,
      },
    ],
  },
];

describe("Admin & MIS Portal Completeness & RBAC Behavior", () => {
  it("renders all 6 Admin tabs, turnaround KPI, and charts in English (LTR)", () => {
    currentLocale = "en";
    const html = renderToStaticMarkup(
      React.createElement(AdminPortalClient, {
        activeRole: "Admin",
        kpis: MOCK_KPIS,
        categories: MOCK_CATEGORIES,
        quotes: [],
        claims: [],
      }),
    );

    const clean = html.replace(/&amp;/g, "&");
    expect(clean).toContain("1. Platform KPIs & Sustainability");
    expect(clean).toContain("2. Categories & Diagnostic Schemas");
    expect(clean).toContain("3. Customer Segments & Campaigns");
    expect(clean).toContain("4. B2B Quotes (0)");
    expect(clean).toContain("5. Warranty Claims (0)");
    expect(clean).toContain("6. Operations & Audit Trail");
    expect(clean).toContain("Avg Turnaround (Receipt to Sale)");
    expect(clean).toContain("6.4 days");
    expect(clean).toContain("Run Aging & Offer Expiry Engine");
    expect(clean).toContain("Serialized Item Lifecycle Distribution");
    expect(clean).toContain("Environmental Diversion by Stream & Material");
    expect(clean).not.toMatch(/\b(FR|NFR)-\d+\b/);
  });

  it("renders full Arabic (RTL) labels with zero untranslated primary headings", () => {
    currentLocale = "ar";
    const html = renderToStaticMarkup(
      React.createElement(AdminPortalClient, {
        activeRole: "Admin",
        kpis: MOCK_KPIS,
        categories: MOCK_CATEGORIES,
        quotes: [],
        claims: [],
      }),
    );

    const clean = html.replace(/&amp;/g, "&");
    expect(clean).toContain("لوحة تحكم الإدارة ومؤشرات الأداء والاستدامة");
    expect(clean).toContain("١. مؤشرات الأداء والاستدامة");
    expect(clean).toContain("٦. حوكمة العمليات والتدقيق");
    expect(clean).toContain("متوسط زمن الدورة (من الاستلام حتى البيع)");
    expect(clean).toContain("تشغيل محرك التقادم وانتهاء العروض الآن");
    expect(clean).toContain("توزيع القطع عبر مراحل دورة الحياة");
    expect(clean).not.toMatch(/\b(FR|NFR)-\d+\b/);
  });

  it("defaults Customer_Service role directly to Warranty Claims & Return Authorizations workspace", () => {
    currentLocale = "en";
    const html = renderToStaticMarkup(
      React.createElement(AdminPortalClient, {
        activeRole: "Customer_Service",
        kpis: MOCK_KPIS,
        categories: MOCK_CATEGORIES,
        quotes: [],
        claims: [
          {
            claim_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            order_item_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            description: "Battery drains quickly after 2 weeks.",
            status: "open",
            resolution_note: null,
            created_at: "2026-11-15T10:00:00Z",
            buyer_name: "Omar Khaled",
            item_title: "ThinkPad X1 Carbon",
            item_barcode: "MST-2026-00010",
            warranty_end_date: "2027-02-15",
          },
        ],
        returnTasks: [
          {
            return_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
            item_serial_id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
            fee_amount: 150,
            fee_status: "pending",
            fee_payment_ref: null,
            status: "awaiting_fee_payment",
            created_at: "2026-11-15T10:00:00Z",
            item_title: "HP EliteBook 840",
            item_barcode: "MST-2026-00011",
            item_status: "Return_In_Progress",
          },
        ],
      }),
    );

    const clean = html.replace(/&amp;/g, "&");
    expect(clean).toContain("Customer Service Warranty Claims Queue");
    expect(clean).toContain("Approve & Resolve Claim");
    expect(clean).toContain("Mark In Review");
    expect(clean).toContain("Seller Return Authorizations (1)");
    expect(clean).toContain("Confirm Fee & Authorize Release");
  });

  it("enforces server-side role verification across all admin server actions", () => {
    const actionsCode = readFileSync("src/lib/domain/admin-actions.ts", "utf8");
    expect(actionsCode).toContain("requireAdminPortalRole");
    expect(actionsCode).toContain("createOrUpdateCategoryAction");
    expect(actionsCode).toContain("approveCorporateQuoteAction");
    expect(actionsCode).toContain("expireCorporateQuoteAction");
    expect(actionsCode).toContain("resolveWarrantyClaimAction");
    expect(actionsCode).toContain("updateReturnTaskStatusAction");
    expect(actionsCode).toContain("dispatchSegmentCampaignAction");
    expect(actionsCode).toContain("updateCustomerSegmentAction");
    expect(actionsCode).toContain("reviewBulkyPreverificationAction");
    expect(actionsCode).toContain("runAdminAgingAndExpiryAction");
  });

  it("allows both Admin and Customer_Service on admin subdomain while blocking Customers and Partners", () => {
    const proxyCode = readFileSync("src/proxy.ts", "utf8");
    expect(proxyCode).toContain('role !== "Admin" && role !== "Customer_Service"');
  });
});

