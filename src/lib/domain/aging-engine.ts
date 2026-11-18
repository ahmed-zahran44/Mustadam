import { calculateTargetSellingPrice } from "@/lib/domain/pricing-engine";
import type { AgingTier, ItemLifecycleStatus } from "@/types/domain";

export interface AgingEvaluationResult {
  daysListed: number;
  agingTier: AgingTier;
  targetSellingPrice: number;
  newSellingPrice: number;
  newStatus: ItemLifecycleStatus;
  shouldCreateDismantlingTicket: boolean;
}

/**
 * FR-19 & ADR-009 30-60-90 Day Inventory Aging Policy (35% Tier 1 Markup Cascade):
 * - 0-30 days (Tier 1): Target_Selling_Price = round(Total_Unit_Cost * 1.35, 2)
 * - 31-60 days (Tier 2): 20% markdown -> round(Target_Selling_Price * 0.80, 2)
 * - 61-90 days (Tier 3): Clearance at Total_Unit_Cost
 * - 91+ days (Tier 4): Transitions Listed_In_Store -> Decommissioned_Aged and creates aged_out dismantling ticket
 */
export function evaluateInventoryAging(input: {
  listedDate: Date | string;
  totalUnitCost: number;
  targetSellingPrice?: number;
  referenceTime?: Date;
}): AgingEvaluationResult {
  const listed =
    typeof input.listedDate === "string"
      ? new Date(input.listedDate)
      : input.listedDate;
  const ref = input.referenceTime ?? new Date();
  const diffMs = Math.max(0, ref.getTime() - listed.getTime());
  const daysListed = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const targetSellingPrice =
    input.targetSellingPrice !== undefined
      ? Math.round(input.targetSellingPrice * 100) / 100
      : calculateTargetSellingPrice(input.totalUnitCost);

  const unitCostRounded = Math.round(input.totalUnitCost * 100) / 100;

  if (daysListed <= 30) {
    return {
      daysListed,
      agingTier: "0_30",
      targetSellingPrice,
      newSellingPrice: targetSellingPrice,
      newStatus: "Listed_In_Store",
      shouldCreateDismantlingTicket: false,
    };
  }

  if (daysListed <= 60) {
    return {
      daysListed,
      agingTier: "31_60",
      targetSellingPrice,
      newSellingPrice: Math.round(targetSellingPrice * 0.8 * 100) / 100,
      newStatus: "Listed_In_Store",
      shouldCreateDismantlingTicket: false,
    };
  }

  if (daysListed <= 90) {
    return {
      daysListed,
      agingTier: "61_90",
      targetSellingPrice,
      newSellingPrice: unitCostRounded,
      newStatus: "Listed_In_Store",
      shouldCreateDismantlingTicket: false,
    };
  }

  return {
    daysListed,
    agingTier: "91_plus",
    targetSellingPrice,
    newSellingPrice: unitCostRounded,
    newStatus: "Decommissioned_Aged",
    shouldCreateDismantlingTicket: true,
  };
}

