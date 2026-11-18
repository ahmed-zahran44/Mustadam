import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * FR-12 (7-Day Offer Auto-Reject) & FR-19 (30-60-90 Day Aging -> Decommissioned_Aged)
 */
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("rpc_run_inventory_aging");

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, summary: data });
}

