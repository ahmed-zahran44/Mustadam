"use server";

import { revalidatePath } from "next/cache";
import { SimulatedNotificationAdapter } from "@/lib/adapters/notification-service";
import { getActiveSessionProfile } from "@/lib/auth/session";
import {
  calculateEstimatedPriceRange,
  calculateReturnFee,
  calculateTargetSellingPrice,
} from "@/lib/domain/pricing-engine";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DiagnosticQuestion } from "@/types/domain";

export async function submitSingleItemRequestAction(input: {
  categoryId: string;
  title: string;
  titleAr?: string;
  weightKg?: number;
  answers: Record<string, boolean>;
  photoUrls: string[];
  handoverMethod: "Courier" | "Partner_Dropoff" | "Batch_Truck";
  dropoffPartnerId?: string;
  pickupAddress?: string;
  pickupSlot?: string;
}) {
  const session = await getActiveSessionProfile();
  if (!session) {
    return { ok: false, error: "Please sign in as a Customer first." };
  }

  if (input.photoUrls.length < 3 || input.photoUrls.length > 5) {
    return {
      ok: false,
      error: "Please provide between 3 and 5 clear photos showing item condition.",
    };
  }

  const supabase = await createSupabaseServerClient();

  const { data: category, error: catError } = await supabase
    .from("categories")
    .select("*")
    .eq("category_id", input.categoryId)
    .single();

  if (catError || !category) {
    return { ok: false, error: "Selected category not found." };
  }

  const questions = (category.diagnostic_questions_json ??
    []) as unknown as DiagnosticQuestion[];
  const priceEst = calculateEstimatedPriceRange({
    baseReferencePrice: Number(category.base_reference_price),
    questions,
    answers: input.answers,
  });

  const trackingCode = `MST-TRK-${Math.floor(100000 + Math.random() * 900000)}`;
  const effectiveHandover = category.is_bulky
    ? "Batch_Truck"
    : input.handoverMethod;
  const preverificationStatus = category.is_bulky ? "pending" : "not_required";

  const { data: reqRow, error: reqErr } = await supabase
    .from("acquisition_requests")
    .insert({
      seller_id: session.userId,
      handover_method: effectiveHandover,
      dropoff_partner_id:
        effectiveHandover === "Partner_Dropoff"
          ? (input.dropoffPartnerId ?? null)
          : null,
      status: "awaiting_handover",
      request_type: "single",
      tracking_code: trackingCode,
      pickup_address: input.pickupAddress?.trim() ?? null,
      pickup_slot: input.pickupSlot?.trim() ?? null,
      preverification_status: preverificationStatus,
    })
    .select("request_id")
    .single();

  if (reqErr || !reqRow) {
    return {
      ok: false,
      error: reqErr?.message ?? "Failed to create acquisition request",
    };
  }

  const { data: itemRow, error: itemErr } = await supabase
    .from("serialized_items")
    .insert({
      request_id: reqRow.request_id,
      category_id: category.category_id,
      estimated_min_price: priceEst.estimatedMinPrice,
      estimated_max_price: priceEst.estimatedMaxPrice,
      current_status: "Awaiting_Handover",
      title: input.title.trim(),
      title_ar: input.titleAr?.trim() || input.title.trim(),
      diagnostic_answers: input.answers,
      weight_kg: input.weightKg ?? (category.is_bulky ? 25 : 2.5),
    })
    .select("item_serial_id")
    .single();

  if (itemErr || !itemRow) {
    return {
      ok: false,
      error: itemErr?.message ?? "Failed to create serialized item",
    };
  }

  const photoRows = input.photoUrls.map((url, idx) => ({
    item_serial_id: itemRow.item_serial_id,
    url,
    photo_type: "seller",
    sort_order: idx,
  }));

  await supabase.from("item_photos").insert(photoRows);

  const notifier = new SimulatedNotificationAdapter(supabase);
  await notifier.send({
    recipientId: session.userId,
    channel: "sms",
    type: "status",
    message: `Request ${trackingCode} submitted! Estimated valuation: ${priceEst.estimatedMinPrice} - ${priceEst.estimatedMaxPrice} EGP (subject to physical inspection).`,
  });

  revalidatePath("/", "layout");
  return {
    ok: true,
    trackingCode,
    estimatedMinPrice: priceEst.estimatedMinPrice,
    estimatedMaxPrice: priceEst.estimatedMaxPrice,
  };
}

export async function submitCorporateBulkLiquidationAction(input: {
  pickupAddress: string;
  items: Array<{
    categoryId: string;
    title: string;
    weightKg?: number;
  }>;
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
      error:
        "Corporate bulk liquidation requests are restricted to registered company accounts.",
    };
  }

  if (!input.items.length) {
    return { ok: false, error: "Please add at least one item to the batch." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: categories } = await supabase.from("categories").select("*");
  const categoryMap = new Map(
    (categories ?? []).map((c) => [c.category_id, c]),
  );

  const trackingCode = `MST-BLK-${Math.floor(100000 + Math.random() * 900000)}`;

  const { data: reqRow, error: reqErr } = await supabase
    .from("acquisition_requests")
    .insert({
      seller_id: session.userId,
      handover_method: "Batch_Truck",
      status: "awaiting_handover",
      request_type: "bulk",
      tracking_code: trackingCode,
      pickup_address: input.pickupAddress.trim(),
      preverification_status: "approved",
    })
    .select("request_id")
    .single();

  if (reqErr || !reqRow) {
    return { ok: false, error: reqErr?.message ?? "Failed to create batch" };
  }

  const itemInserts = input.items.map((item) => {
    const cat = categoryMap.get(item.categoryId);
    const base = Number(cat?.base_reference_price ?? 5000);
    return {
      request_id: reqRow.request_id,
      category_id: item.categoryId,
      estimated_min_price: Number((base * 0.75).toFixed(2)),
      estimated_max_price: Number((base * 0.95).toFixed(2)),
      current_status: "Awaiting_Handover",
      title: item.title.trim(),
      title_ar: item.title.trim(),
      weight_kg: item.weightKg ?? (cat?.is_bulky ? 25 : 3),
    };
  });

  const { error: itemsErr } = await supabase
    .from("serialized_items")
    .insert(itemInserts);

  if (itemsErr) {
    return { ok: false, error: itemsErr.message };
  }

  const notifier = new SimulatedNotificationAdapter(supabase);
  await notifier.send({
    recipientId: session.userId,
    channel: "email",
    type: "status",
    message: `Corporate Bulk Liquidation ${trackingCode} (${input.items.length} units) registered for Batch Truck collection.`,
  });

  revalidatePath("/", "layout");
  return { ok: true, trackingCode, count: input.items.length };
}

/**
 * FR-12 Seller Final Offer Decision (Accept vs. Reject within 7-Day / 168-Hour Window)
 */
export async function respondToSellerOfferAction(input: {
  itemSerialId: string;
  decision: "accept" | "reject";
}) {
  const session = await getActiveSessionProfile();
  if (!session) {
    return { ok: false, error: "Not authenticated" };
  }

  const supabase = await createSupabaseServerClient();

  const { data: item, error: itemErr } = await supabase
    .from("serialized_items")
    .select("*, acquisition_requests(seller_id), categories(is_bulky)")
    .eq("item_serial_id", input.itemSerialId)
    .single();

  if (itemErr || !item) {
    return { ok: false, error: "Item not found" };
  }

  if (item.current_status !== "Awaiting_Seller_Decision") {
    return {
      ok: false,
      error: `Item is not awaiting seller decision (current: ${item.current_status})`,
    };
  }

  // Check if 7-day (168h) window has already expired -> trigger Auto-Reject (FR-12)
  if (
    item.offer_expires_at &&
    new Date(item.offer_expires_at).getTime() < Date.now()
  ) {
    await supabase.rpc("rpc_run_inventory_aging");
    revalidatePath("/", "layout");
    return {
      ok: false,
      error:
        "The 7-day (168-hour) decision window expired. Offer was automatically rejected (Auto-Reject) and routed to Return_In_Progress.",
    };
  }

  const { data: latestInspection } = await supabase
    .from("inspection_records")
    .select("technical_classification")
    .eq("item_serial_id", input.itemSerialId)
    .order("inspected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const classification =
    latestInspection?.technical_classification ?? "Ready_For_Sale";
  const notifier = new SimulatedNotificationAdapter(supabase);

  if (input.decision === "accept") {
    let nextStatus:
      | "Listed_In_Store"
      | "Under_Refurbishment"
      | "Pending_Dismantling" = "Listed_In_Store";

    if (classification === "Repairable") {
      nextStatus = "Under_Refurbishment";
    } else if (classification === "Irreparable") {
      nextStatus = "Pending_Dismantling";
    }

    const purchasePrice = Number(
      item.final_purchase_price ?? item.estimated_min_price,
    );
    const totalUnitCost =
      purchasePrice +
      Number(item.logistics_cost ?? 0) +
      Number(item.refurbishment_cost ?? 0);
    const targetPrice = calculateTargetSellingPrice(totalUnitCost);

    const { error: updErr } = await supabase
      .from("serialized_items")
      .update({
        seller_decision: "accepted",
        current_status: nextStatus,
        condition_grade: nextStatus === "Listed_In_Store" ? "A" : null,
        listed_date:
          nextStatus === "Listed_In_Store" ? new Date().toISOString() : null,
        aging_tier: nextStatus === "Listed_In_Store" ? "0_30" : null,
        total_unit_cost: totalUnitCost,
        target_selling_price: targetPrice,
        selling_price: nextStatus === "Listed_In_Store" ? targetPrice : null,
      })
      .eq("item_serial_id", input.itemSerialId);

    if (updErr) {
      return { ok: false, error: updErr.message };
    }

    // Create open ticket if routed to refurbishment or dismantling
    if (nextStatus === "Under_Refurbishment") {
      await supabase.from("refurbishment_logs").insert({
        item_serial_id: input.itemSerialId,
        work_description: "Scheduled from accepted Repairable inspection",
        status: "open",
      });
    } else if (nextStatus === "Pending_Dismantling") {
      await supabase.from("dismantling_tickets").insert({
        item_serial_id: input.itemSerialId,
        trigger: "irreparable",
        status: "open",
      });
    }

    const payoutRef = `PAY-${Math.floor(100000 + Math.random() * 900000)}`;
    await supabase.from("payouts").insert({
      item_serial_id: input.itemSerialId,
      seller_id: session.userId,
      amount: purchasePrice,
      status: "paid",
      payout_ref: payoutRef,
    });

    await notifier.send({
      recipientId: session.userId,
      channel: "sms",
      type: "price_offer",
      message: `Offer accepted! Payout ${payoutRef} of ${purchasePrice} EGP has been credited to your account.`,
    });

    revalidatePath("/", "layout");
    return { ok: true, outcome: "accepted", nextStatus, payoutRef };
  }

  // Reject path (FR-12)
  const isBulky = Boolean(
    (item.categories as { is_bulky?: boolean } | null)?.is_bulky,
  );
  const feeAmount = calculateReturnFee(isBulky);

  const { error: rejErr } = await supabase
    .from("serialized_items")
    .update({
      seller_decision: "rejected",
      current_status: "Return_In_Progress",
    })
    .eq("item_serial_id", input.itemSerialId);

  if (rejErr) {
    return { ok: false, error: rejErr.message };
  }

  await supabase.from("return_tasks").insert({
    item_serial_id: input.itemSerialId,
    fee_amount: feeAmount,
    fee_status: "pending",
    status: "awaiting_fee_payment",
  });

  await notifier.send({
    recipientId: session.userId,
    channel: "sms",
    type: "price_offer",
    message: `Offer rejected. Return transport & inspection fee (${feeAmount} EGP) generated. Settle fee to release item for return delivery.`,
  });

  revalidatePath("/", "layout");
  return { ok: true, outcome: "rejected", feeAmount };
}

export async function payReturnFeeAction(returnId: string) {
  const supabase = await createSupabaseServerClient();
  const ref = `RET-PAY-${Math.floor(100000 + Math.random() * 900000)}`;
  const { error } = await supabase
    .from("return_tasks")
    .update({
      fee_status: "paid",
      fee_payment_ref: ref,
      status: "ready_for_dispatch",
    })
    .eq("return_id", returnId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true, paymentRef: ref };
}

