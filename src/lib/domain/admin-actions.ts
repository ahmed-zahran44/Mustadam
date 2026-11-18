"use server";

import { revalidatePath } from "next/cache";
import { SimulatedNotificationAdapter } from "@/lib/adapters/notification-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CustomerSegment, Json } from "@/types/domain";

/**
 * NFR-05 Dynamic Category & Diagnostic Schema Creation without Code Deployment
 */
export async function createOrUpdateCategoryAction(input: {
  name: string;
  nameAr: string;
  baseReferencePrice: number;
  warrantyDays: number;
  isBulky: boolean;
  requiresDataWipe: boolean;
  diagnosticQuestionsJson: Json;
}) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("categories").insert({
    name: input.name.trim(),
    name_ar: input.nameAr.trim(),
    base_reference_price: input.baseReferencePrice,
    warranty_days: input.warrantyDays,
    is_bulky: input.isBulky,
    requires_data_wipe: input.requiresDataWipe,
    diagnostic_questions_json: input.diagnosticQuestionsJson,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * FR-20 Approve Corporate Bulk Quote with Custom B2B Discount (Valid 7 Days)
 */
export async function approveCorporateQuoteAction(input: {
  quoteId: string;
  discountPct: number;
}) {
  const supabase = await createSupabaseServerClient();
  const validUntil = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: quote, error } = await supabase
    .from("quote_requests")
    .update({
      status: "quoted",
      discount_pct: input.discountPct,
      valid_until: validUntil,
    })
    .eq("quote_id", input.quoteId)
    .select("buyer_id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (quote?.buyer_id) {
    const notifier = new SimulatedNotificationAdapter(supabase);
    await notifier.send({
      recipientId: quote.buyer_id,
      channel: "email",
      type: "price_offer",
      message: `Corporate Bulk Quote #${input.quoteId.slice(0, 8)} approved with ${input.discountPct}% B2B discount! Valid for 7 days.`,
    });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * FR-24 Resolve or Route Post-Sale Warranty Claim
 */
export async function resolveWarrantyClaimAction(input: {
  claimId: string;
  status: "in_review" | "resolved" | "rejected";
  resolutionNote: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("warranty_claims")
    .update({
      status: input.status,
      resolution_note: input.resolutionNote.trim(),
    })
    .eq("claim_id", input.claimId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * FR-25 Customer Segmentation & Targeted Promotional Campaign Dispatch
 */
export async function dispatchSegmentCampaignAction(input: {
  segment: CustomerSegment;
  channel: "sms" | "email";
  message: string;
}) {
  const supabase = await createSupabaseServerClient();

  const { data: recipients, error } = await supabase
    .from("users")
    .select("user_id")
    .eq("segment", input.segment);

  if (error) {
    return { ok: false, error: error.message };
  }

  const notifier = new SimulatedNotificationAdapter(supabase);
  let sentCount = 0;

  for (const r of recipients ?? []) {
    await notifier.send({
      recipientId: r.user_id,
      channel: input.channel,
      type: "campaign",
      message: `[${input.segment} Promo] ${input.message.trim()}`,
    });
    sentCount += 1;
  }

  revalidatePath("/", "layout");
  return { ok: true, sentCount };
}

