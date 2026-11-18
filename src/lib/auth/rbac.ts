import type { DemoPersona, UserRole } from "@/types/domain";

/**
 * 12 SRS Personas mapped to the 8 clean DB RBAC roles (ADR-006, FR-01, FR-02)
 */
export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: "seller-individual",
    userId: "11111111-1111-1111-1111-111111111101",
    email: "seller.individual@mustadama.eg",
    labelEn: "1. Individual Seller",
    labelAr: "١. بائع فردي",
    role: "Customer",
    accountType: "Individual",
    defaultRoute: "/seller",
  },
  {
    id: "seller-corporate",
    userId: "11111111-1111-1111-1111-111111111102",
    email: "seller.corporate@mustadama.eg",
    labelEn: "2. Corporate Seller (B2B)",
    labelAr: "٢. بائع شركات (تصفية)",
    role: "Customer",
    accountType: "Company",
    defaultRoute: "/seller",
  },
  {
    id: "buyer-individual",
    userId: "11111111-1111-1111-1111-111111111103",
    email: "buyer.individual@mustadama.eg",
    labelEn: "3. Individual Buyer",
    labelAr: "٣. مشتري فردي",
    role: "Customer",
    accountType: "Individual",
    defaultRoute: "/store",
  },
  {
    id: "buyer-corporate",
    userId: "11111111-1111-1111-1111-111111111104",
    email: "buyer.corporate@mustadama.eg",
    labelEn: "4. Corporate Buyer (B2B)",
    labelAr: "٤. مشتري شركات (B2B)",
    role: "Customer",
    accountType: "Company",
    defaultRoute: "/store",
  },
  {
    id: "courier-hub",
    userId: "11111111-1111-1111-1111-111111111105",
    email: "courier@mustadama.eg",
    labelEn: "5. Courier / Drop-off Hub",
    labelAr: "٥. مندوب توصيل / نقطة تسليم",
    role: "Courier",
    accountType: "Individual",
    defaultRoute: "/partner",
  },
  {
    id: "transport-bulky",
    userId: "11111111-1111-1111-1111-111111111106",
    email: "transport@mustadama.eg",
    labelEn: "6. Bulky Transport Team",
    labelAr: "٦. فريق نقل الأثاث الضخم",
    role: "Courier",
    accountType: "Individual",
    defaultRoute: "/partner",
  },
  {
    id: "inspector",
    userId: "11111111-1111-1111-1111-111111111107",
    email: "inspector@mustadama.eg",
    labelEn: "7. Partner Inspector",
    labelAr: "٧. مهندس الفحص الفني",
    role: "Partner_Inspector",
    accountType: "Individual",
    defaultRoute: "/partner",
  },
  {
    id: "refurb-tech",
    userId: "11111111-1111-1111-1111-111111111108",
    email: "refurb.tech@mustadama.eg",
    labelEn: "8. Refurbishment Tech",
    labelAr: "٨. فني التجديد والإصلاح",
    role: "Partner_Refurb_Tech",
    accountType: "Individual",
    defaultRoute: "/partner",
  },
  {
    id: "dismantle-tech",
    userId: "11111111-1111-1111-1111-111111111109",
    email: "dismantle.tech@mustadama.eg",
    labelEn: "9. Dismantling Tech",
    labelAr: "٩. فني التفكيك وقطع الغيار",
    role: "Partner_Dismantle_Tech",
    accountType: "Individual",
    defaultRoute: "/partner",
  },
  {
    id: "warehouse-mgr",
    userId: "11111111-1111-1111-1111-111111111110",
    email: "warehouse.mgr@mustadama.eg",
    labelEn: "10. Warehouse Manager",
    labelAr: "١٠. مدير المستودع",
    role: "Partner_Warehouse_Mgr",
    accountType: "Individual",
    defaultRoute: "/partner",
  },
  {
    id: "customer-service",
    userId: "11111111-1111-1111-1111-111111111111",
    email: "customer.service@mustadama.eg",
    labelEn: "11. Customer Service",
    labelAr: "١١. خدمة العملاء والضمان",
    role: "Customer_Service",
    accountType: "Individual",
    defaultRoute: "/admin",
  },
  {
    id: "admin",
    userId: "11111111-1111-1111-1111-111111111112",
    email: "admin@mustadama.eg",
    labelEn: "12. Platform Admin (MIS)",
    labelAr: "١٢. مدير المنصة والتقارير",
    role: "Admin",
    accountType: "Individual",
    defaultRoute: "/admin",
  },
];

export const DEMO_DEFAULT_PASSWORD = "Mustadama2026!";

/**
 * Portal RBAC Matrix (FR-02, ADR-006):
 * - Customer can access both /seller and /store
 * - Operational partner roles access /partner
 * - Customer_Service and Admin access /admin (Admin can also view all portals)
 */
export const PORTAL_ALLOWED_ROLES: Record<
  "seller" | "store" | "partner" | "admin",
  UserRole[]
> = {
  seller: ["Customer", "Admin"],
  store: ["Customer", "Admin"],
  partner: [
    "Courier",
    "Partner_Warehouse_Mgr",
    "Partner_Inspector",
    "Partner_Refurb_Tech",
    "Partner_Dismantle_Tech",
    "Admin",
  ],
  admin: ["Customer_Service", "Admin"],
};

export function canAccessPortal(
  role: UserRole | null | undefined,
  portal: "seller" | "store" | "partner" | "admin",
): boolean {
  if (!role) return false;
  return PORTAL_ALLOWED_ROLES[portal].includes(role);
}

export function validateCorporateCredentials(input: {
  accountType: "Individual" | "Company";
  taxId?: string | null;
  commercialReg?: string | null;
}): { valid: boolean; errorKey?: string } {
  if (input.accountType === "Individual") {
    return { valid: true };
  }
  const taxId = input.taxId?.trim() ?? "";
  const commercialReg = input.commercialReg?.trim() ?? "";

  if (!/^\d{3}-\d{3}-\d{3}$/.test(taxId) && !/^\d{9}$/.test(taxId)) {
    return { valid: false, errorKey: "invalidTaxId" };
  }
  if (commercialReg.length < 4) {
    return { valid: false, errorKey: "invalidCommercialReg" };
  }
  return { valid: true };
}

