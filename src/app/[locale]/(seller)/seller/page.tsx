import { SellerPortalClient } from "@/components/seller/seller-portal-client";
import { getActiveSessionProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SellerPortalPage() {
  const session = await getActiveSessionProfile();
  const supabase = await createSupabaseServerClient();

  const [{ data: categories }, { data: dropoffHubs }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase
      .from("partner_hubs")
      .select("hub_id, name, name_ar, city, zone")
      .eq("is_dropoff", true)
      .order("name"),
  ]);

  let myItems: Array<{
    item_serial_id: string;
    title: string;
    title_ar: string | null;
    barcode: string | null;
    current_status: string;
    estimated_min_price: number;
    estimated_max_price: number;
    final_purchase_price: number | null;
    seller_decision: string | null;
    offer_expires_at: string | null;
    data_wiped_bool: boolean;
    created_at: string;
  }> = [];

  let returnTasks: Array<{
    return_id: string;
    item_serial_id: string;
    fee_amount: number;
    fee_status: string;
    status: string;
  }> = [];

  if (session?.userId) {
    const { data: items } = await supabase
      .from("serialized_items")
      .select(
        "item_serial_id, title, title_ar, barcode, current_status, estimated_min_price, estimated_max_price, final_purchase_price, seller_decision, offer_expires_at, data_wiped_bool, created_at, acquisition_requests!inner(seller_id)",
      )
      .eq("acquisition_requests.seller_id", session.userId)
      .order("created_at", { ascending: false });

    myItems = items ?? [];

    const { data: returns } = await supabase
      .from("return_tasks")
      .select("return_id, item_serial_id, fee_amount, fee_status, status")
      .order("created_at", { ascending: false });

    returnTasks = returns ?? [];
  }

  return (
    <SellerPortalClient
      accountType={session?.profile?.account_type ?? "Individual"}
      categories={categories ?? []}
      dropoffHubs={dropoffHubs ?? []}
      myItems={myItems}
      returnTasks={returnTasks}
    />
  );
}
