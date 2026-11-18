import { describe, expect, it } from "vitest";
import {
  canAccessPortal,
  DEMO_PERSONAS,
  validateCorporateCredentials,
} from "@/lib/auth/rbac";

describe("RBAC & 12 Graduation Demo Personas (FR-01, FR-02, ADR-006)", () => {
  it("defines all 12 SRS personas mapped to the 8 clean DB roles", () => {
    expect(DEMO_PERSONAS).toHaveLength(12);
    const distinctRoles = new Set(DEMO_PERSONAS.map((p) => p.role));
    expect(distinctRoles.size).toBe(8);
  });

  it("allows unified Customer role to access both /seller and /store", () => {
    expect(canAccessPortal("Customer", "seller")).toBe(true);
    expect(canAccessPortal("Customer", "store")).toBe(true);
    expect(canAccessPortal("Customer", "partner")).toBe(false);
    expect(canAccessPortal("Customer", "admin")).toBe(false);
  });

  it("restricts /partner to operational roles and Admin", () => {
    expect(canAccessPortal("Partner_Inspector", "partner")).toBe(true);
    expect(canAccessPortal("Partner_Refurb_Tech", "partner")).toBe(true);
    expect(canAccessPortal("Partner_Dismantle_Tech", "partner")).toBe(true);
    expect(canAccessPortal("Partner_Warehouse_Mgr", "partner")).toBe(true);
    expect(canAccessPortal("Courier", "partner")).toBe(true);
    expect(canAccessPortal("Customer_Service", "partner")).toBe(false);
  });

  it("validates corporate tax_id and commercial_reg for Company accounts (FR-01)", () => {
    expect(
      validateCorporateCredentials({ accountType: "Individual" }).valid,
    ).toBe(true);

    expect(
      validateCorporateCredentials({
        accountType: "Company",
        taxId: "bad",
        commercialReg: "CR-12345",
      }),
    ).toEqual({ valid: false, errorKey: "invalidTaxId" });

    expect(
      validateCorporateCredentials({
        accountType: "Company",
        taxId: "123-456-789",
        commercialReg: "CR-987654",
      }),
    ).toEqual({ valid: true });
  });
});

