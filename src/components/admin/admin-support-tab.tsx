"use client";

import { useMemo, useState } from "react";
import type { AdminClaimRow, AdminReturnTaskRow } from "./admin-types";

interface AdminSupportTabProps {
  isAr: boolean;
  isPending: boolean;
  claims: AdminClaimRow[];
  returnTasks: AdminReturnTaskRow[];
  onResolveClaim: (
    claimId: string,
    status: "in_review" | "resolved" | "rejected",
    note: string,
  ) => Promise<void>;
  onUpdateReturnTask: (
    returnId: string,
    action:
      | "confirm_fee_paid"
      | "authorize_dispatch"
      | "mark_dispatched"
      | "mark_returned",
  ) => Promise<void>;
}

const CLAIM_STATUS_STYLES: Record<string, string> = {
  open: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  in_review:
    "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",
  resolved:
    "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  rejected:
    "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
};

export function AdminSupportTab({
  isAr,
  isPending,
  claims,
  returnTasks,
  onResolveClaim,
  onUpdateReturnTask,
}: AdminSupportTabProps) {
  const [defaultResolutionNote, setDefaultResolutionNote] = useState(
    "Approved free replacement battery under 90-day Mustadama warranty.",
  );
  const [perClaimNotes, setPerClaimNotes] = useState<Record<string, string>>(
    {},
  );
  const [claimFilter, setClaimFilter] = useState<
    "all" | "open" | "in_review" | "resolved" | "rejected"
  >("all");

  const filteredClaims = useMemo(() => {
    if (claimFilter === "all") return claims;
    return claims.filter((c) => c.status === claimFilter);
  }, [claims, claimFilter]);

  const getNoteForClaim = (claimId: string) =>
    perClaimNotes[claimId] ?? defaultResolutionNote;

  const isWarrantyActive = (warrantyEndDate?: string | null) => {
    if (!warrantyEndDate) return null;
    const today = new Date().toISOString().slice(0, 10);
    return today <= warrantyEndDate;
  };

  return (
    <div className="space-y-6">
      {/* Warranty Claims Queue */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {isAr
                ? "قائمة مطالبات الضمان وخدمة العملاء"
                : "Customer Service Warranty Claims Queue"}
            </h2>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
              {isAr
                ? "فرز مطالبات ما بعد البيع، التحقق من سريان الضمان، وإرسال قرارات المعالجة للمشترين."
                : "Triage post-sale claims, verify active warranty coverage, and dispatch buyer notifications."}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(["all", "open", "in_review", "resolved", "rejected"] as const).map(
              (st) => {
                const count =
                  st === "all"
                    ? claims.length
                    : claims.filter((c) => c.status === st).length;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setClaimFilter(st)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                      claimFilter === st
                        ? "bg-emerald-700 text-white"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    {st === "all"
                      ? isAr
                        ? `الكل (${count})`
                        : `All (${count})`
                      : `${st.replace("_", " ")} (${count})`}
                  </button>
                );
              },
            )}
          </div>
        </div>

        {/* Shared Quick Resolution Template Input */}
        <div>
          <label
            htmlFor="default-resolution-note"
            className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1"
          >
            {isAr
              ? "ملاحظة التسوية الافتراضية للمطالبات:"
              : "Default Resolution Note Template:"}
          </label>
          <input
            id="default-resolution-note"
            type="text"
            value={defaultResolutionNote}
            onChange={(e) => setDefaultResolutionNote(e.target.value)}
            placeholder={
              isAr ? "أدخل ملاحظة المعالجة..." : "Resolution note..."
            }
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-xs"
          />
        </div>

        {filteredClaims.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 py-8 text-center text-xs text-neutral-500">
            {isAr
              ? "لا توجد مطالبات ضمان في هذه القائمة."
              : "No warranty claims match the selected filter."}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClaims.map((c) => {
              const active = isWarrantyActive(c.warranty_end_date);
              const badgeClass =
                CLAIM_STATUS_STYLES[c.status] ?? CLAIM_STATUS_STYLES.open;
              const canAction = c.status === "open" || c.status === "in_review";

              return (
                <div
                  key={c.claim_id}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 text-xs space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          dir="ltr"
                          className="font-mono font-bold text-neutral-900 dark:text-neutral-100"
                        >
                          Claim #{c.claim_id.slice(0, 8)}
                        </span>
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase ${badgeClass}`}
                        >
                          {c.status.replace("_", " ")}
                        </span>
                        {active !== null && (
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              active
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                            }`}
                          >
                            {active
                              ? isAr
                                ? `الضمان سارٍ حتى ${c.warranty_end_date}`
                                : `Covered until ${c.warranty_end_date}`
                              : isAr
                                ? `الضمان منتهٍ (${c.warranty_end_date})`
                                : `Expired (${c.warranty_end_date})`}
                          </span>
                        )}
                      </div>

                      {(c.item_title || c.buyer_name) && (
                        <p className="text-neutral-700 dark:text-neutral-300 font-medium">
                          {c.item_title
                            ? `${isAr && c.item_title_ar ? c.item_title_ar : c.item_title}${c.item_barcode ? ` [${c.item_barcode}]` : ""}`
                            : ""}
                          {c.buyer_name
                            ? ` • ${c.buyer_name}${c.buyer_email ? ` (${c.buyer_email})` : ""}`
                            : ""}
                        </p>
                      )}

                      <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {c.description}
                      </p>

                      {c.resolution_note && (
                        <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                          {isAr ? "ملاحظة التسوية:" : "Resolution:"}{" "}
                          {c.resolution_note}
                        </p>
                      )}
                    </div>

                    <span
                      dir="ltr"
                      className="font-mono text-[11px] text-neutral-500 shrink-0"
                    >
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {canAction && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                      <input
                        type="text"
                        aria-label={`Resolution note for claim ${c.claim_id.slice(0, 8)}`}
                        value={getNoteForClaim(c.claim_id)}
                        onChange={(e) =>
                          setPerClaimNotes((prev) => ({
                            ...prev,
                            [c.claim_id]: e.target.value,
                          }))
                        }
                        className="flex-1 min-w-[200px] rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-1.5 text-xs"
                      />
                      {c.status === "open" && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            onResolveClaim(
                              c.claim_id,
                              "in_review",
                              getNoteForClaim(c.claim_id),
                            )
                          }
                          className="rounded-lg border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-200 px-3 py-1.5 font-semibold cursor-pointer disabled:opacity-50"
                        >
                          {isAr ? "قيد المراجعة الفنية" : "Mark In Review"}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          onResolveClaim(
                            c.claim_id,
                            "resolved",
                            getNoteForClaim(c.claim_id),
                          )
                        }
                        className="rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 font-semibold cursor-pointer disabled:opacity-50"
                      >
                        {isAr
                          ? "اعتماد وإغلاق المطالبة"
                          : "Approve & Resolve Claim"}
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          onResolveClaim(
                            c.claim_id,
                            "rejected",
                            getNoteForClaim(c.claim_id),
                          )
                        }
                        className="rounded-lg bg-rose-700 hover:bg-rose-600 text-white px-3 py-1.5 font-semibold cursor-pointer disabled:opacity-50"
                      >
                        {isAr ? "رفض المطالبة" : "Reject"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Return Authorizations Queue (Rejected / 7-Day Auto-Rejected Seller Offers) */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            {isAr
              ? `تفويضات إرجاع القطع للبائعين (${returnTasks.length})`
              : `Seller Return Authorizations (${returnTasks.length})`}
          </h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
            {isAr
              ? "متابعة رسوم النقل والفحص وتفويض خروج الشحنات المرتجعة بعد سداد الرسوم."
              : "Track return transport & inspection fees and authorize warehouse release once settled."}
          </p>
        </div>

        {returnTasks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 py-8 text-center text-xs text-neutral-500">
            {isAr
              ? "لا توجد مهام إرجاع مفتوحة حالياً."
              : "No active seller return tasks at the moment."}
          </div>
        ) : (
          <div className="space-y-2.5">
            {returnTasks.map((rt) => (
              <div
                key={rt.return_id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 dark:border-neutral-800 p-3.5 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span dir="ltr" className="font-mono font-bold">
                      Return #{rt.return_id.slice(0, 8)}
                    </span>
                    <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[11px] font-medium">
                      {rt.status.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        rt.fee_status === "paid"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                      }`}
                    >
                      {isAr ? "الرسوم:" : "Fee:"}{" "}
                      <span dir="ltr" className="font-mono">
                        {Number(rt.fee_amount).toLocaleString()} EGP ({rt.fee_status})
                      </span>
                    </span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {rt.item_title ?? rt.item_serial_id.slice(0, 8)}
                    {rt.item_barcode ? ` • ${rt.item_barcode}` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {rt.fee_status === "pending" && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        onUpdateReturnTask(rt.return_id, "confirm_fee_paid")
                      }
                      className="rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 font-semibold cursor-pointer disabled:opacity-50"
                    >
                      {isAr
                        ? "تأكيد السداد وتفويض الخروج"
                        : "Confirm Fee & Authorize Release"}
                    </button>
                  )}
                  {rt.fee_status === "paid" &&
                    rt.status === "ready_for_dispatch" && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          onUpdateReturnTask(rt.return_id, "mark_dispatched")
                        }
                        className="rounded-lg bg-sky-700 hover:bg-sky-600 text-white px-3 py-1.5 font-semibold cursor-pointer disabled:opacity-50"
                      >
                        {isAr ? "تأكيد الشحن للمندوب" : "Mark Dispatched"}
                      </button>
                    )}
                  {rt.status === "dispatched" && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        onUpdateReturnTask(rt.return_id, "mark_returned")
                      }
                      className="rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 font-semibold cursor-pointer disabled:opacity-50"
                    >
                      {isAr ? "تأكيد الاستلام للبائع" : "Mark Returned"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

