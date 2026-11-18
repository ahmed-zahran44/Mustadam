/**
 * FR-23 & FR-24 Automated Post-Sale Warranty Engine:
 * Warranty_End_Date = Delivery_Date + Category.warranty_days
 */
export function calculateWarrantyEndDate(
  deliveryDate: Date | string,
  warrantyDays: number,
): string {
  const start =
    typeof deliveryDate === "string" ? new Date(deliveryDate) : deliveryDate;
  const end = new Date(start.getTime() + warrantyDays * 24 * 60 * 60 * 1000);
  return end.toISOString().split("T")[0];
}

export function isWarrantyActive(
  warrantyEndDate: string | null | undefined,
  referenceDate: Date = new Date(),
): boolean {
  if (!warrantyEndDate) return false;
  const end = new Date(`${warrantyEndDate}T23:59:59.999Z`);
  return referenceDate.getTime() <= end.getTime();
}

