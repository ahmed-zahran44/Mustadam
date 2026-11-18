import type { DiagnosticQuestion } from "@/types/domain";

export interface DiagnosticPriceInput {
  baseReferencePrice: number;
  questions: DiagnosticQuestion[];
  answers: Record<string, boolean>;
}

export interface DiagnosticPriceRangeResult {
  estimatedMinPrice: number;
  estimatedMaxPrice: number;
  totalDeductionPct: number;
  adjustedValue: number;
  disclaimerEn: string;
  disclaimerAr: string;
}

/**
 * FR-04 Automated Initial Price Range Estimation:
 * - Total_Deduction_Pct = clamp(sum(deduction_pct for failed answers), 0, 0.85)
 * - Adjusted_Value = Base_Reference_Price * (1 - Total_Deduction_Pct)
 * - Estimated_Min_Price = round(Adjusted_Value * 0.90, 2)
 * - Estimated_Max_Price = round(Adjusted_Value * 1.10, 2)
 */
export function calculateEstimatedPriceRange(
  input: DiagnosticPriceInput,
): DiagnosticPriceRangeResult {
  const rawDeduction = input.questions.reduce((acc, q) => {
    const passed = input.answers[q.id] === true;
    return passed ? acc : acc + q.deduction_pct;
  }, 0);

  const totalDeductionPct = Math.min(Math.max(rawDeduction, 0), 0.85);
  const adjustedValue = Number(
    (input.baseReferencePrice * (1 - totalDeductionPct)).toFixed(2),
  );
  const estimatedMinPrice = Number((adjustedValue * 0.9).toFixed(2));
  const estimatedMaxPrice = Number((adjustedValue * 1.1).toFixed(2));

  return {
    estimatedMinPrice,
    estimatedMaxPrice,
    totalDeductionPct: Number(totalDeductionPct.toFixed(4)),
    adjustedValue,
    disclaimerEn:
      "Subject to physical inspection at the partner hub. Final purchase offer is valid for 7 days (168 hours) after inspection.",
    disclaimerAr:
      "يخضع السعر للفحص الفني الفعلي في مركز الشريك. العرض النهائي صالح لمدة ٧ أيام (١٦٨ ساعة) من تاريخ الفحص.",
  };
}

/**
 * FR-08 & FR-17 Equal Bulky Batch Logistics Cost Allocation:
 * Allocated_Logistics_Cost = Total_Batch_Cost / Items_Count_In_Batch
 */
export function calculateAllocatedBatchLogisticsCost(
  totalBatchCost: number,
  itemsCountInBatch: number,
): number {
  if (itemsCountInBatch <= 0 || totalBatchCost <= 0) return 0;
  return Number((totalBatchCost / itemsCountInBatch).toFixed(2));
}

/**
 * FR-17 & ADR-009 Tier 1 Target Selling Price Calculation (35% Markup on Cost):
 * Target_Selling_Price = round(Total_Unit_Cost * 1.35, 2)
 */
export function calculateTargetSellingPrice(
  totalUnitCost: number,
  markupPct: number = 0.35,
): number {
  return Math.round(totalUnitCost * (1 + markupPct) * 100) / 100;
}

/**
 * FR-14, FR-15 & FR-17 Total Unit Cost & Tier 1 Target Selling Price Calculation:
 * Total_Unit_Cost = Final_Purchase_Price + Allocated_Logistics_Cost + Refurbishment_Cost
 * where Refurbishment_Cost = Labor_Cost + External_Parts_Cost + sum(Consumed_Harvested_Part.estimated_cost)
 * Target_Selling_Price = round(Total_Unit_Cost * 1.35, 2)
 */
export function calculateTotalUnitCost(input: {
  finalPurchasePrice: number;
  allocatedLogisticsCost: number;
  laborCost: number;
  externalPartsCost?: number;
  harvestedPartsEstimatedCosts?: number[];
}): {
  partsCost: number;
  refurbishmentCost: number;
  totalUnitCost: number;
  targetSellingPrice: number;
} {
  const harvestedSum = (input.harvestedPartsEstimatedCosts ?? []).reduce(
    (sum, cost) => sum + cost,
    0,
  );
  const partsCost = Number(
    ((input.externalPartsCost ?? 0) + harvestedSum).toFixed(2),
  );
  const refurbishmentCost = Number((input.laborCost + partsCost).toFixed(2));
  const totalUnitCost = Number(
    (
      input.finalPurchasePrice +
      input.allocatedLogisticsCost +
      refurbishmentCost
    ).toFixed(2),
  );
  const targetSellingPrice = calculateTargetSellingPrice(totalUnitCost);

  return { partsCost, refurbishmentCost, totalUnitCost, targetSellingPrice };
}

/**
 * FR-12 Return Transport & Inspection Fee Calculator (Rejected / 7-Day Auto-Rejected Offer)
 */
export function calculateReturnFee(isBulky: boolean): number {
  return isBulky ? 300 : 150;
}

