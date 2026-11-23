import type { CategoryRow, CustomerSegment } from "@/types/domain";

export interface AdminKpiStats {
  totalStoreSalesRevenue: number;
  totalRecyclingRevenue: number;
  avgProfitMarginEgp: number;
  soldAvgProfitMarginEgp?: number;
  totalSoldOrdersCount?: number;
  sellerOfferAcceptanceRatePct: number;
  acceptedOffersCount?: number;
  rejectedOffersCount?: number;
  autoRejectedOffersCount?: number;
  pendingOffersCount?: number;
  avgTurnaroundDays?: number | null;
  aging0to30Count: number;
  aging31to60Count: number;
  aging61to90Count: number;
  decommissionedAgedCount: number;
  totalLandfillDivertedKg: number;
  refurbishedDivertedKg?: number;
  recycledDivertedKg?: number;
  estimatedCo2SavedKg?: number;
  totalAuditLogEntries: number;
  lifecycleCounts?: Record<string, number>;
  materialDiversionKg?: Record<string, number>;
}

export interface AdminQuoteItemSummary {
  item_serial_id: string;
  title: string;
  title_ar: string | null;
  barcode: string | null;
  condition_grade: string | null;
  selling_price: number | null;
}

export interface AdminQuoteRow {
  quote_id: string;
  buyer_id: string;
  status: string;
  discount_pct: number;
  valid_until: string | null;
  created_at: string;
  buyer_name?: string | null;
  buyer_email?: string | null;
  buyer_tax_id?: string | null;
  buyer_segment?: string | null;
  items?: AdminQuoteItemSummary[];
}

export interface AdminClaimRow {
  claim_id: string;
  order_item_id: string;
  description: string;
  status: string;
  resolution_note: string | null;
  created_at: string;
  buyer_name?: string | null;
  buyer_email?: string | null;
  buyer_phone?: string | null;
  item_title?: string | null;
  item_title_ar?: string | null;
  item_barcode?: string | null;
  item_grade?: string | null;
  sold_price?: number | null;
  delivery_date?: string | null;
  warranty_end_date?: string | null;
}

export interface AdminCustomerRow {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  account_type: string;
  segment: CustomerSegment;
  tax_id: string | null;
  commercial_reg: string | null;
  created_at: string;
}

export interface AdminCampaignLogRow {
  notification_id: string;
  recipient_name: string | null;
  recipient_segment: string | null;
  channel: string;
  message: string;
  created_at: string;
}

export interface AdminBulkyRequestRow {
  request_id: string;
  tracking_code: string;
  request_type: string;
  handover_method: string | null;
  status: string;
  preverification_status: string;
  pickup_address: string | null;
  pickup_slot: string | null;
  submission_date: string;
  seller_name: string | null;
  seller_email: string | null;
  item_count: number;
  item_titles: string[];
}

export interface AdminReturnTaskRow {
  return_id: string;
  item_serial_id: string;
  fee_amount: number;
  fee_status: string;
  fee_payment_ref: string | null;
  status: string;
  created_at: string;
  item_title: string | null;
  item_barcode: string | null;
  item_status: string | null;
}

export interface AdminInventoryRow {
  item_serial_id: string;
  title: string;
  title_ar: string | null;
  barcode: string | null;
  category_name: string | null;
  category_name_ar: string | null;
  current_status: string;
  condition_grade: string | null;
  aging_tier: string | null;
  final_purchase_price: number | null;
  logistics_cost: number;
  refurbishment_cost: number;
  total_unit_cost: number | null;
  selling_price: number | null;
  weight_kg: number | null;
  data_wiped_bool: boolean;
  created_at: string;
}

export interface AdminAuditLogRow {
  history_id: string;
  item_serial_id: string;
  item_title: string | null;
  item_barcode: string | null;
  from_status: string | null;
  to_status: string;
  note: string | null;
  changed_at: string;
  actor_name: string | null;
  actor_role: string | null;
}

export interface AdminPortalClientProps {
  activeRole: string;
  kpis: AdminKpiStats;
  categories: CategoryRow[];
  quotes: AdminQuoteRow[];
  claims: AdminClaimRow[];
  customers?: AdminCustomerRow[];
  campaignLogs?: AdminCampaignLogRow[];
  bulkyRequests?: AdminBulkyRequestRow[];
  returnTasks?: AdminReturnTaskRow[];
  inventoryItems?: AdminInventoryRow[];
  auditLogs?: AdminAuditLogRow[];
}

