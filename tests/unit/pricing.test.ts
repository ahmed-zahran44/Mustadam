import { describe, expect, it } from "vitest";
import {
  calculateAllocatedBatchLogisticsCost,
  calculateEstimatedPriceRange,
  calculateReturnFee,
  calculateTargetSellingPrice,
  calculateTotalUnitCost,
} from "@/lib/domain/pricing-engine";

describe("Domain Pricing Engine (FR-04, FR-08, FR-17 & ADR-009 35% Markup on Cost)", () => {
  it("calculates Tier 1 Target_Selling_Price using a flat 35% markup on Total_Unit_Cost", () => {
    // 9000 * 1.35 = 12150.00
    expect(calculateTargetSellingPrice(9000)).toBe(12150);
    // 4000 * 1.35 = 5400.00
    expect(calculateTargetSellingPrice(4000)).toBe(5400);
    // 6300 * 1.35 = 8505.00
    expect(calculateTargetSellingPrice(6300)).toBe(8505);
  });

  it("handles floating-point rounding precision to 2 decimal places", () => {
    // 1175 * 1.35 = 1586.25
    expect(calculateTargetSellingPrice(1175)).toBe(1586.25);
    // 333.33 * 1.35 = 449.9955 -> 450.00
    expect(calculateTargetSellingPrice(333.33)).toBe(450);
    // 199.99 * 1.35 = 269.9865 -> 269.99
    expect(calculateTargetSellingPrice(199.99)).toBe(269.99);
  });

  it("supports custom markup percentage override when explicitly provided", () => {
    expect(calculateTargetSellingPrice(1000, 0.5)).toBe(1500);
    expect(calculateTargetSellingPrice(1000, 0)).toBe(1000);
  });

  it("rolls up Total_Unit_Cost and automatically computes Tier 1 targetSellingPrice (FR-14, FR-15, FR-17)", () => {
    const allocatedLogisticsCost = calculateAllocatedBatchLogisticsCost(600, 3); // 200
    const res = calculateTotalUnitCost({
      finalPurchasePrice: 5000,
      allocatedLogisticsCost,
      laborCost: 300,
      externalPartsCost: 100,
      harvestedPartsEstimatedCosts: [450, 250],
    });

    expect(res.partsCost).toBe(800);
    expect(res.refurbishmentCost).toBe(1100);
    expect(res.totalUnitCost).toBe(6300);
    // 6300 * 1.35 = 8505
    expect(res.targetSellingPrice).toBe(8505);
  });

  it("computes FR-04 diagnostic price range and FR-12 return fees", () => {
    const range = calculateEstimatedPriceRange({
      baseReferencePrice: 10000,
      questions: [
        {
          id: "q1",
          question_en: "Power on?",
          question_ar: "يعمل؟",
          type: "boolean",
          deduction_pct: 0.15,
        },
      ],
      answers: { q1: false },
    });

    expect(range.adjustedValue).toBe(8500);
    expect(range.estimatedMinPrice).toBe(7650);
    expect(range.estimatedMaxPrice).toBe(9350);
    expect(calculateReturnFee(false)).toBe(150);
    expect(calculateReturnFee(true)).toBe(300);
  });
});

