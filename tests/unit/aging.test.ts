import { describe, expect, it } from "vitest";
import { evaluateInventoryAging } from "@/lib/domain/aging-engine";
import { calculateTargetSellingPrice } from "@/lib/domain/pricing-engine";

describe("Inventory Aging Engine (FR-19 & ADR-009 35% Markup Cascade)", () => {
  const listedDate = new Date("2026-08-01T00:00:00Z");
  const totalUnitCost = 9000; // Target_Selling_Price = round(9000 * 1.35, 2) = 12150

  it("Tier 1 (0-30 Days): enforces 35% markup on Total_Unit_Cost (Target_Selling_Price = round(Total_Unit_Cost * 1.35, 2))", () => {
    const tier1 = evaluateInventoryAging({
      listedDate,
      totalUnitCost,
      referenceTime: new Date("2026-08-15T00:00:00Z"), // Day 14
    });

    expect(tier1.daysListed).toBe(14);
    expect(tier1.agingTier).toBe("0_30");
    expect(tier1.targetSellingPrice).toBe(12150);
    expect(tier1.newSellingPrice).toBe(12150);
    expect(tier1.newStatus).toBe("Listed_In_Store");
    expect(tier1.shouldCreateDismantlingTicket).toBe(false);
  });

  it("Tier 2 (31-60 Days): applies 20% markdown off the 35% Tier 1 Target_Selling_Price (1.35 * 0.80 = 1.08x cost)", () => {
    const tier2 = evaluateInventoryAging({
      listedDate,
      totalUnitCost,
      referenceTime: new Date("2026-09-15T00:00:00Z"), // Day 45
    });

    const expectedTier1 = calculateTargetSellingPrice(totalUnitCost); // 12150
    const expectedTier2 = Math.round(expectedTier1 * 0.8 * 100) / 100; // 9720

    expect(tier2.daysListed).toBe(45);
    expect(tier2.agingTier).toBe("31_60");
    expect(tier2.targetSellingPrice).toBe(12150);
    expect(tier2.newSellingPrice).toBe(expectedTier2);
    expect(tier2.newSellingPrice).toBe(9720); // Still +8% above Total_Unit_Cost (9000)
    expect(tier2.newStatus).toBe("Listed_In_Store");
    expect(tier2.shouldCreateDismantlingTicket).toBe(false);
  });

  it("Tier 3 (61-90 Days): marks down to break-even Total_Unit_Cost clearance", () => {
    const tier3 = evaluateInventoryAging({
      listedDate,
      totalUnitCost,
      referenceTime: new Date("2026-10-15T00:00:00Z"), // Day 75
    });

    expect(tier3.daysListed).toBe(75);
    expect(tier3.agingTier).toBe("61_90");
    expect(tier3.targetSellingPrice).toBe(12150);
    expect(tier3.newSellingPrice).toBe(9000);
    expect(tier3.newStatus).toBe("Listed_In_Store");
    expect(tier3.shouldCreateDismantlingTicket).toBe(false);
  });

  it("Tier 4 (91+ Days): transitions Listed_In_Store -> Decommissioned_Aged and flags aged_out dismantling ticket", () => {
    const tier4 = evaluateInventoryAging({
      listedDate,
      totalUnitCost,
      referenceTime: new Date("2026-11-05T00:00:00Z"), // Day 96
    });

    expect(tier4.daysListed).toBe(96);
    expect(tier4.agingTier).toBe("91_plus");
    expect(tier4.newStatus).toBe("Decommissioned_Aged");
    expect(tier4.shouldCreateDismantlingTicket).toBe(true);
  });

  it("cascades fractional unit costs accurately across Tiers 1-3", () => {
    const fractionalCost = 1175; // Target = round(1175 * 1.35, 2) = 1586.25

    const t1 = evaluateInventoryAging({
      listedDate,
      totalUnitCost: fractionalCost,
      referenceTime: new Date("2026-08-10T00:00:00Z"),
    });
    expect(t1.newSellingPrice).toBe(1586.25);

    const t2 = evaluateInventoryAging({
      listedDate,
      totalUnitCost: fractionalCost,
      referenceTime: new Date("2026-09-10T00:00:00Z"),
    });
    // round(1586.25 * 0.80, 2) = 1269.00
    expect(t2.newSellingPrice).toBe(1269);

    const t3 = evaluateInventoryAging({
      listedDate,
      totalUnitCost: fractionalCost,
      referenceTime: new Date("2026-10-10T00:00:00Z"),
    });
    expect(t3.newSellingPrice).toBe(1175);
  });
});

