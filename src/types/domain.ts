import type { Database, Json } from "./database.types";

export type { Json };

/**
 * 8 Clean Database RBAC Roles (ADR-006, FR-01, FR-02)
 */
export type UserRole =
  | "Customer"
  | "Partner_Inspector"
  | "Partner_Refurb_Tech"
  | "Partner_Dismantle_Tech"
  | "Partner_Warehouse_Mgr"
  | "Courier"
  | "Customer_Service"
  | "Admin";

export type AccountType = "Individual" | "Company";

export type CustomerSegment = "Individual" | "Startup" | "Enterprise";

/**
 * 14 Strict Serialized Item Lifecycle States (PROJECT.md Section 5, FR-12, FR-19)
 */
export type ItemLifecycleStatus =
  | "Submitted"
  | "Awaiting_Handover"
  | "Received_At_Dropoff_Hub"
  | "In_Transit_To_Warehouse"
  | "Received_Pending_Inspection"
  | "Awaiting_Seller_Decision"
  | "Return_In_Progress"
  | "Listed_In_Store"
  | "Under_Refurbishment"
  | "Pending_Dismantling"
  | "Sold"
  | "Decommissioned_Aged"
  | "Scrap_Ready_For_Recycling"
  | "Recycled_Closed";

export type ConditionGrade = "A" | "B" | "C";

export type AgingTier = "0_30" | "31_60" | "61_90" | "91_plus";

export type SellerDecision =
  | "pending"
  | "accepted"
  | "rejected"
  | "auto_rejected";

export type TechnicalClassification =
  | "Ready_For_Sale"
  | "Repairable"
  | "Irreparable";

export type PaymentMethod = "Card" | "Wallet" | "InstaPay";

export type PaymentStatus = "Pending_Payment" | "SUCCESS" | "FAILED" | "Expired";

export interface DiagnosticQuestion {
  id: string;
  question_en: string;
  question_ar: string;
  type: "boolean";
  deduction_pct: number;
}

/**
 * 12 Graduation Demo Toolbar Personas (ADR-006, FR-01)
 */
export interface DemoPersona {
  id: string;
  userId: string;
  email: string;
  labelEn: string;
  labelAr: string;
  role: UserRole;
  accountType: AccountType;
  defaultRoute: "/seller" | "/store" | "/partner" | "/admin";
}

export type UserProfile = Database["public"]["Tables"]["users"]["Row"];
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type SerializedItemRow =
  Database["public"]["Tables"]["serialized_items"]["Row"];
export type AcquisitionRequestRow =
  Database["public"]["Tables"]["acquisition_requests"]["Row"];
