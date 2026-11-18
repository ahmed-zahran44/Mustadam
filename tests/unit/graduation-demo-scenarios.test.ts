import { describe, expect, it } from "vitest";
import {
  canAccessPortal,
  DEMO_DEFAULT_PASSWORD,
  DEMO_PERSONAS,
  validateCorporateCredentials,
} from "@/lib/auth/rbac";
import { evaluateInventoryAging } from "@/lib/domain/aging-engine";
import {
  calculateAllocatedBatchLogisticsCost,
  calculateEstimatedPriceRange,
  calculateReturnFee,
  calculateTargetSellingPrice,
  calculateTotalUnitCost,
} from "@/lib/domain/pricing-engine";
import {
  calculateOfferExpiryDate,
  canTransitionItemStatus,
  isOfferExpired,
} from "@/lib/domain/state-machine";
import {
  calculateWarrantyEndDate,
  isWarrantyActive,
} from "@/lib/domain/warranty-engine";

describe("Mustadama End-to-End Graduation Defense Test Scenarios (12 Personas & FR-01..FR-26)", () => {
  it("Scenario 1 (FR-01, FR-02, ADR-006): Verifies all 12 SRS Demo Personas map cleanly to the 8 DB RBAC roles and default routes", () => {
    expect(DEMO_PERSONAS).toHaveLength(12);
    expect(DEMO_DEFAULT_PASSWORD).toBe("Mustadama2026!");

    const distinctRoles = new Set(DEMO_PERSONAS.map((p) => p.role));
    expect(distinctRoles).toEqual(
      new Set([
        "Customer",
        "Courier",
        "Partner_Inspector",
        "Partner_Refurb_Tech",
        "Partner_Dismantle_Tech",
        "Partner_Warehouse_Mgr",
        "Customer_Service",
        "Admin",
      ]),
    );

    // Unified Customer role can access both /seller and /store
    expect(canAccessPortal("Customer", "seller")).toBe(true);
    expect(canAccessPortal("Customer", "store")).toBe(true);
    expect(canAccessPortal("Customer", "partner")).toBe(false);
    expect(canAccessPortal("Customer", "admin")).toBe(false);

    // Corporate validation (FR-01)
    expect(
      validateCorporateCredentials({
        accountType: "Company",
        taxId: "412-889-103",
        commercialReg: "CR-98412",
      }).valid,
    ).toBe(true);
  });

  it("Scenario 2 (FR-03, FR-04): Individual Seller diagnostic questionnaire & instant price range calculation", () => {
    const est = calculateEstimatedPriceRange({
      baseReferencePrice: 12000,
      questions: [
        {
          id: "screen",
          question_en: "Is the screen free of cracks or dead pixels?",
          question_ar: "هل الشاشة خالية من الكسور؟",
          type: "boolean",
          deduction_pct: 0.25,
        },
        {
          id: "battery",
          question_en: "Does the battery hold charge over 2 hours?",
          question_ar: "هل البطارية تعمل لأكثر من ساعتين؟",
          type: "boolean",
          deduction_pct: 0.15,
        },
      ],
      answers: { screen: true, battery: false }, // 15% deduction -> 10200 adjusted
    });

    expect(est.totalDeductionPct).toBe(0.15);
    expect(est.adjustedValue).toBe(10200);
    expect(est.estimatedMinPrice).toBe(9180);
    expect(est.estimatedMaxPrice).toBe(11220);
  });

  it("Scenario 3 (FR-08, FR-17): Bulky Transport Team equal batch logistics cost allocation", () => {
    // 600 EGP total batch truck cost across 2 items in batch = 300 EGP per item
    expect(calculateAllocatedBatchLogisticsCost(600, 2)).toBe(300);
    // 600 EGP across 3 items = 200 EGP per item
    expect(calculateAllocatedBatchLogisticsCost(600, 3)).toBe(200);
  });

  it("Scenario 4 (FR-10, FR-11, FR-12): Inspection, 7-Day (168h) offer decision window & Auto-Reject return fee", () => {
    const inspectedAt = new Date("2026-11-05T10:00:00Z");
    const expiresAt = calculateOfferExpiryDate(inspectedAt);
    expect(expiresAt.toISOString()).toBe("2026-11-12T10:00:00.000Z");

    // Within 7 days -> active
    expect(
      isOfferExpired(expiresAt, new Date("2026-11-11T10:00:00Z")),
    ).toBe(false);
    // Past 7 days (168h) -> Auto-Reject into Return_In_Progress
    expect(
      isOfferExpired(expiresAt, new Date("2026-11-12T10:00:01Z")),
    ).toBe(true);
    expect(
      canTransitionItemStatus("Awaiting_Seller_Decision", "Return_In_Progress"),
    ).toBe(true);
    expect(calculateReturnFee(false)).toBe(150);
    expect(calculateReturnFee(true)).toBe(300);
  });

  it("Scenario 5 (FR-13, FR-14, FR-15, FR-17, ADR-009): Dismantling spare part harvest + Refurbishment consumption + 35% Markup on Cost", () => {
    // Item purchased for 7800 EGP, batch logistics 300 EGP, labor 250 EGP, consumed harvested RAM (estimated_cost = 450 EGP)
    const rollup = calculateTotalUnitCost({
      finalPurchasePrice: 7800,
      allocatedLogisticsCost: 300,
      laborCost: 250,
      externalPartsCost: 0,
      harvestedPartsEstimatedCosts: [450],
    });

    expect(rollup.partsCost).toBe(450);
    expect(rollup.refurbishmentCost).toBe(700); // 250 + 450
    expect(rollup.totalUnitCost).toBe(8800); // 7800 + 300 + 700
    expect(rollup.targetSellingPrice).toBe(11880); // round(8800 * 1.35, 2)
    expect(calculateTargetSellingPrice(rollup.totalUnitCost)).toBe(11880);
  });

  it("Scenario 6 (FR-19, ADR-009): 30-60-90 Day Inventory Aging Cascade & Day 91+ Decommissioned_Aged -> Scrap_Ready_For_Recycling -> Recycled_Closed", () => {
    const listedDate = new Date("2026-08-01T00:00:00Z");
    const totalUnitCost = 9000; // Seeded ThinkPad T480

    // Tier 1 (0-30d): 9000 * 1.35 = 12150 EGP
    const tier1 = evaluateInventoryAging({
      listedDate,
      totalUnitCost,
      referenceTime: new Date("2026-08-11T00:00:00Z"),
    });
    expect(tier1.agingTier).toBe("0_30");
    expect(tier1.newSellingPrice).toBe(12150);

    // Tier 2 (31-60d): 12150 * 0.80 = 9720 EGP (+8% net margin above cost)
    const tier2 = evaluateInventoryAging({
      listedDate,
      totalUnitCost,
      referenceTime: new Date("2026-09-15T00:00:00Z"),
    });
    expect(tier2.agingTier).toBe("31_60");
    expect(tier2.newSellingPrice).toBe(9720);

    // Tier 3 (61-90d): Clearance at Total_Unit_Cost = 9000 EGP
    const tier3 = evaluateInventoryAging({
      listedDate,
      totalUnitCost,
      referenceTime: new Date("2026-10-15T00:00:00Z"),
    });
    expect(tier3.agingTier).toBe("61_90");
    expect(tier3.newSellingPrice).toBe(9000);

    // Tier 4 (91+d): Decommissioned_Aged -> Dismantle -> Scrap_Ready_For_Recycling -> Recycled_Closed
    const tier4 = evaluateInventoryAging({
      listedDate,
      totalUnitCost,
      referenceTime: new Date("2026-11-05T00:00:00Z"),
    });
    expect(tier4.agingTier).toBe("91_plus");
    expect(tier4.newStatus).toBe("Decommissioned_Aged");
    expect(tier4.shouldCreateDismantlingTicket).toBe(true);
    expect(
      canTransitionItemStatus(
        "Decommissioned_Aged",
        "Scrap_Ready_For_Recycling",
      ),
    ).toBe(true);
    expect(
      canTransitionItemStatus("Scrap_Ready_For_Recycling", "Recycled_Closed"),
    ).toBe(true);
  });

  it("Scenario 7 (FR-23, FR-24): Post-delivery automated category warranty calculation & active claim eligibility", () => {
    // Laptops category has 90-day warranty
    const warrantyEnd = calculateWarrantyEndDate("2026-11-05", 90);
    expect(warrantyEnd).toBe("2027-02-03");
    expect(
      isWarrantyActive(warrantyEnd, new Date("2026-12-01T00:00:00Z")),
    ).toBe(true);
  });
});

