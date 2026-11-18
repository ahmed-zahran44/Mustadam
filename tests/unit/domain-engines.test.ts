import { describe, expect, it } from "vitest";
import { evaluateInventoryAging } from "@/lib/domain/aging-engine";
import {
  calculateAllocatedBatchLogisticsCost,
  calculateEstimatedPriceRange,
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

describe("Mustadama Core Business Formulas & State Machine", () => {
  it("computes FR-04 diagnostic price range with deduction cap and disclaimers", () => {
    const questions = [
      {
        id: "screen",
        question_en: "Screen intact?",
        question_ar: "الشاشة سليمة؟",
        type: "boolean" as const,
        deduction_pct: 0.2,
      },
      {
        id: "battery",
        question_en: "Battery ok?",
        question_ar: "البطارية جيدة؟",
        type: "boolean" as const,
        deduction_pct: 0.1,
      },
    ];

    const res = calculateEstimatedPriceRange({
      baseReferencePrice: 10000,
      questions,
      answers: { screen: true, battery: false }, // 10% deduction -> 9000
    });

    expect(res.totalDeductionPct).toBe(0.1);
    expect(res.adjustedValue).toBe(9000);
    expect(res.estimatedMinPrice).toBe(8100);
    expect(res.estimatedMaxPrice).toBe(9900);
    expect(res.disclaimerEn).toContain("7 days (168 hours)");
  });

  it("allocates bulky batch logistics cost equally across all items (FR-08, FR-17)", () => {
    expect(calculateAllocatedBatchLogisticsCost(600, 3)).toBe(200);
    expect(calculateAllocatedBatchLogisticsCost(500, 0)).toBe(0);
  });

  it("rolls up harvested spare part estimated_cost into parts_cost, refurbishment_cost, and total_unit_cost (FR-14, FR-15, FR-17)", () => {
    const cost = calculateTotalUnitCost({
      finalPurchasePrice: 5000,
      allocatedLogisticsCost: 200,
      laborCost: 300,
      externalPartsCost: 100,
      harvestedPartsEstimatedCosts: [450, 250],
    });

    expect(cost.partsCost).toBe(800); // 100 + 450 + 250
    expect(cost.refurbishmentCost).toBe(1100); // 300 + 800
    expect(cost.totalUnitCost).toBe(6300); // 5000 + 200 + 1100
    expect(cost.targetSellingPrice).toBe(8505); // round(6300 * 1.35, 2)
  });

  it("enforces strict state machine transitions including Decommissioned_Aged -> Scrap_Ready_For_Recycling (FR-19, NFR-02)", () => {
    expect(
      canTransitionItemStatus("Listed_In_Store", "Decommissioned_Aged"),
    ).toBe(true);
    expect(
      canTransitionItemStatus(
        "Decommissioned_Aged",
        "Scrap_Ready_For_Recycling",
      ),
    ).toBe(true);
    expect(
      canTransitionItemStatus("Submitted", "Listed_In_Store"),
    ).toBe(false);
  });

  it("computes 7-day (168-hour) seller offer expiry window (FR-12)", () => {
    const inspectedAt = new Date("2026-11-01T12:00:00Z");
    const expiresAt = calculateOfferExpiryDate(inspectedAt);
    expect(expiresAt.toISOString()).toBe("2026-11-08T12:00:00.000Z");
    expect(
      isOfferExpired(expiresAt, new Date("2026-11-08T11:59:59Z")),
    ).toBe(false);
    expect(
      isOfferExpired(expiresAt, new Date("2026-11-08T12:00:01Z")),
    ).toBe(true);
  });

  it("evaluates 30-60-90 day inventory aging and Day 91+ Decommissioned_Aged transition with 35% Tier 1 markup (FR-19, ADR-009)", () => {
    const listedDate = new Date("2026-08-01T00:00:00Z");

    // Day 15: Full Tier 1 price (7000 * 1.35 = 9450)
    const day15 = evaluateInventoryAging({
      listedDate,
      totalUnitCost: 7000,
      referenceTime: new Date("2026-08-16T00:00:00Z"),
    });
    expect(day15.agingTier).toBe("0_30");
    expect(day15.newSellingPrice).toBe(9450);
    expect(day15.newStatus).toBe("Listed_In_Store");

    // Day 45: 20% markdown (9450 * 0.80 = 7560)
    const day45 = evaluateInventoryAging({
      listedDate,
      totalUnitCost: 7000,
      referenceTime: new Date("2026-09-15T00:00:00Z"),
    });
    expect(day45.agingTier).toBe("31_60");
    expect(day45.newSellingPrice).toBe(7560);

    // Day 75: Clearance at Total_Unit_Cost (7000)
    const day75 = evaluateInventoryAging({
      listedDate,
      totalUnitCost: 7000,
      referenceTime: new Date("2026-10-15T00:00:00Z"),
    });
    expect(day75.agingTier).toBe("61_90");
    expect(day75.newSellingPrice).toBe(7000);

    // Day 95: Decommissioned_Aged + dismantling ticket
    const day95 = evaluateInventoryAging({
      listedDate,
      totalUnitCost: 7000,
      referenceTime: new Date("2026-11-04T00:00:00Z"),
    });
    expect(day95.agingTier).toBe("91_plus");
    expect(day95.newStatus).toBe("Decommissioned_Aged");
    expect(day95.shouldCreateDismantlingTicket).toBe(true);
  });

  it("calculates warranty end date from delivery date + category warranty_days (FR-23)", () => {
    const endDate = calculateWarrantyEndDate("2026-11-01", 90);
    expect(endDate).toBe("2027-01-30");
    expect(isWarrantyActive(endDate, new Date("2027-01-15T00:00:00Z"))).toBe(
      true,
    );
    expect(isWarrantyActive(endDate, new Date("2027-02-02T00:00:00Z"))).toBe(
      false,
    );
  });
});

