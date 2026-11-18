import { PartnerPortalClient } from "@/components/partner/partner-portal-client";
import { getActiveSessionProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PartnerPortalPage() {
  const session = await getActiveSessionProfile();
  const supabase = await createSupabaseServerClient();

  const [
    { data: items },
    { data: manifests },
    { data: refurbTickets },
    { data: dismantleTickets },
    { data: spareParts },
  ] = await Promise.all([
    supabase
      .from("serialized_items")
      .select(
        "item_serial_id, title, barcode, current_status, category_id, estimated_min_price, estimated_max_price, final_purchase_price, logistics_cost, refurbishment_cost, data_wiped_bool, categories(name, requires_data_wipe)",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("pickup_manifests")
      .select("*")
      .order("scheduled_date", { ascending: false }),
    supabase
      .from("refurbishment_logs")
      .select("*")
      .order("opened_at", { ascending: false }),
    supabase
      .from("dismantling_tickets")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("spare_parts_inventory").select("*"),
  ]);

  return (
    <PartnerPortalClient
      activeRole={session?.role ?? "Partner_Inspector"}
      items={items ?? []}
      manifests={manifests ?? []}
      refurbTickets={refurbTickets ?? []}
      dismantleTickets={dismantleTickets ?? []}
      spareParts={spareParts ?? []}
    />
  );
}
