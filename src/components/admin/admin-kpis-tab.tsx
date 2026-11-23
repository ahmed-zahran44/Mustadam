"use client";

import type { AdminKpiStats } from "./admin-types";

interface AdminKpisTabProps {
  isAr: boolean;
  isAdmin: boolean;
  isPending: boolean;
  kpis: AdminKpiStats;
  agingSummary: string | null;
  onRunAging: () => void;
}

const LIFECYCLE_LABELS: Record<string, { en: string; ar: string; tone: string }> = {
  Submitted: { en: "Submitted", ar: "مُقدّم", tone: "bg-slate-400" },
  Awaiting_Handover: { en: "Awaiting Handover", ar: "بانتظار التسليم", tone: "bg-sky-500" },
  Received_At_Dropoff_Hub: { en: "At Drop-off Hub", ar: "في مركز الاستلام", tone: "bg-cyan-500" },
  In_Transit_To_Warehouse: { en: "In Transit", ar: "قيد النقل للمستودع", tone: "bg-indigo-500" },
  Received_Pending_Inspection: { en: "Pending Inspection", ar: "بانتظار الفحص", tone: "bg-violet-500" },
  Awaiting_Seller_Decision: { en: "Awaiting Seller Decision", ar: "بانتظار قرار البائع", tone: "bg-amber-500" },
  Return_In_Progress: { en: "Return In Progress", ar: "قيد الإرجاع", tone: "bg-rose-500" },
  Under_Refurbishment: { en: "Under Refurbishment", ar: "قيد التجديد", tone: "bg-blue-600" },
  Pending_Dismantling: { en: "Pending Dismantling", ar: "بانتظار التفكيك", tone: "bg-orange-500" },
  Listed_In_Store: { en: "Listed In Store", ar: "معروض بالمتجر", tone: "bg-emerald-600" },
  Sold: { en: "Sold", ar: "تم البيع", tone: "bg-emerald-700" },
  Decommissioned_Aged: { en: "Decommissioned (91+ d)", ar: "مستبعد بالتقادم (+٩٠ يوم)", tone: "bg-rose-600" },
  Scrap_Ready_For_Recycling: { en: "Scrap Ready", ar: "خردة جاهزة للتدوير", tone: "bg-stone-500" },
  Recycled_Closed: { en: "Recycled & Closed", ar: "مُدوّر ومغلق", tone: "bg-teal-700" },
};

export function AdminKpisTab({
  isAr,
  isAdmin,
  isPending,
  kpis,
  agingSummary,
  onRunAging,
}: AdminKpisTabProps) {
  const totalCircularRevenue =
    kpis.totalStoreSalesRevenue + kpis.totalRecyclingRevenue;
  const totalAgingTracked =
    kpis.aging0to30Count +
    kpis.aging31to60Count +
    kpis.aging61to90Count +
    kpis.decommissionedAgedCount;

  const agingBarPct = (count: number) =>
    totalAgingTracked > 0 ? Math.round((count / totalAgingTracked) * 100) : 0;

  const lifecycleEntries = Object.entries(kpis.lifecycleCounts ?? {}).filter(
    ([, count]) => count > 0,
  );
  const maxLifecycleCount = Math.max(
    1,
    ...lifecycleEntries.map(([, count]) => count),
  );

  const materialEntries = Object.entries(kpis.materialDiversionKg ?? {}).filter(
    ([, kg]) => kg > 0,
  );
  const totalMaterialKg = Math.max(
    0.1,
    materialEntries.reduce((sum, [, kg]) => sum + kg, 0),
  );

  const acceptedCount = kpis.acceptedOffersCount ?? 0;
  const rejectedCount = kpis.rejectedOffersCount ?? 0;
  const autoRejectedCount = kpis.autoRejectedOffersCount ?? 0;
  const pendingCount = kpis.pendingOffersCount ?? 0;

  return (
    <div className="space-y-6">
      {/* Primary Financial, Operational & Environmental KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-1.5">
          <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            {isAr
              ? "إجمالي إيرادات المبيعات والتدوير"
              : "Total Circular Revenue (Sales + Scrap)"}
          </p>
          <p
            dir="ltr"
            className="text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 text-start"
          >
            {totalCircularRevenue.toLocaleString()} EGP
          </p>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            {isAr
              ? `المتجر: ${kpis.totalStoreSalesRevenue.toLocaleString()} ج.م • التدوير: ${kpis.totalRecyclingRevenue.toLocaleString()} ج.م`
              : `Store: ${kpis.totalStoreSalesRevenue.toLocaleString()} EGP • Recycling: ${kpis.totalRecyclingRevenue.toLocaleString()} EGP`}
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-1.5">
          <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            {isAr ? "متوسط هامش الربح للقطعة" : "Avg Profit Margin / Unit"}
          </p>
          <p
            dir="ltr"
            className="text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 text-start"
          >
            {kpis.avgProfitMarginEgp.toLocaleString()} EGP
          </p>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            {isAr
              ? "بعد الشراء والنقل الموزع وتكلفة التجديد وقطع الغيار"
              : "After purchase, allocated logistics, and refurb/parts cost"}
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-1.5">
          <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            {isAr ? "نسبة قبول عروض البائعين" : "Seller Offer Acceptance Rate"}
          </p>
          <p
            dir="ltr"
            className="text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 text-start"
          >
            {kpis.sellerOfferAcceptanceRatePct}%
          </p>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            {isAr
              ? `مقبول: ${acceptedCount} • مرفوض: ${rejectedCount + autoRejectedCount} • معلق: ${pendingCount}`
              : `Accepted: ${acceptedCount} • Rejected: ${rejectedCount + autoRejectedCount} • Pending: ${pendingCount}`}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/25 p-5 space-y-1.5">
          <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-300 uppercase tracking-wide">
            {isAr
              ? "الأثر البيئي: النفايات المنقذة من المكبات"
              : "Environmental Impact: Landfill Diversion"}
          </p>
          <p
            dir="ltr"
            className="text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 text-start"
          >
            {kpis.totalLandfillDivertedKg.toLocaleString()} kg
          </p>
          <p className="text-xs text-emerald-900/80 dark:text-emerald-300/80">
            {isAr
              ? `تقدير خفض الكربون: ~${(kpis.estimatedCo2SavedKg ?? 0).toLocaleString()} كجم CO₂e`
              : `Est. CO₂e avoided: ~${(kpis.estimatedCo2SavedKg ?? 0).toLocaleString()} kg`}
          </p>
        </div>
      </div>

      {/* Operational Velocity Strip: Turnaround Time, Paid Orders, Sold Net Margin, Audit Trail */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70 p-4">
          <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
            {isAr
              ? "متوسط زمن الدورة (من الاستلام حتى البيع)"
              : "Avg Turnaround (Receipt to Sale)"}
          </p>
          <p
            dir="ltr"
            className="mt-1 text-xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 text-start"
          >
            {kpis.avgTurnaroundDays !== null &&
            kpis.avgTurnaroundDays !== undefined
              ? `${kpis.avgTurnaroundDays} ${isAr ? "يوم" : "days"}`
              : "—"}
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70 p-4">
          <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
            {isAr ? "الطلبات المدفوعة المكتملة" : "Completed Paid Orders"}
          </p>
          <p
            dir="ltr"
            className="mt-1 text-xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 text-start"
          >
            {(kpis.totalSoldOrdersCount ?? 0).toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70 p-4">
          <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
            {isAr ? "هامش الربح الفعلي للقطع المباعة" : "Realized Sold Margin / Unit"}
          </p>
          <p
            dir="ltr"
            className="mt-1 text-xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 text-start"
          >
            {(kpis.soldAvgProfitMarginEgp ?? kpis.avgProfitMarginEgp).toLocaleString()} EGP
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70 p-4">
          <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
            {isAr ? "سجلات تدقيق دورة الحياة" : "Lifecycle Audit Log Entries"}
          </p>
          <p
            dir="ltr"
            className="mt-1 text-xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 text-start"
          >
            {kpis.totalAuditLogEntries.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Inventory Aging & 30-60-90 Day Automated Markdown Engine */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {isAr
                ? "توزيع تقادم المخزون ودورة التسعير التدريجي (٣٠–٦٠–٩٠ يوماً)"
                : "Inventory Aging & Automated Markdown Breakdown"}
            </h2>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
              {isAr
                ? "تقييم يومي تلقائي للقطع المعروضة، وانتهاء عروض البائعين بعد ٧ أيام (١٦٨ ساعة)."
                : "Automated daily evaluation of listed inventory tiers and 7-day (168h) seller offer expirations."}
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              disabled={isPending}
              onClick={onRunAging}
              data-testid="admin-run-aging-btn"
              className="rounded-lg border border-amber-500/40 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 px-3.5 py-2 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              {isPending
                ? isAr
                  ? "جارٍ تنفيذ الفحص..."
                  : "Running Engine..."
                : isAr
                  ? "تشغيل محرك التقادم وانتهاء العروض الآن"
                  : "Run Aging & Offer Expiry Engine"}
            </button>
          )}
        </div>

        {agingSummary && (
          <div className="rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 px-4 py-2.5 text-xs text-emerald-900 dark:text-emerald-200 font-mono">
            {agingSummary}
          </div>
        )}

        {/* Stacked Proportional Distribution Bar */}
        {totalAgingTracked > 0 && (
          <div className="space-y-1.5">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div
                style={{ width: `${agingBarPct(kpis.aging0to30Count)}%` }}
                className="bg-emerald-600 transition-all"
                title={`0-30 Days: ${kpis.aging0to30Count}`}
              />
              <div
                style={{ width: `${agingBarPct(kpis.aging31to60Count)}%` }}
                className="bg-amber-500 transition-all"
                title={`31-60 Days: ${kpis.aging31to60Count}`}
              />
              <div
                style={{ width: `${agingBarPct(kpis.aging61to90Count)}%` }}
                className="bg-orange-500 transition-all"
                title={`61-90 Days: ${kpis.aging61to90Count}`}
              />
              <div
                style={{
                  width: `${agingBarPct(kpis.decommissionedAgedCount)}%`,
                }}
                className="bg-rose-600 transition-all"
                title={`91+ Days: ${kpis.decommissionedAgedCount}`}
              />
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              {isAr
                ? `إجمالي القطع الخاضعة لمراقبة التقادم: ${totalAgingTracked} قطعة`
                : `Total units tracked in active aging window: ${totalAgingTracked}`}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-4 border border-emerald-200 dark:border-emerald-900">
            <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
              {isAr
                ? "٠–٣٠ يوماً (السعر الأساسي +٣٥٪)"
                : "0–30 Days (Standard Price)"}
            </p>
            <p
              dir="ltr"
              className="text-2xl font-bold font-mono tabular-nums mt-1 text-emerald-800 dark:text-emerald-300 text-start"
            >
              {kpis.aging0to30Count}
            </p>
            <p
              dir="ltr"
              className="text-xs font-mono text-emerald-800/80 dark:text-emerald-400/80 text-start"
            >
              {agingBarPct(kpis.aging0to30Count)}%
            </p>
          </div>

          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 p-4 border border-amber-200 dark:border-amber-900">
            <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
              {isAr
                ? "٣١–٦٠ يوماً (تخفيض -٢٠٪)"
                : "31–60 Days (-20% Markdown)"}
            </p>
            <p
              dir="ltr"
              className="text-2xl font-bold font-mono tabular-nums mt-1 text-amber-800 dark:text-amber-300 text-start"
            >
              {kpis.aging31to60Count}
            </p>
            <p
              dir="ltr"
              className="text-xs font-mono text-amber-800/80 dark:text-amber-400/80 text-start"
            >
              {agingBarPct(kpis.aging31to60Count)}%
            </p>
          </div>

          <div className="rounded-lg bg-orange-50 dark:bg-orange-950/40 p-4 border border-orange-200 dark:border-orange-900">
            <p className="text-xs font-semibold text-orange-900 dark:text-orange-200">
              {isAr
                ? "٦١–٩٠ يوماً (بسعر التكلفة)"
                : "61–90 Days (At Unit Cost)"}
            </p>
            <p
              dir="ltr"
              className="text-2xl font-bold font-mono tabular-nums mt-1 text-orange-800 dark:text-orange-300 text-start"
            >
              {kpis.aging61to90Count}
            </p>
            <p
              dir="ltr"
              className="text-xs font-mono text-orange-800/80 dark:text-orange-400/80 text-start"
            >
              {agingBarPct(kpis.aging61to90Count)}%
            </p>
          </div>

          <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-4 border border-rose-200 dark:border-rose-900">
            <p className="text-xs font-semibold text-rose-900 dark:text-rose-200">
              {isAr
                ? "+٩١ يوماً (Decommissioned_Aged)"
                : "91+ Days (Decommissioned_Aged)"}
            </p>
            <p
              dir="ltr"
              className="text-2xl font-bold font-mono tabular-nums mt-1 text-rose-800 dark:text-rose-300 text-start"
            >
              {kpis.decommissionedAgedCount}
            </p>
            <p
              dir="ltr"
              className="text-xs font-mono text-rose-800/80 dark:text-rose-400/80 text-start"
            >
              {agingBarPct(kpis.decommissionedAgedCount)}%
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Charts Row: Lifecycle Pipeline Distribution + Material Diversion Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Item Lifecycle Pipeline Bar Chart */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            {isAr
              ? "توزيع القطع عبر مراحل دورة الحياة"
              : "Serialized Item Lifecycle Distribution"}
          </h2>
          {lifecycleEntries.length === 0 ? (
            <p className="text-xs text-neutral-500">
              {isAr
                ? "لا توجد قطع مسجلة في النظام حالياً."
                : "No serialized items recorded yet."}
            </p>
          ) : (
            <div className="space-y-3">
              {lifecycleEntries.map(([status, count]) => {
                const meta = LIFECYCLE_LABELS[status] ?? {
                  en: status.replace(/_/g, " "),
                  ar: status,
                  tone: "bg-neutral-500",
                };
                const widthPct = Math.max(
                  6,
                  Math.round((count / maxLifecycleCount) * 100),
                );
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {isAr ? meta.ar : meta.en}
                      </span>
                      <span
                        dir="ltr"
                        className="font-mono tabular-nums font-semibold text-neutral-700 dark:text-neutral-300"
                      >
                        {count}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${meta.tone}`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Environmental Material Diversion Breakdown */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            {isAr
              ? "تفصيل الأثر البيئي حسب المسار والخامة"
              : "Environmental Diversion by Stream & Material"}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/70 bg-emerald-50/40 dark:bg-emerald-950/30 p-3.5">
              <p className="text-xs text-emerald-900/80 dark:text-emerald-300/80 font-medium">
                {isAr ? "إعادة الاستخدام والتجديد" : "Refurbished & Re-Commerce"}
              </p>
              <p
                dir="ltr"
                className="text-lg font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-0.5 text-start"
              >
                {(kpis.refurbishedDivertedKg ?? kpis.totalLandfillDivertedKg).toLocaleString()} kg
              </p>
            </div>
            <div className="rounded-lg border border-teal-200 dark:border-teal-900/70 bg-teal-50/40 dark:bg-teal-950/30 p-3.5">
              <p className="text-xs text-teal-900/80 dark:text-teal-300/80 font-medium">
                {isAr ? "تدوير مرخص للخردة" : "Licensed Scrap Recycling"}
              </p>
              <p
                dir="ltr"
                className="text-lg font-bold font-mono tabular-nums text-teal-700 dark:text-teal-400 mt-0.5 text-start"
              >
                {(kpis.recycledDivertedKg ?? 0).toLocaleString()} kg
              </p>
            </div>
          </div>

          {materialEntries.length > 0 ? (
            <div className="space-y-2.5 pt-1">
              {materialEntries.map(([material, kg]) => {
                const pct = Math.round((kg / totalMaterialKg) * 100);
                return (
                  <div key={material} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {material}
                      </span>
                      <span
                        dir="ltr"
                        className="font-mono tabular-nums text-neutral-600 dark:text-neutral-400"
                      >
                        {kg.toFixed(1)} kg ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-600"
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-neutral-600 dark:text-neutral-400 pt-2">
              {isAr
                ? "ستظهر تفاصيل الأوزان حسب نوع المادة تلقائياً عند تسجيل دفعات التفكيك وإعادة التدوير."
                : "Material-level weight breakdowns appear automatically as dismantling and licensed recycling batches are logged."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

