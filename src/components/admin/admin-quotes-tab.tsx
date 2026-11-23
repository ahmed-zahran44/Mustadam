"use client";

import { useMemo, useState } from "react";
import type { AdminQuoteRow } from "./admin-types";

interface AdminQuotesTabProps {
  isAr: boolean;
  isAdmin: boolean;
  isPending: boolean;
  quotes: AdminQuoteRow[];
  onApproveQuote: (quoteId: string, discountPct: number) => Promise<void>;
  onExpireQuote: (quoteId: string) => Promise<void>;
}

const QUOTE_STATUS_STYLES: Record<string, string> = {
  requested:
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  quoted:
    "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  accepted:
    "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",
  expired:
    "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
};

export function AdminQuotesTab({
  isAr,
  isAdmin,
  isPending,
  quotes,
  onApproveQuote,
  onExpireQuote,
}: AdminQuotesTabProps) {
  const [defaultDiscount, setDefaultDiscount] = useState(12);
  const [perQuoteDiscounts, setPerQuoteDiscounts] = useState<
    Record<string, number>
  >({});
  const [statusFilter, setStatusFilter] = useState<
    "all" | "requested" | "quoted" | "accepted" | "expired"
  >("all");

  const filteredQuotes = useMemo(() => {
    if (statusFilter === "all") return quotes;
    return quotes.filter((q) => q.status === statusFilter);
  }, [quotes, statusFilter]);

  const getDiscountForQuote = (quoteId: string) =>
    perQuoteDiscounts[quoteId] ?? defaultDiscount;

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            {isAr
              ? "مراجعة واعتماد عروض الأسعار للشركات"
              : "Corporate Bulk Quote Approval"}
          </h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
            {isAr
              ? "تطبيق خصم مخصص للشركات مع صلاحية ملزمة لمدة ٧ أيام وإشعار فوري للمشتري."
              : "Apply custom B2B bulk discounts with a binding 7-day quote validity window."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <label
              htmlFor="default-b2b-discount"
              className="text-neutral-600 dark:text-neutral-400 font-medium"
            >
              {isAr ? "نسبة الخصم الافتراضية %:" : "B2B Discount %:"}
            </label>
            <input
              id="default-b2b-discount"
              type="number"
              min={0}
              max={50}
              dir="ltr"
              disabled={!isAdmin}
              value={defaultDiscount}
              onChange={(e) => setDefaultDiscount(Number(e.target.value))}
              className="w-20 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-2.5 py-1.5 font-mono tabular-nums text-xs"
            />
          </div>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap gap-1.5">
        {(["all", "requested", "quoted", "accepted", "expired"] as const).map(
          (st) => {
            const count =
              st === "all"
                ? quotes.length
                : quotes.filter((q) => q.status === st).length;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                  statusFilter === st
                    ? "bg-emerald-700 text-white"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                }`}
              >
                {st === "all"
                  ? isAr
                    ? `الكل (${count})`
                    : `All (${count})`
                  : `${st} (${count})`}
              </button>
            );
          },
        )}
      </div>

      {/* Quote Cards */}
      {filteredQuotes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 py-10 text-center text-xs text-neutral-500">
          {isAr
            ? "لا توجد طلبات عروض أسعار شركات ضمن هذه الحالة."
            : "No corporate bulk quote requests match this status filter."}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuotes.map((q) => {
            const items = q.items ?? [];
            const originalSubtotal = items.reduce(
              (sum, it) => sum + Number(it.selling_price ?? 0),
              0,
            );
            const activePct =
              q.status === "requested"
                ? getDiscountForQuote(q.quote_id)
                : Number(q.discount_pct ?? 0);
            const discountedTotal = Math.round(
              originalSubtotal * (1 - activePct / 100),
            );
            const badgeClass =
              QUOTE_STATUS_STYLES[q.status] ?? QUOTE_STATUS_STYLES.expired;

            return (
              <div
                key={q.quote_id}
                className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-3 text-xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        dir="ltr"
                        className="font-mono font-bold text-neutral-900 dark:text-neutral-100"
                      >
                        Quote #{q.quote_id.slice(0, 8)}
                      </span>
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase ${badgeClass}`}
                      >
                        {q.status}
                      </span>
                      {q.buyer_segment && (
                        <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
                          {q.buyer_segment}
                        </span>
                      )}
                    </div>
                    <p className="text-neutral-700 dark:text-neutral-300 font-medium">
                      {q.buyer_name ?? (isAr ? "مشتري شركات" : "Corporate Buyer")}
                      {q.buyer_email ? ` (${q.buyer_email})` : ""}
                      {q.buyer_tax_id
                        ? ` • ${isAr ? "بطاقة ضريبية:" : "Tax ID:"} ${q.buyer_tax_id}`
                        : ""}
                    </p>
                    <p className="text-neutral-500">
                      {isAr ? "الخصم:" : "Discount:"}{" "}
                      <strong dir="ltr" className="font-mono">
                        {q.discount_pct}%
                      </strong>{" "}
                      • {isAr ? "صالح حتى:" : "Valid Until:"}{" "}
                      <span dir="ltr" className="font-mono">
                        {q.valid_until
                          ? new Date(q.valid_until).toLocaleDateString()
                          : isAr
                            ? "قيد المراجعة"
                            : "Pending"}
                      </span>
                    </p>
                  </div>

                  {/* Subtotal & Action Controls */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {originalSubtotal > 0 && (
                      <div className="text-end pe-2">
                        <p
                          dir="ltr"
                          className="font-mono text-[11px] text-neutral-500 line-through"
                        >
                          {originalSubtotal.toLocaleString()} EGP
                        </p>
                        <p
                          dir="ltr"
                          className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400"
                        >
                          {discountedTotal.toLocaleString()} EGP
                        </p>
                      </div>
                    )}

                    {q.status === "requested" && isAdmin && (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          dir="ltr"
                          aria-label={`Discount % for quote ${q.quote_id.slice(0, 8)}`}
                          value={getDiscountForQuote(q.quote_id)}
                          onChange={(e) =>
                            setPerQuoteDiscounts((prev) => ({
                              ...prev,
                              [q.quote_id]: Number(e.target.value),
                            }))
                          }
                          className="w-16 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 py-1.5 font-mono tabular-nums text-xs"
                        />
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            onApproveQuote(
                              q.quote_id,
                              getDiscountForQuote(q.quote_id),
                            )
                          }
                          className="rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white px-3.5 py-1.5 font-semibold transition cursor-pointer disabled:opacity-50"
                        >
                          {isAr
                            ? "اعتماد العرض (صالح ٧ أيام)"
                            : "Approve Quote (Valid 7 Days)"}
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => onExpireQuote(q.quote_id)}
                          className="rounded-lg border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-1.5 font-semibold transition cursor-pointer disabled:opacity-50"
                        >
                          {isAr ? "إنهاء الصلاحية" : "Expire"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quoted Serialized Units */}
                {items.length > 0 && (
                  <div className="rounded-lg bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200/70 dark:border-neutral-800 p-3 space-y-1.5">
                    <p className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                      {isAr
                        ? `القطع المدرجة في العرض (${items.length}):`
                        : `Quoted Serialized Units (${items.length}):`}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {items.map((it) => (
                        <div
                          key={it.item_serial_id}
                          className="flex items-center justify-between gap-2 text-[11px] text-neutral-700 dark:text-neutral-300"
                        >
                          <span className="truncate">
                            {isAr && it.title_ar ? it.title_ar : it.title}
                            {it.condition_grade
                              ? ` (Grade ${it.condition_grade})`
                              : ""}
                          </span>
                          <span
                            dir="ltr"
                            className="font-mono tabular-nums text-neutral-600 dark:text-neutral-400 shrink-0"
                          >
                            {Number(it.selling_price ?? 0).toLocaleString()} EGP
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

