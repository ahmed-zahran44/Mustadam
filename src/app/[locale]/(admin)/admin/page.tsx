import { AdminPortalClient } from "@/components/admin/admin-portal-client";
import { getActiveSessionProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminPortalPage() {
  const session = await getActiveSessionProfile();
  const supabase = await createSupabaseServerClient();

  const [
    { data: items },
    { data: orders },
    { data: recyclingBatches },
    { data: categories },
    { data: quotes },
    { data: claims },
    { count: historyCount },
  ] = await Promise.all([
    supabase
      .from("serialized_items")
      .select(
        "item_serial_id, current_status, aging_tier, selling_price, total_unit_cost, seller_decision, weight_kg",
      ),
    supabase
      .from("orders")
      .select("total_amount, payment_status")
      .eq("payment_status", "SUCCESS"),
    supabase
      .from("recycling_batches")
      .select("total_weight_kg, revenue_amount"),
    supabase.from("categories").select("*").order("name"),
    supabase
      .from("quote_requests")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("warranty_claims")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("item_status_history")
      .select("*", { count: "exact", head: true }),
  ]);

  const allItems = items ?? [];
  const paidOrders = orders ?? [];
  const batches = recyclingBatches ?? [];

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
      : 1850;

  const decidedOffers = allItems.filter((i) =>
    ["accepted", "rejected", "auto_rejected"].includes(
      i.seller_decision ?? "",
    ),
  );
  const acceptedOffers = decidedOffers.filter(
    (i) => i.seller_decision === "accepted",
  );
  const sellerOfferAcceptanceRatePct =
    decidedOffers.length > 0
      ? Math.round((acceptedOffers.length / decidedOffers.length) * 100)
      : 100;

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

  const itemsDivertedWeight = allItems
    .filter((i) =>
      [
        "Listed_In_Store",
        "Sold",
        "Under_Refurbishment",
        "Scrap_Ready_For_Recycling",
        "Recycled_Closed",
      ].includes(i.current_status),
    )
    .reduce((sum, i) => sum + Number(i.weight_kg ?? 3.5), 0);

  const batchWeight = batches.reduce(
    (sum, b) => sum + Number(b.total_weight_kg ?? 0),
    0,
  );

  return (
    <AdminPortalClient
      activeRole={session?.role ?? "Admin"}
      kpis={{
        totalStoreSalesRevenue,
        totalRecyclingRevenue,
        avgProfitMarginEgp,
        sellerOfferAcceptanceRatePct,
        aging0to30Count,
        aging31to60Count,
        aging61to90Count,
        decommissionedAgedCount,
        totalLandfillDivertedKg: Number(
          (itemsDivertedWeight + batchWeight).toFixed(1),
        ),
        totalAuditLogEntries: historyCount ?? 3,
      }}
      categories={categories ?? []}
      quotes={quotes ?? []}
      claims={claims ?? []}
    />
  );
}
