import type { ItemLifecycleStatus } from "@/types/domain";

/**
 * Strict Serialized Item State Transition Matrix (PROJECT.md Section 5, NFR-02, FR-12, FR-19)
 */
export const ALLOWED_ITEM_TRANSITIONS: Record<
  ItemLifecycleStatus,
  ItemLifecycleStatus[]
> = {
  Submitted: ["Awaiting_Handover"],
  Awaiting_Handover: ["Received_At_Dropoff_Hub", "In_Transit_To_Warehouse"],
  Received_At_Dropoff_Hub: ["In_Transit_To_Warehouse"],
  In_Transit_To_Warehouse: ["Received_Pending_Inspection"],
  Received_Pending_Inspection: ["Awaiting_Seller_Decision"],
  Awaiting_Seller_Decision: [
    "Return_In_Progress",
    "Listed_In_Store",
    "Under_Refurbishment",
    "Pending_Dismantling",
  ],
  Return_In_Progress: [],
  Under_Refurbishment: ["Listed_In_Store"],
  Listed_In_Store: ["Sold", "Decommissioned_Aged"],
  Sold: [],
  Decommissioned_Aged: ["Scrap_Ready_For_Recycling"],
  Pending_Dismantling: ["Scrap_Ready_For_Recycling"],
  Scrap_Ready_For_Recycling: ["Recycled_Closed"],
  Recycled_Closed: [],
};

export function canTransitionItemStatus(
  fromStatus: ItemLifecycleStatus,
  toStatus: ItemLifecycleStatus,
): boolean {
  return ALLOWED_ITEM_TRANSITIONS[fromStatus]?.includes(toStatus) ?? false;
}

/**
 * FR-12 7-Day (168-Hour) Seller Offer Expiry Calculator
 */
export function calculateOfferExpiryDate(inspectedAt: Date): Date {
  return new Date(inspectedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
}

export function isOfferExpired(
  offerExpiresAt: string | Date,
  referenceTime: Date = new Date(),
): boolean {
  const expiry =
    typeof offerExpiresAt === "string"
      ? new Date(offerExpiresAt)
      : offerExpiresAt;
  return referenceTime.getTime() > expiry.getTime();
}

