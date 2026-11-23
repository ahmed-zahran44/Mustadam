"use server";

import { revalidatePath } from "next/cache";
import { SimulatedNotificationAdapter } from "@/lib/adapters/notification-service";
import { getActiveSessionProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CustomerSegment, Json } from "@/types/domain";

type AdminPortalAllowedRole = "Admin" | "Customer_Service";

async function requireAdminPortalRole(allowedRoles: AdminPortalAllowedRole[]) {
  const session = await getActiveSessionProfile();
  if (!session) {
    return {
      ok: false as const,
      error: "Authentication is required to perform this action.",
    };
  }
  if (!allowedRoles.includes(session.role as AdminPortalAllowedRole)) {
    return {
      ok: false as const,
      error: "Insufficient permissions for this administrative action.",
    };
  }
  return { ok: true as const, session };
}

function validateDiagnosticSchema(raw: Json): { valid: boolean; error?: string } {
  if (!Array.isArray(raw)) {
    return {
      valid: false,
      error: "Diagnostic questions must be a JSON array.",
    };
  }

  for (let i = 0; i < raw.length; i += 1) {
    const item = raw[i];
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return {
        valid: false,
        error: `Diagnostic question #${i + 1} must be a valid object.`,
      };
    }
    const obj = item as Record<string, unknown>;
    if (typeof obj.id !== "string" || !obj.id.trim()) {
      return {
        valid: false,
        error: `Diagnostic question #${i + 1} is missing an id.`,
      };
    }
    if (
      typeof obj.question_en !== "string" ||
      !obj.question_en.trim() ||
      typeof obj.question_ar !== "string" ||
      !obj.question_ar.trim()
    ) {
      return {
        valid: false,
        error: `Diagnostic question "${obj.id}" requires both English and Arabic prompts.`,
      };
    }
    const pct = Number(obj.deduction_pct);
    if (!Number.isFinite(pct) || pct < 0 || pct > 0.85) {
      return {
        valid: false,
        error: `Diagnostic question "${obj.id}" must have a deduction_pct between 0 and 0.85.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Dynamic Category & Diagnostic Schema Creation / Update without Code Deployment
 */
export async function createOrUpdateCategoryAction(input: {
  categoryId?: string;
  name: string;
  nameAr: string;
  baseReferencePrice: number;
  warrantyDays: number;
  isBulky: boolean;
  requiresDataWipe: boolean;
  diagnosticQuestionsJson: Json;
}) {
  const auth = await requireAdminPortalRole(["Admin"]);
  if (!auth.ok) return { ok: false, error: auth.error };

  const cleanName = input.name.trim();
  const cleanNameAr = input.nameAr.trim();
  if (!cleanName || !cleanNameAr) {
    return {
      ok: false,
      error: "Both English and Arabic category names are required.",
    };
  }

  if (!Number.isFinite(input.baseReferencePrice) || input.baseReferencePrice < 0) {
    return {
      ok: false,
      error: "Base reference price must be zero or greater.",
    };
  }

  if (!Number.isInteger(input.warrantyDays) || input.warrantyDays < 0 || input.warrantyDays > 3650) {
    return {
      ok: false,
      error: "Warranty duration must be an integer between 0 and 3650 days.",
    };
  }

  const schemaCheck = validateDiagnosticSchema(input.diagnosticQuestionsJson);
  if (!schemaCheck.valid) {
    return {
      ok: false,
      error: schemaCheck.error ?? "Invalid diagnostic schema format.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const payload = {
    name: cleanName,
    name_ar: cleanNameAr,
    base_reference_price: Number(input.baseReferencePrice.toFixed(2)),
    warranty_days: input.warrantyDays,
    is_bulky: Boolean(input.isBulky),
    requires_data_wipe: Boolean(input.requiresDataWipe),
    diagnostic_questions_json: input.diagnosticQuestionsJson,
  };

  if (input.categoryId) {
    const { error } = await supabase
      .from("categories")
      .update(payload)
      .eq("category_id", input.categoryId);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/", "layout");
    return { ok: true, mode: "updated" as const, categoryId: input.categoryId };
  }

  // Prevent duplicate category creation when the exact same English name already exists
  const { data: existing } = await supabase
    .from("categories")
    .select("category_id")
    .ilike("name", cleanName)
    .limit(1)
    .maybeSingle();

  if (existing?.category_id) {
    const { error } = await supabase
      .from("categories")
      .update(payload)
      .eq("category_id", existing.category_id);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/", "layout");
    return {
      ok: true,
      mode: "updated" as const,
      categoryId: existing.category_id,
    };
  }

  const { data: inserted, error } = await supabase
    .from("categories")
    .insert(payload)
    .select("category_id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return {
    ok: true,
    mode: "created" as const,
    categoryId: inserted?.category_id,
  };
}

/**
 * Approve Corporate Bulk Quote with Custom B2B Discount (Valid 7 Days)
 */
export async function approveCorporateQuoteAction(input: {
  quoteId: string;
  discountPct: number;
}) {
  const auth = await requireAdminPortalRole(["Admin"]);
  if (!auth.ok) return { ok: false, error: auth.error };

  if (
    !Number.isFinite(input.discountPct) ||
    input.discountPct < 0 ||
    input.discountPct > 50
  ) {
    return {
      ok: false,
      error: "B2B discount percentage must be between 0% and 50%.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const validUntil = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: quote, error } = await supabase
    .from("quote_requests")
    .update({
      status: "quoted",
      discount_pct: Number(input.discountPct.toFixed(2)),
      valid_until: validUntil,
    })
    .eq("quote_id", input.quoteId)
    .select("buyer_id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (quote?.buyer_id) {
    const notifier = new SimulatedNotificationAdapter(createAdminClient());
    await notifier.send({
      recipientId: quote.buyer_id,
      channel: "email",
      type: "price_offer",
      message: `Corporate Bulk Quote #${input.quoteId.slice(0, 8)} approved with ${input.discountPct}% B2B discount! Valid for 7 days.`,
    });
  }

  revalidatePath("/", "layout");
  return { ok: true, validUntil };
}

/**
 * Expire / Decline a Corporate Bulk Quote
 */
export async function expireCorporateQuoteAction(input: { quoteId: string }) {
  const auth = await requireAdminPortalRole(["Admin"]);
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createSupabaseServerClient();
  const { data: quote, error } = await supabase
    .from("quote_requests")
    .update({
      status: "expired",
    })
    .eq("quote_id", input.quoteId)
    .select("buyer_id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (quote?.buyer_id) {
    const notifier = new SimulatedNotificationAdapter(createAdminClient());
    await notifier.send({
      recipientId: quote.buyer_id,
      channel: "email",
      type: "status",
      message: `Corporate Bulk Quote #${input.quoteId.slice(0, 8)} has been marked expired by Platform Management.`,
    });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Resolve or Route Post-Sale Warranty Claim (Admin & Customer Service)
 */
export async function resolveWarrantyClaimAction(input: {
  claimId: string;
  status: "in_review" | "resolved" | "rejected";
  resolutionNote: string;
}) {
  const auth = await requireAdminPortalRole(["Admin", "Customer_Service"]);
  if (!auth.ok) return { ok: false, error: auth.error };

  const cleanNote = input.resolutionNote.trim();
  if (input.status !== "in_review" && cleanNote.length < 4) {
    return {
      ok: false,
      error: "Please provide a clear resolution note before closing the claim.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: claim, error } = await supabase
    .from("warranty_claims")
    .update({
      status: input.status,
      resolution_note: cleanNote || null,
      assigned_to: auth.session.userId,
    })
    .eq("claim_id", input.claimId)
    .select("buyer_id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (claim?.buyer_id) {
    const notifier = new SimulatedNotificationAdapter(createAdminClient());
    await notifier.send({
      recipientId: claim.buyer_id,
      channel: "email",
      type: "warranty",
      message: `Warranty Claim #${input.claimId.slice(0, 8)} status updated to ${input.status.toUpperCase()}.${cleanNote ? ` Note: ${cleanNote}` : ""}`,
    });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Authorize or Advance a Seller Return Task (Admin & Customer Service)
 */
export async function updateReturnTaskStatusAction(input: {
  returnId: string;
  action: "confirm_fee_paid" | "authorize_dispatch" | "mark_dispatched" | "mark_returned";
}) {
  const auth = await requireAdminPortalRole(["Admin", "Customer_Service"]);
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createSupabaseServerClient();
  const { data: task, error: fetchErr } = await supabase
    .from("return_tasks")
    .select(
      "return_id, fee_status, status, item_serial_id, serialized_items(title, acquisition_requests(seller_id))",
    )
    .eq("return_id", input.returnId)
    .single();

  if (fetchErr || !task) {
    return { ok: false, error: fetchErr?.message ?? "Return task not found." };
  }

  let updatePayload: {
    fee_status?: "pending" | "paid";
    fee_payment_ref?: string;
    status?:
      | "awaiting_fee_payment"
      | "ready_for_dispatch"
      | "dispatched"
      | "returned_to_seller";
  } = {};

  if (input.action === "confirm_fee_paid") {
    updatePayload = {
      fee_status: "paid",
      fee_payment_ref: `SIM-RET-${Date.now().toString(36).toUpperCase()}`,
      status: "ready_for_dispatch",
    };
  } else if (input.action === "authorize_dispatch") {
    if (task.fee_status !== "paid") {
      return {
        ok: false,
        error: "Return release is locked until the return transport and inspection fee is paid.",
      };
    }
    updatePayload = { status: "ready_for_dispatch" };
  } else if (input.action === "mark_dispatched") {
    if (task.fee_status !== "paid") {
      return {
        ok: false,
        error: "Cannot dispatch return shipment before fee settlement.",
      };
    }
    updatePayload = { status: "dispatched" };
  } else if (input.action === "mark_returned") {
    updatePayload = { status: "returned_to_seller" };
  }

  const { error: updErr } = await supabase
    .from("return_tasks")
    .update(updatePayload)
    .eq("return_id", input.returnId);

  if (updErr) {
    return { ok: false, error: updErr.message };
  }

  const itemInfo = task.serialized_items as {
    title?: string;
    acquisition_requests?: { seller_id?: string } | null;
  } | null;
  const sellerId = itemInfo?.acquisition_requests?.seller_id;

  if (sellerId) {
    const notifier = new SimulatedNotificationAdapter(createAdminClient());
    await notifier.send({
      recipientId: sellerId,
      channel: "sms",
      type: "status",
      message: `Return Task #${input.returnId.slice(0, 8)} for "${itemInfo?.title ?? "your item"}" is now ${(updatePayload.status ?? task.status).replace(/_/g, " ")}.`,
    });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Customer Segmentation & Targeted Promotional Campaign Dispatch
 */
export async function dispatchSegmentCampaignAction(input: {
  segment: CustomerSegment;
  channel: "sms" | "email";
  message: string;
  promoCode?: string;
}) {
  const auth = await requireAdminPortalRole(["Admin"]);
  if (!auth.ok) return { ok: false, error: auth.error };

  const cleanMessage = input.message.trim();
  if (cleanMessage.length < 4) {
    return {
      ok: false,
      error: "Campaign message must be at least 4 characters long.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: recipients, error } = await supabase
    .from("users")
    .select("user_id")
    .eq("role", "Customer")
    .eq("segment", input.segment);

  if (error) {
    return { ok: false, error: error.message };
  }

  const notifier = new SimulatedNotificationAdapter(createAdminClient());
  const cleanCode = input.promoCode?.trim().toUpperCase();
  const formattedBody = cleanCode
    ? `[${input.segment} Promo • Code: ${cleanCode}] ${cleanMessage}`
    : `[${input.segment} Promo] ${cleanMessage}`;

  let sentCount = 0;
  for (const r of recipients ?? []) {
    await notifier.send({
      recipientId: r.user_id,
      channel: input.channel,
      type: "campaign",
      message: formattedBody,
    });
    sentCount += 1;
  }

  revalidatePath("/", "layout");
  return { ok: true, sentCount };
}

/**
 * Update a Customer's Marketing Segment (Individual / Startup / Enterprise)
 */
export async function updateCustomerSegmentAction(input: {
  userId: string;
  segment: CustomerSegment;
}) {
  const auth = await requireAdminPortalRole(["Admin"]);
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("users")
    .update({ segment: input.segment })
    .eq("user_id", input.userId)
    .eq("role", "Customer");

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Approve or Reject Bulky Furniture Pre-Verification Gate
 */
export async function reviewBulkyPreverificationAction(input: {
  requestId: string;
  decision: "approved" | "rejected";
}) {
  const auth = await requireAdminPortalRole(["Admin"]);
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createSupabaseServerClient();
  const { data: reqRow, error } = await supabase
    .from("acquisition_requests")
    .update({
      preverification_status: input.decision,
      preverified_by: auth.session.userId,
    })
    .eq("request_id", input.requestId)
    .select("seller_id, tracking_code")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (reqRow?.seller_id) {
    const notifier = new SimulatedNotificationAdapter(createAdminClient());
    await notifier.send({
      recipientId: reqRow.seller_id,
      channel: "sms",
      type: "status",
      message:
        input.decision === "approved"
          ? `Bulky pickup request ${reqRow.tracking_code} passed pre-verification and is cleared for zone batch truck scheduling.`
          : `Bulky pickup request ${reqRow.tracking_code} did not pass pre-verification. Please contact support for assistance.`,
    });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Manually Execute Automated Inventory Aging & 7-Day Offer Expiry Engine from Admin MIS
 */
export async function runAdminAgingAndExpiryAction() {
  const auth = await requireAdminPortalRole(["Admin"]);
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("rpc_run_inventory_aging");

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true, summary: data };
}
