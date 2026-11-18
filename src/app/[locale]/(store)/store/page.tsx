import { StorefrontClient } from "@/components/store/storefront-client";
import { getActiveSessionProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function StorePage() {
  const session = await getActiveSessionProfile();
  const supabase = await createSupabaseServerClient();

  const { data: catalogItems } = await supabase
    .from("serialized_items")
    .select(
      "item_serial_id, title, title_ar, barcode, category_id, condition_grade, selling_price, target_selling_price, total_unit_cost, aging_tier, listed_date, diagnostic_answers, categories(name, name_ar, warranty_days)",
    )
    .eq("current_status", "Listed_In_Store")
    .order("listed_date", { ascending: false });

  let orders: Array<{
    order_id: string;
    total_amount: number;
    payment_method: string;
    payment_status: string;
    payment_transaction_ref: string | null;
    reserved_until: string;
    invoice_url: string | null;
    created_at: string;
    order_items_warranty: Array<{
      order_item_id: string;
      item_serial_id: string;
      sold_price: number;
      delivery_date: string | null;
      warranty_end_date: string | null;
    }>;
  }> = [];

  let quotes: Array<{
    quote_id: string;
    status: string;
    discount_pct: number;
    valid_until: string | null;
    created_at: string;
  }> = [];

  if (session?.userId) {
    const [{ data: ordData }, { data: quoteData }] = await Promise.all([
      supabase
        .from("orders")
        .select(
          "order_id, total_amount, payment_method, payment_status, payment_transaction_ref, reserved_until, invoice_url, created_at, order_items_warranty(order_item_id, item_serial_id, sold_price, delivery_date, warranty_end_date)",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("quote_requests")
        .select("quote_id, status, discount_pct, valid_until, created_at")
        .order("created_at", { ascending: false }),
    ]);

    orders = ordData ?? [];
    quotes = quoteData ?? [];
  }

  return (
    <StorefrontClient
      accountType={session?.profile?.account_type ?? "Individual"}
      catalogItems={catalogItems ?? []}
      orders={orders}
      quotes={quotes}
    />
  );
}
