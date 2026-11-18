"use server";

import { revalidatePath } from "next/cache";
import { SimulatedNotificationAdapter } from "@/lib/adapters/notification-service";
import {
  type PaymentChannel,
  type PaymentOutcome,
  SimulatedPaymentGatewayAdapter,
} from "@/lib/adapters/payment-gateway";
import { getActiveSessionProfile } from "@/lib/auth/session";
import {
  calculateWarrantyEndDate,
  isWarrantyActive,
} from "@/lib/domain/warranty-engine";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * FR-21 & NFR-04 Atomic Serialized Checkout Reservation (15-Minute Lock)
 */
export async function createSerializedOrderReservationAction(input: {
  itemSerialIds: string[];
  paymentMethod: PaymentChannel;
  deliveryAddress: string;
  quoteId?: string;
}) {
  const session = await getActiveSessionProfile();
  if (!session) {
    return { ok: false, error: "Please sign in as a Customer to checkout." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "rpc_create_order_with_reservation",
    {
      p_buyer_id: session.userId,
      p_item_serial_ids: input.itemSerialIds,
      p_payment_method: input.paymentMethod,
      p_delivery_address: input.deliveryAddress.trim(),
      p_quote_id: input.quoteId,
    },
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  const result = data as {
    order_id: string;
    total_amount: number;
    reserved_until: string;
  };

  revalidatePath("/", "layout");
  return {
    ok: true,
    orderId: result.order_id,
    totalAmount: result.total_amount,
    reservedUntil: result.reserved_until,
  };
}

/**
 * FR-21 &FR-22 Process Simulated Payment Outcome (`SUCCESS` or `FAILED`)
 */
export async function executeSimulatedPaymentAction(input: {
  orderId: string;
  amountEgp: number;
  channel: PaymentChannel;
  simulatedOutcome: PaymentOutcome;
}) {
  const session = await getActiveSessionProfile();
  if (!session) {
    return { ok: false, error: "Not authenticated" };
  }

  const supabase = await createSupabaseServerClient();
  const gateway = new SimulatedPaymentGatewayAdapter(supabase);

  try {
    const res = await gateway.initiatePayment(input);

    if (input.simulatedOutcome === "SUCCESS") {
      await supabase
        .from("orders")
        .update({ invoice_url: `/api/documents/invoice/${input.orderId}` })
        .eq("order_id", input.orderId);

      const notifier = new SimulatedNotificationAdapter(supabase);
      await notifier.send({
        recipientId: session.userId,
        channel: "email",
        type: "status",
        message: `Order ${input.orderId.slice(0, 8)} paid (${res.transactionRef} via ${input.channel}). Tax Invoice generated!`,
      });
    }

    revalidatePath("/", "layout");
    return {
      ok: true,
      transactionRef: res.transactionRef,
      outcome: input.simulatedOutcome,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Payment simulation error",
    };
  }
}

/**
 * FR-20 Corporate Bulk Quote Request
 */
export async function submitCorporateQuoteRequestAction(input: {
  itemSerialIds: string[];
}) {
  const session = await getActiveSessionProfile();
  if (!session) {
    return { ok: false, error: "Not authenticated" };
  }

  if (
    session.profile?.account_type !== "Company" &&
    session.role !== "Admin"
  ) {
    return {
      ok: false,
      error: "Bulk quote requests are restricted to registered corporate accounts.",
    };
  }

  if (!input.itemSerialIds.length) {
    return { ok: false, error: "Select at least one serialized item." };
  }

  const supabase = await createSupabaseServerClient();

  const { data: quote, error: qErr } = await supabase
    .from("quote_requests")
    .insert({
      buyer_id: session.userId,
      status: "requested",
      discount_pct: 0,
    })
    .select("quote_id")
    .single();

  if (qErr || !quote) {
    return { ok: false, error: qErr?.message ?? "Failed to create quote" };
  }

  const rows = input.itemSerialIds.map((id) => ({
    quote_id: quote.quote_id,
    item_serial_id: id,
  }));

  await supabase.from("quote_items").insert(rows);

  revalidatePath("/", "layout");
  return { ok: true, quoteId: quote.quote_id };
}

/**
 * FR-23 Confirm Order Delivery & Calculate Automated Category Warranty
 */
export async function confirmOrderDeliveryAction(orderItemId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: oi, error: oiErr } = await supabase
    .from("order_items_warranty")
    .select("*, serialized_items(categories(warranty_days))")
    .eq("order_item_id", orderItemId)
    .single();

  if (oiErr || !oi) {
    return { ok: false, error: "Order item not found" };
  }

  const warrantyDays =
    (
      oi.serialized_items as {
        categories?: { warranty_days?: number } | null;
      } | null
    )?.categories?.warranty_days ?? 30;

  const today = new Date().toISOString().split("T")[0];
  const warrantyEnd = calculateWarrantyEndDate(today, warrantyDays);

  const { error: updErr } = await supabase
    .from("order_items_warranty")
    .update({
      delivery_date: today,
      warranty_end_date: warrantyEnd,
    })
    .eq("order_item_id", orderItemId);

  if (updErr) {
    return { ok: false, error: updErr.message };
  }

  revalidatePath("/", "layout");
  return { ok: true, deliveryDate: today, warrantyEndDate: warrantyEnd };
}

/**
 * FR-24 Submit Post-Sale Warranty Claim (Active Warranty Check)
 */
export async function submitWarrantyClaimAction(input: {
  orderItemId: string;
  description: string;
}) {
  const session = await getActiveSessionProfile();
  if (!session) {
    return { ok: false, error: "Not authenticated" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: oi } = await supabase
    .from("order_items_warranty")
    .select("warranty_end_date")
    .eq("order_item_id", input.orderItemId)
    .single();

  if (!isWarrantyActive(oi?.warranty_end_date)) {
    return {
      ok: false,
      error:
        "Warranty claim cannot be processed: the warranty period has expired or delivery has not been confirmed.",
    };
  }

  const { error } = await supabase.from("warranty_claims").insert({
    order_item_id: input.orderItemId,
    buyer_id: session.userId,
    description: input.description.trim(),
    status: "open",
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const notifier = new SimulatedNotificationAdapter(supabase);
  await notifier.send({
    recipientId: session.userId,
    channel: "sms",
    type: "warranty",
    message: `Warranty claim submitted for item ${input.orderItemId.slice(0, 8)}. Customer Service will review shortly.`,
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

