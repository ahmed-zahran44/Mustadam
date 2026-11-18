import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * FR-21 Simulated Payment Gateway Webhook Receiver
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    orderId: string;
    outcome: "SUCCESS" | "FAILED";
    transactionRef?: string;
  };

  const supabase = await createSupabaseServerClient();
  const ref =
    body.transactionRef ?? `SIM-WH-${Math.floor(100000 + Math.random() * 900000)}`;

  const { data, error } = await supabase.rpc("rpc_process_payment_webhook", {
    p_order_id: body.orderId,
    p_outcome: body.outcome,
    p_transaction_ref: ref,
    p_payload: { source: "webhook_endpoint" },
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, result: data });
}

