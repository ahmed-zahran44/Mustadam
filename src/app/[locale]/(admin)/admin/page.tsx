import { AdminPortalClient } from "@/components/admin/admin-portal-client";
import type {
  AdminAuditLogRow,
  AdminBulkyRequestRow,
  AdminCampaignLogRow,
  AdminClaimRow,
  AdminCustomerRow,
  AdminInventoryRow,
  AdminQuoteRow,
  AdminReturnTaskRow,
} from "@/components/admin/admin-types";
import { getActiveSessionProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CustomerSegment } from "@/types/domain";

export default async function AdminPortalPage() {
  const session = await getActiveSessionProfile();
  const supabase = await createSupabaseServerClient();

  const [
    { data: items },
    { data: orders },
    { data: orderItems },
    { data: recyclingBatches },
    { data: scrapEntries },
    { data: categories },
    { data: quotes },
    { data: claims },
    { data: customersRaw },
    { data: campaignNotifsRaw },
    { data: bulkyReqsRaw },
    { data: returnTasksRaw },
    { data: recentHistoryRaw, count: historyCount },
  ] = await Promise.all([
    supabase
      .from("serialized_items")
      .select(
        "item_serial_id, title, title_ar, barcode, current_status, condition_grade, aging_tier, final_purchase_price, logistics_cost, refurbishment_cost, selling_price, total_unit_cost, seller_decision, weight_kg, data_wiped_bool, created_at, categories(name, name_ar)",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("order_id, total_amount, payment_status, paid_at, created_at")
      .eq("payment_status", "SUCCESS"),
    supabase
      .from("order_items_warranty")
      .select(
        "order_item_id, order_id, item_serial_id, sold_price, delivery_date, warranty_end_date",
      ),
    supabase
      .from("recycling_batches")
      .select("material_type, total_weight_kg, revenue_amount"),
    supabase
      .from("scrap_entries")
      .select("material_type, weight_kg, batch_id"),
    supabase.from("categories").select("*").order("name"),
    supabase
      .from("quote_requests")
      .select(
        "quote_id, buyer_id, status, discount_pct, valid_until, created_at, users(name, email, tax_id, segment), quote_items(item_serial_id, serialized_items(title, title_ar, barcode, condition_grade, selling_price))",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("warranty_claims")
      .select(
        "claim_id, order_item_id, description, status, resolution_note, created_at, users!warranty_claims_buyer_id_fkey(name, email, phone), order_items_warranty(sold_price, delivery_date, warranty_end_date, serialized_items(title, title_ar, barcode, condition_grade))",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("users")
      .select(
        "user_id, name, email, phone, account_type, segment, tax_id, commercial_reg, created_at",
      )
      .eq("role", "Customer")
      .order("created_at", { ascending: false }),
    supabase
      .from("notifications")
      .select(
        "notification_id, channel, message, created_at, users(name, segment)",
      )
      .eq("type", "campaign")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("acquisition_requests")
      .select(
        "request_id, tracking_code, request_type, handover_method, status, preverification_status, pickup_address, pickup_slot, submission_date, users!acquisition_requests_seller_id_fkey(name, email), serialized_items(title)",
      )
      .or("handover_method.eq.Batch_Truck,preverification_status.neq.not_required")
      .order("submission_date", { ascending: false })
      .limit(30),
    supabase
      .from("return_tasks")
      .select(
        "return_id, item_serial_id, fee_amount, fee_status, fee_payment_ref, status, created_at, serialized_items(title, barcode, current_status)",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("item_status_history")
      .select(
        "history_id, item_serial_id, from_status, to_status, note, changed_at, serialized_items(title, barcode), users(name, role)",
        { count: "exact" },
      )
      .order("changed_at", { ascending: false })
      .limit(40),
  ]);

  const allItems = items ?? [];
  const paidOrders = orders ?? [];
  const allOrderItems = orderItems ?? [];
  const batches = recyclingBatches ?? [];
  const scraps = scrapEntries ?? [];

  // Financial KPIs
  const totalStoreSalesRevenue = paidOrders.reduce(
    (sum, o) => sum + Number(o.total_amount ?? 0),
    0,
  );
  const totalRecyclingRevenue = batches.reduce(
    (sum, b) => sum + Number(b.revenue_amount ?? 0),
    0,
  );

  const pricedItems = allItems.filter(
    (i) => i.selling_price !== null && i.total_unit_cost !== null,
  );
  const avgProfitMarginEgp =
    pricedItems.length > 0
      ? Math.round(
          pricedItems.reduce(
            (sum, i) =>
              sum +
              (Number(i.selling_price ?? 0) - Number(i.total_unit_cost ?? 0)),
            0,
          ) / pricedItems.length,
        )
      : 0;

  const itemCostMap = new Map(
    allItems.map((i) => [
      i.item_serial_id,
      {
        unitCost: i.total_unit_cost !== null ? Number(i.total_unit_cost) : null,
        createdAt: i.created_at,
      },
    ]),
  );
  const paidOrderMap = new Map(
    paidOrders.map((o) => [o.order_id, o.paid_at ?? o.created_at]),
  );

  const soldMargins: number[] = [];
  const turnaroundDaysList: number[] = [];

  for (const oi of allOrderItems) {
    const paidTimestamp = paidOrderMap.get(oi.order_id);
    if (!paidTimestamp) continue;
    const itemMeta = itemCostMap.get(oi.item_serial_id);
    if (itemMeta?.unitCost !== null && itemMeta?.unitCost !== undefined) {
      soldMargins.push(Number(oi.sold_price) - itemMeta.unitCost);
    }
    if (itemMeta?.createdAt) {
      const diffMs =
        new Date(paidTimestamp).getTime() -
        new Date(itemMeta.createdAt).getTime();
      if (diffMs >= 0) {
        turnaroundDaysList.push(diffMs / (1000 * 60 * 60 * 24));
      }
    }
  }

  const soldAvgProfitMarginEgp =
    soldMargins.length > 0
      ? Math.round(
          soldMargins.reduce((sum, m) => sum + m, 0) / soldMargins.length,
        )
      : avgProfitMarginEgp;

  const avgTurnaroundDays =
    turnaroundDaysList.length > 0
      ? Number(
          (
            turnaroundDaysList.reduce((sum, d) => sum + d, 0) /
            turnaroundDaysList.length
          ).toFixed(1),
        )
      : null;

  // Offer Decision Funnel KPIs
  const acceptedOffersCount = allItems.filter(
    (i) => i.seller_decision === "accepted",
  ).length;
  const rejectedOffersCount = allItems.filter(
    (i) => i.seller_decision === "rejected",
  ).length;
  const autoRejectedOffersCount = allItems.filter(
    (i) => i.seller_decision === "auto_rejected",
  ).length;
  const pendingOffersCount = allItems.filter(
    (i) => i.seller_decision === "pending",
  ).length;

  const decidedTotal =
    acceptedOffersCount + rejectedOffersCount + autoRejectedOffersCount;
  const sellerOfferAcceptanceRatePct =
    decidedTotal > 0
      ? Math.round((acceptedOffersCount / decidedTotal) * 100)
      : 0;

  // Inventory Aging KPIs
  const aging0to30Count = allItems.filter(
    (i) => i.current_status === "Listed_In_Store" && i.aging_tier === "0_30",
  ).length;
  const aging31to60Count = allItems.filter(
    (i) => i.current_status === "Listed_In_Store" && i.aging_tier === "31_60",
  ).length;
  const aging61to90Count = allItems.filter(
    (i) => i.current_status === "Listed_In_Store" && i.aging_tier === "61_90",
  ).length;
  const decommissionedAgedCount = allItems.filter(
    (i) => i.current_status === "Decommissioned_Aged",
  ).length;

  // Lifecycle Breakdown Map
  const lifecycleCounts: Record<string, number> = {};
  for (const it of allItems) {
    lifecycleCounts[it.current_status] =
      (lifecycleCounts[it.current_status] ?? 0) + 1;
  }

  // Environmental Impact KPIs (Refurbished Hardware + Licensed Scrap Recycling, no double counting)
  const refurbishedDivertedKg = Number(
    allItems
      .filter((i) =>
        ["Listed_In_Store", "Sold", "Under_Refurbishment"].includes(
          i.current_status,
        ),
      )
      .reduce((sum, i) => sum + Number(i.weight_kg ?? 0), 0)
      .toFixed(1),
  );

  const batchWeightKg = batches.reduce(
    (sum, b) => sum + Number(b.total_weight_kg ?? 0),
    0,
  );
  const unbatchedScrapKg = scraps
    .filter((s) => !s.batch_id)
    .reduce((sum, s) => sum + Number(s.weight_kg ?? 0), 0);
  const recycledDivertedKg = Number(
    (batchWeightKg + unbatchedScrapKg).toFixed(1),
  );

  const totalLandfillDivertedKg = Number(
    (refurbishedDivertedKg + recycledDivertedKg).toFixed(1),
  );
  // Conservative lifecycle factor: ~4.2 kg CO2e avoided per kg of refurbished/recycled hardware & furniture
  const estimatedCo2SavedKg = Math.round(totalLandfillDivertedKg * 4.2);

  const materialDiversionKg: Record<string, number> = {};
  if (refurbishedDivertedKg > 0) {
    materialDiversionKg["Refurbished Hardware & Furniture"] =
      refurbishedDivertedKg;
  }
  for (const b of batches) {
    const key = b.material_type ?? "Mixed";
    materialDiversionKg[key] =
      (materialDiversionKg[key] ?? 0) + Number(b.total_weight_kg ?? 0);
  }
  for (const s of scraps) {
    if (s.batch_id) continue;
    const key = s.material_type ?? "E-waste";
    materialDiversionKg[key] =
      (materialDiversionKg[key] ?? 0) + Number(s.weight_kg ?? 0);
  }

  // Transform Enriched Quotes
  const enrichedQuotes: AdminQuoteRow[] = (quotes ?? []).map((q) => {
    const buyer = q.users as {
      name?: string;
      email?: string;
      tax_id?: string | null;
      segment?: string;
    } | null;
    const quoteItems = (
      (q.quote_items as Array<{
        item_serial_id: string;
        serialized_items: {
          title: string;
          title_ar: string | null;
          barcode: string | null;
          condition_grade: string | null;
          selling_price: number | null;
        } | null;
      }> | null) ?? []
    )
      .filter((qi) => qi.serialized_items)
      .map((qi) => ({
        item_serial_id: qi.item_serial_id,
        title: qi.serialized_items!.title,
        title_ar: qi.serialized_items!.title_ar,
        barcode: qi.serialized_items!.barcode,
        condition_grade: qi.serialized_items!.condition_grade,
        selling_price: qi.serialized_items!.selling_price,
      }));

    return {
      quote_id: q.quote_id,
      buyer_id: q.buyer_id,
      status: q.status,
      discount_pct: Number(q.discount_pct ?? 0),
      valid_until: q.valid_until,
      created_at: q.created_at,
      buyer_name: buyer?.name ?? null,
      buyer_email: buyer?.email ?? null,
      buyer_tax_id: buyer?.tax_id ?? null,
      buyer_segment: buyer?.segment ?? null,
      items: quoteItems,
    };
  });

  // Transform Enriched Claims
  const enrichedClaims: AdminClaimRow[] = (claims ?? []).map((c) => {
    const buyer = c.users as {
      name?: string;
      email?: string;
      phone?: string;
    } | null;
    const orderItem = c.order_items_warranty as {
      sold_price?: number;
      delivery_date?: string | null;
      warranty_end_date?: string | null;
      serialized_items?: {
        title?: string;
        title_ar?: string | null;
        barcode?: string | null;
        condition_grade?: string | null;
      } | null;
    } | null;

    return {
      claim_id: c.claim_id,
      order_item_id: c.order_item_id,
      description: c.description,
      status: c.status,
      resolution_note: c.resolution_note,
      created_at: c.created_at,
      buyer_name: buyer?.name ?? null,
      buyer_email: buyer?.email ?? null,
      buyer_phone: buyer?.phone ?? null,
      item_title: orderItem?.serialized_items?.title ?? null,
      item_title_ar: orderItem?.serialized_items?.title_ar ?? null,
      item_barcode: orderItem?.serialized_items?.barcode ?? null,
      item_grade: orderItem?.serialized_items?.condition_grade ?? null,
      sold_price: orderItem?.sold_price ?? null,
      delivery_date: orderItem?.delivery_date ?? null,
      warranty_end_date: orderItem?.warranty_end_date ?? null,
    };
  });

  const customers: AdminCustomerRow[] = (customersRaw ?? []).map((u) => ({
    user_id: u.user_id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    account_type: u.account_type,
    segment: u.segment as CustomerSegment,
    tax_id: u.tax_id,
    commercial_reg: u.commercial_reg,
    created_at: u.created_at,
  }));

  const campaignLogs: AdminCampaignLogRow[] = (campaignNotifsRaw ?? []).map(
    (n) => {
      const recipient = n.users as {
        name?: string;
        segment?: string;
      } | null;
      return {
        notification_id: n.notification_id,
        recipient_name: recipient?.name ?? null,
        recipient_segment: recipient?.segment ?? null,
        channel: n.channel,
        message: n.message,
        created_at: n.created_at,
      };
    },
  );

  const bulkyRequests: AdminBulkyRequestRow[] = (bulkyReqsRaw ?? []).map(
    (r) => {
      const seller = r.users as { name?: string; email?: string } | null;
      const reqItems =
        (r.serialized_items as Array<{ title: string }> | null) ?? [];
      return {
        request_id: r.request_id,
        tracking_code: r.tracking_code,
        request_type: r.request_type,
        handover_method: r.handover_method,
        status: r.status,
        preverification_status: r.preverification_status,
        pickup_address: r.pickup_address,
        pickup_slot: r.pickup_slot,
        submission_date: r.submission_date,
        seller_name: seller?.name ?? null,
        seller_email: seller?.email ?? null,
        item_count: reqItems.length,
        item_titles: reqItems.map((it) => it.title),
      };
    },
  );

  const returnTasks: AdminReturnTaskRow[] = (returnTasksRaw ?? []).map((rt) => {
    const si = rt.serialized_items as {
      title?: string;
      barcode?: string | null;
      current_status?: string;
    } | null;
    return {
      return_id: rt.return_id,
      item_serial_id: rt.item_serial_id,
      fee_amount: Number(rt.fee_amount ?? 0),
      fee_status: rt.fee_status,
      fee_payment_ref: rt.fee_payment_ref,
      status: rt.status,
      created_at: rt.created_at,
      item_title: si?.title ?? null,
      item_barcode: si?.barcode ?? null,
      item_status: si?.current_status ?? null,
    };
  });

  const inventoryItems: AdminInventoryRow[] = allItems.map((it) => {
    const cat = it.categories as { name?: string; name_ar?: string } | null;
    return {
      item_serial_id: it.item_serial_id,
      title: it.title,
      title_ar: it.title_ar,
      barcode: it.barcode,
      category_name: cat?.name ?? null,
      category_name_ar: cat?.name_ar ?? null,
      current_status: it.current_status,
      condition_grade: it.condition_grade,
      aging_tier: it.aging_tier,
      final_purchase_price: it.final_purchase_price,
      logistics_cost: Number(it.logistics_cost ?? 0),
      refurbishment_cost: Number(it.refurbishment_cost ?? 0),
      total_unit_cost: it.total_unit_cost,
      selling_price: it.selling_price,
      weight_kg: it.weight_kg,
      data_wiped_bool: it.data_wiped_bool,
      created_at: it.created_at,
    };
  });

  const auditLogs: AdminAuditLogRow[] = (recentHistoryRaw ?? []).map((h) => {
    const si = h.serialized_items as {
      title?: string;
      barcode?: string | null;
    } | null;
    const actor = h.users as { name?: string; role?: string } | null;
    return {
      history_id: h.history_id,
      item_serial_id: h.item_serial_id,
      item_title: si?.title ?? null,
      item_barcode: si?.barcode ?? null,
      from_status: h.from_status,
      to_status: h.to_status,
      note: h.note,
      changed_at: h.changed_at,
      actor_name: actor?.name ?? null,
      actor_role: actor?.role ?? null,
    };
  });

  return (
    <AdminPortalClient
      activeRole={session?.role ?? "Admin"}
      kpis={{
        totalStoreSalesRevenue,
        totalRecyclingRevenue,
        avgProfitMarginEgp,
        soldAvgProfitMarginEgp,
        totalSoldOrdersCount: paidOrders.length,
        sellerOfferAcceptanceRatePct,
        acceptedOffersCount,
        rejectedOffersCount,
        autoRejectedOffersCount,
        pendingOffersCount,
        avgTurnaroundDays,
        aging0to30Count,
        aging31to60Count,
        aging61to90Count,
        decommissionedAgedCount,
        totalLandfillDivertedKg,
        refurbishedDivertedKg,
        recycledDivertedKg,
        estimatedCo2SavedKg,
        totalAuditLogEntries: historyCount ?? auditLogs.length,
        lifecycleCounts,
        materialDiversionKg,
      }}
      categories={categories ?? []}
      quotes={enrichedQuotes}
      claims={enrichedClaims}
      customers={customers}
      campaignLogs={campaignLogs}
      bulkyRequests={bulkyRequests}
      returnTasks={returnTasks}
      inventoryItems={inventoryItems}
      auditLogs={auditLogs}
    />
  );
}
