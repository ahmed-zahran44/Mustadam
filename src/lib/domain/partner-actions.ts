"use server";

import { revalidatePath } from "next/cache";
import { SimulatedNotificationAdapter } from "@/lib/adapters/notification-service";
import { getActiveSessionProfile } from "@/lib/auth/session";
import { calculateTargetSellingPrice } from "@/lib/domain/pricing-engine";
import { calculateOfferExpiryDate } from "@/lib/domain/state-machine";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ConditionGrade, TechnicalClassification } from "@/types/domain";

/**
 * FR-07 Logistics Custody Transitions:
 * - Drop-off Hub receives item -> Received_At_Dropoff_Hub
 * - Courier / Batch Truck picks up item -> In_Transit_To_Warehouse
 */
export async function updateLogisticsCustodyAction(input: {
  itemSerialId: string;
  targetStatus: "Received_At_Dropoff_Hub" | "In_Transit_To_Warehouse";
}) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("serialized_items")
    .update({ current_status: input.targetStatus })
    .eq("item_serial_id", input.itemSerialId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * FR-08 & FR-17 Bulky Pre-Verification & Equal Batch Logistics Cost Allocation
 */
export async function allocateBatchManifestLogisticsAction(input: {
  manifestId: string;
  totalBatchCost: number;
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "rpc_allocate_batch_logistics_cost",
    {
      p_manifest_id: input.manifestId,
      p_total_batch_cost: input.totalBatchCost,
    },
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true, result: data };
}

/**
 * FR-09 Warehouse Intake & Serialized Barcode Generation (MST-YYYY-NNNNN)
 */
export async function receiveItemAtWarehouseAction(input: {
  itemSerialId: string;
  logisticsCost?: number;
}) {
  const supabase = await createSupabaseServerClient();
  const year = new Date().getFullYear();
  const randomSeq = String(Math.floor(10000 + Math.random() * 90000));
  const barcode = `MST-${year}-${randomSeq}`;

  const updatePayload: {
    current_status: "Received_Pending_Inspection";
    barcode: string;
    logistics_cost?: number;
  } = {
    current_status: "Received_Pending_Inspection",
    barcode,
  };

  if (typeof input.logisticsCost === "number") {
    updatePayload.logistics_cost = input.logisticsCost;
  }

  const { error } = await supabase
    .from("serialized_items")
    .update(updatePayload)
    .eq("item_serial_id", input.itemSerialId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true, barcode };
}

/**
 * FR-10, FR-11 & FR-12 Technical Inspection, Mandatory NIST 800-88 Data Wipe & 7-Day Offer
 */
export async function submitInspectionAndOfferAction(input: {
  itemSerialId: string;
  technicalClassification: TechnicalClassification;
  conditionNotes: string;
  dataWipedBool: boolean;
  finalPurchasePrice: number;
}) {
  const session = await getActiveSessionProfile();
  if (!session) {
    return { ok: false, error: "Not authenticated" };
  }

  const supabase = await createSupabaseServerClient();
  const inspectedAt = new Date();
  const offerExpiresAt = calculateOfferExpiryDate(inspectedAt).toISOString();
  const certificateUrl = input.dataWipedBool
    ? `/api/documents/certificate/${input.itemSerialId}`
    : null;

  // 1. Insert Inspection Record (FR-10)
  const { error: inspErr } = await supabase.from("inspection_records").insert({
    item_serial_id: input.itemSerialId,
    inspector_id: session.userId,
    technical_classification: input.technicalClassification,
    condition_notes: input.conditionNotes.trim(),
    data_wipe_certificate_url: certificateUrl,
    inspected_at: inspectedAt.toISOString(),
  });

  if (inspErr) {
    return { ok: false, error: inspErr.message };
  }

  // 2. Transition item to Awaiting_Seller_Decision with 7-day (168h) offer window (FR-11, FR-12)
  // Note: Database trigger fn_enforce_and_audit_item_status enforces NIST 800-88 data_wiped_bool gate!
  const { data: item, error: updErr } = await supabase
    .from("serialized_items")
    .update({
      data_wiped_bool: input.dataWipedBool,
      final_purchase_price: input.finalPurchasePrice,
      seller_decision: "pending",
      offer_expires_at: offerExpiresAt,
      current_status: "Awaiting_Seller_Decision",
    })
    .eq("item_serial_id", input.itemSerialId)
    .select("title, acquisition_requests(seller_id)")
    .single();

  if (updErr) {
    return { ok: false, error: updErr.message };
  }

  const sellerId = (
    item?.acquisition_requests as { seller_id?: string } | null
  )?.seller_id;

  if (sellerId) {
    const notifier = new SimulatedNotificationAdapter(createAdminClient());
    await notifier.send({
      recipientId: sellerId,
      channel: "sms",
      type: "price_offer",
      message: `Inspection complete for "${item.title}". Final Purchase Offer: ${input.finalPurchasePrice} EGP (${input.technicalClassification}). Please accept or reject within 7 days (168 hours) before automatic rejection.`,
    });
  }

  revalidatePath("/", "layout");
  return { ok: true, offerExpiresAt };
}

/**
 * FR-13, FR-15 & FR-17 Refurbishment Completion & Harvested Spare Part Consumption
 */
export async function completeRefurbishmentTicketAction(input: {
  refurbId: string;
  itemSerialId: string;
  workDescription: string;
  laborCost: number;
  externalPartsCost: number;
  consumedSparePartId?: string;
  finalGrade: ConditionGrade;
  targetSellingPrice?: number;
}) {
  const session = await getActiveSessionProfile();
  if (!session) {
    return { ok: false, error: "Not authenticated" };
  }

  const supabase = await createSupabaseServerClient();

  // If a harvested spare part is selected, consume it (Trigger fn_consume_harvested_spare_part adds estimated_cost automatically!)
  if (input.consumedSparePartId) {
    const { error: partErr } = await supabase
      .from("spare_parts_inventory")
      .update({
        status: "Consumed",
        consumed_in_refurb_id: input.refurbId,
      })
      .eq("part_id", input.consumedSparePartId)
      .eq("status", "Available");

    if (partErr) {
      return { ok: false, error: partErr.message };
    }
  }

  // Fetch current refurbishment log to include any trigger-added parts_cost
  const { data: currentRefurb } = await supabase
    .from("refurbishment_logs")
    .select("parts_cost")
    .eq("refurb_id", input.refurbId)
    .single();

  const totalPartsCost =
    Number(currentRefurb?.parts_cost ?? 0) + Number(input.externalPartsCost);

  // Close the refurbishment ticket (FR-13 gate requires status = 'closed' before Listed_In_Store)
  const { error: closeErr } = await supabase
    .from("refurbishment_logs")
    .update({
      technician_id: session.userId,
      work_description: input.workDescription.trim(),
      labor_cost: input.laborCost,
      parts_cost: totalPartsCost,
      final_grade: input.finalGrade,
      status: "closed",
      closed_at: new Date().toISOString(),
    })
    .eq("refurb_id", input.refurbId);

  if (closeErr) {
    return { ok: false, error: closeErr.message };
  }

  // Compute updated Total_Unit_Cost (FR-17)
  const { data: item } = await supabase
    .from("serialized_items")
    .select("final_purchase_price, logistics_cost")
    .eq("item_serial_id", input.itemSerialId)
    .single();

  const totalRefurbCost = Number(input.laborCost) + totalPartsCost;
  const totalUnitCost = Number(
    (
      Number(item?.final_purchase_price ?? 0) +
      Number(item?.logistics_cost ?? 0) +
      totalRefurbCost
    ).toFixed(2),
  );
  const targetPrice = calculateTargetSellingPrice(totalUnitCost);

  const { error: itemErr } = await supabase
    .from("serialized_items")
    .update({
      condition_grade: input.finalGrade,
      refurbishment_cost: totalRefurbCost,
      total_unit_cost: totalUnitCost,
      target_selling_price: targetPrice,
      selling_price: targetPrice,
      listed_date: new Date().toISOString(),
      aging_tier: "0_30",
      current_status: "Listed_In_Store",
    })
    .eq("item_serial_id", input.itemSerialId);

  if (itemErr) {
    return { ok: false, error: itemErr.message };
  }

  revalidatePath("/", "layout");
  return { ok: true, totalUnitCost, targetSellingPrice: targetPrice };
}

/**
 * FR-14, FR-16 & FR-19 Dismantling, Spare Parts Harvesting (with estimated_cost) & Scrap Logging
 */
export async function completeDismantlingAndHarvestAction(input: {
  dismantleId: string;
  itemSerialId: string;
  categoryId: string;
  harvestedPartName?: string;
  harvestedPartEstimatedCost?: number;
  scrapMaterialType: "E-waste" | "Metal" | "Wood" | "Plastic";
  scrapWeightKg: number;
}) {
  const session = await getActiveSessionProfile();
  if (!session) {
    return { ok: false, error: "Not authenticated" };
  }

  const supabase = await createSupabaseServerClient();

  // 1. Harvest functional spare part with estimated_cost if provided (FR-14)
  if (input.harvestedPartName?.trim()) {
    const cost = Number(input.harvestedPartEstimatedCost ?? 250);
    const { error: partErr } = await supabase
      .from("spare_parts_inventory")
      .insert({
        source_item_serial_id: input.itemSerialId,
        part_name: input.harvestedPartName.trim(),
        category_id: input.categoryId,
        status: "Available",
        estimated_cost: cost,
        internal_cost: cost,
      });

    if (partErr) {
      return { ok: false, error: partErr.message };
    }
  }

  // 2. Log scrap entry (FR-16)
  const { error: scrapErr } = await supabase.from("scrap_entries").insert({
    dismantle_id: input.dismantleId,
    material_type: input.scrapMaterialType,
    weight_kg: input.scrapWeightKg,
  });

  if (scrapErr) {
    return { ok: false, error: scrapErr.message };
  }

  // 3. Close dismantling ticket
  await supabase
    .from("dismantling_tickets")
    .update({
      technician_id: session.userId,
      status: "closed",
      closed_at: new Date().toISOString(),
    })
    .eq("dismantle_id", input.dismantleId);

  // 4. Transition item (Pending_Dismantling or Decommissioned_Aged -> Scrap_Ready_For_Recycling)
  const { error: itemErr } = await supabase
    .from("serialized_items")
    .update({
      current_status: "Scrap_Ready_For_Recycling",
    })
    .eq("item_serial_id", input.itemSerialId);

  if (itemErr) {
    return { ok: false, error: itemErr.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * FR-16 Licensed Recycler Batch Handover -> Recycled_Closed
 */
export async function recordRecyclingBatchHandoverAction(input: {
  recyclerEntityName: string;
  materialType: "E-waste" | "Metal" | "Wood" | "Plastic" | "Mixed";
  totalWeightKg: number;
  revenueAmount: number;
  itemSerialIds: string[];
}) {
  const session = await getActiveSessionProfile();
  if (!session) {
    return { ok: false, error: "Not authenticated" };
  }

  const supabase = await createSupabaseServerClient();

  const { data: batch, error: batchErr } = await supabase
    .from("recycling_batches")
    .insert({
      recycler_entity_name: input.recyclerEntityName.trim(),
      material_type: input.materialType,
      total_weight_kg: input.totalWeightKg,
      revenue_amount: input.revenueAmount,
      recorded_by: session.userId,
    })
    .select("batch_id")
    .single();

  if (batchErr || !batch) {
    return { ok: false, error: batchErr?.message ?? "Failed to record batch" };
  }

  for (const itemId of input.itemSerialIds) {
    await supabase
      .from("serialized_items")
      .update({ current_status: "Recycled_Closed" })
      .eq("item_serial_id", itemId);
  }

  revalidatePath("/", "layout");
  return { ok: true, batchId: batch.batch_id };
}

