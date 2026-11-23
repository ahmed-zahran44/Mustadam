"use client";

import { useMemo, useState } from "react";
import type {
  AdminAuditLogRow,
  AdminBulkyRequestRow,
  AdminInventoryRow,
} from "./admin-types";

interface AdminOperationsTabProps {
  isAr: boolean;
  isAdmin: boolean;
  isPending: boolean;
  bulkyRequests: AdminBulkyRequestRow[];
  inventoryItems: AdminInventoryRow[];
  auditLogs: AdminAuditLogRow[];
  onReviewBulky: (
    requestId: string,
    decision: "approved" | "rejected",
  ) => Promise<void>;
}

export function AdminOperationsTab({
  isAr,
  isAdmin,
  isPending,
  bulkyRequests,
  inventoryItems,
  auditLogs,
  onReviewBulky,
}: AdminOperationsTabProps) {
  const [bulkyFilter, setBulkyFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [invStatusFilter, setInvStatusFilter] = useState<string>("all");
  const [invSearch, setInvSearch] = useState("");
  const [auditSearch, setAuditSearch] = useState("");

  const filteredBulky = useMemo(() => {
    if (bulkyFilter === "all") return bulkyRequests;
    return bulkyRequests.filter(
      (r) => r.preverification_status === bulkyFilter,
    );
  }, [bulkyRequests, bulkyFilter]);

  const distinctStatuses = useMemo(
    () => Array.from(new Set(inventoryItems.map((i) => i.current_status))),
    [inventoryItems],
  );

  const filteredInventory = useMemo(() => {
    const q = invSearch.trim().toLowerCase();
    return inventoryItems.filter((it) => {
      if (invStatusFilter !== "all" && it.current_status !== invStatusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        it.title.toLowerCase().includes(q) ||
        (it.title_ar ?? "").toLowerCase().includes(q) ||
        (it.barcode ?? "").toLowerCase().includes(q) ||
        it.item_serial_id.toLowerCase().includes(q)
      );
    });
  }, [inventoryItems, invStatusFilter, invSearch]);

  const filteredAudit = useMemo(() => {
    const q = auditSearch.trim().toLowerCase();
    if (!q) return auditLogs;
    return auditLogs.filter(
      (a) =>
        (a.item_title ?? "").toLowerCase().includes(q) ||
        (a.item_barcode ?? "").toLowerCase().includes(q) ||
        a.to_status.toLowerCase().includes(q) ||
        (a.from_status ?? "").toLowerCase().includes(q) ||
        (a.actor_name ?? "").toLowerCase().includes(q),
    );
  }, [auditLogs, auditSearch]);

  return (
    <div className="space-y-6">
      {/* 1. Bulky Furniture Pre-Verification Approval Gate */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {isAr
                ? `اعتماد الفحص المسبق للأثاث الضخم والنقل الجماعي (${bulkyRequests.length})`
                : `Bulky Furniture Pre-Verification Gate (${bulkyRequests.length})`}
            </h2>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
              {isAr
                ? "مراجعة واعتماد طلبات الأثاث والأجهزة الكبيرة قبل السماح بجدولة شاحنة التجميع."
                : "Approve or reject remote pre-verification checks before clearing bulky pickups for batch truck dispatch."}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["all", "pending", "approved", "rejected"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setBulkyFilter(st)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                  bulkyFilter === st
                    ? "bg-emerald-700 text-white"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                }`}
              >
                {st === "all" ? (isAr ? "الكل" : "All") : st}
              </button>
            ))}
          </div>
        </div>

        {filteredBulky.length === 0 ? (
          <p className="text-xs text-neutral-500 py-6 text-center">
            {isAr
              ? "لا توجد طلبات نقل ضخم ضمن هذه الحالة."
              : "No bulky pickup requests match this filter."}
          </p>
        ) : (
          <div className="space-y-2.5">
            {filteredBulky.map((req) => (
              <div
                key={req.request_id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 dark:border-neutral-800 p-3.5 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span dir="ltr" className="font-mono font-bold">
                      {req.tracking_code}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${
                        req.preverification_status === "approved"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : req.preverification_status === "rejected"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                    >
                      {req.preverification_status}
                    </span>
                    <span className="text-neutral-500">
                      {req.request_type} • {req.item_count}{" "}
                      {isAr ? "قطعة" : "unit(s)"}
                    </span>
                  </div>
                  <p className="text-neutral-700 dark:text-neutral-300">
                    {req.seller_name ?? (isAr ? "بائع" : "Seller")}
                    {req.pickup_address ? ` • ${req.pickup_address}` : ""}
                  </p>
                  {req.item_titles.length > 0 && (
                    <p className="text-[11px] text-neutral-500">
                      {req.item_titles.slice(0, 3).join(", ")}
                      {req.item_titles.length > 3
                        ? ` +${req.item_titles.length - 3}`
                        : ""}
                    </p>
                  )}
                </div>

                {isAdmin && req.preverification_status !== "approved" && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => onReviewBulky(req.request_id, "approved")}
                      className="rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 font-semibold cursor-pointer disabled:opacity-50"
                    >
                      {isAr ? "اعتماد الفحص المسبق" : "Approve Dispatch"}
                    </button>
                    {req.preverification_status !== "rejected" && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          onReviewBulky(req.request_id, "rejected")
                        }
                        className="rounded-lg bg-rose-700 hover:bg-rose-600 text-white px-3 py-1.5 font-semibold cursor-pointer disabled:opacity-50"
                      >
                        {isAr ? "رفض" : "Reject"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Serialized Inventory & Unit Economics Explorer */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            {isAr
              ? `سجل القطع التسلسلية واقتصاديات الوحدة (${filteredInventory.length})`
              : `Serialized Inventory & Unit Economics (${filteredInventory.length})`}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label={isAr ? "تصفية حسب الحالة" : "Filter by status"}
              value={invStatusFilter}
              onChange={(e) => setInvStatusFilter(e.target.value)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-xs"
            >
              <option value="all">
                {isAr ? "كل الحالات" : "All Lifecycle States"}
              </option>
              {distinctStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              type="search"
              value={invSearch}
              onChange={(e) => setInvSearch(e.target.value)}
              placeholder={
                isAr ? "بحث بالباركود أو الاسم..." : "Search title or barcode..."
              }
              className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-1.5 text-xs w-48"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 bg-white dark:bg-neutral-900">
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500">
                <th className="py-2 pe-3 font-semibold text-start">
                  {isAr ? "القطعة / الباركود" : "Item / Barcode"}
                </th>
                <th className="py-2 px-3 font-semibold text-start">
                  {isAr ? "الحالة" : "Status"}
                </th>
                <th className="py-2 px-3 font-semibold text-start">
                  {isAr ? "التكلفة الكلية" : "Unit Cost"}
                </th>
                <th className="py-2 px-3 font-semibold text-start">
                  {isAr ? "سعر البيع" : "Selling Price"}
                </th>
                <th className="py-2 ps-3 font-semibold text-start">
                  {isAr ? "الهامش" : "Margin"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
              {filteredInventory.slice(0, 30).map((it) => {
                const margin =
                  it.selling_price !== null && it.total_unit_cost !== null
                    ? Number(it.selling_price) - Number(it.total_unit_cost)
                    : null;
                return (
                  <tr key={it.item_serial_id}>
                    <td className="py-2.5 pe-3">
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {isAr && it.title_ar ? it.title_ar : it.title}
                      </p>
                      <p dir="ltr" className="font-mono text-[11px] text-neutral-500 text-start">
                        {it.barcode ?? it.item_serial_id.slice(0, 8)}
                        {it.condition_grade ? ` • Grade ${it.condition_grade}` : ""}
                        {it.data_wiped_bool ? " • NIST Wiped" : ""}
                      </p>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[11px] font-medium">
                        {it.current_status}
                      </span>
                      {it.aging_tier && (
                        <span
                          dir="ltr"
                          className="ms-1.5 font-mono text-[10px] text-neutral-500"
                        >
                          ({it.aging_tier})
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums">
                      <span dir="ltr">
                        {it.total_unit_cost !== null
                          ? `${Number(it.total_unit_cost).toLocaleString()} EGP`
                          : "—"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums">
                      <span dir="ltr">
                        {it.selling_price !== null
                          ? `${Number(it.selling_price).toLocaleString()} EGP`
                          : "—"}
                      </span>
                    </td>
                    <td className="py-2.5 ps-3 font-mono tabular-nums font-semibold">
                      <span
                        dir="ltr"
                        className={
                          margin === null
                            ? "text-neutral-400"
                            : margin >= 0
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                        }
                      >
                        {margin !== null
                          ? `${margin >= 0 ? "+" : ""}${margin.toLocaleString()} EGP`
                          : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Immutable Item Lifecycle Audit Log */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {isAr
                ? `سجل التدقيق غير القابل للتعديل (أحدث ${filteredAudit.length} انتقال)`
                : `Immutable Lifecycle Audit Log (Latest ${filteredAudit.length})`}
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
              {isAr
                ? "توثيق آلي لكل انتقال حالة على مستوى القطعة التسلسلية مع الطابع الزمني والمستخدم المسؤول."
                : "Append-only database trail recording every serialized item state transition, timestamp, and actor."}
            </p>
          </div>
          <input
            type="search"
            value={auditSearch}
            onChange={(e) => setAuditSearch(e.target.value)}
            placeholder={
              isAr ? "بحث في سجل التدقيق..." : "Filter by barcode, state, actor..."
            }
            className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-1.5 text-xs w-56"
          />
        </div>

        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 bg-white dark:bg-neutral-900">
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500">
                <th className="py-2 pe-3 font-semibold text-start">
                  {isAr ? "التوقيت" : "Timestamp"}
                </th>
                <th className="py-2 px-3 font-semibold text-start">
                  {isAr ? "القطعة" : "Serialized Unit"}
                </th>
                <th className="py-2 px-3 font-semibold text-start">
                  {isAr ? "الانتقال" : "State Transition"}
                </th>
                <th className="py-2 ps-3 font-semibold text-start">
                  {isAr ? "المسؤول" : "Actor"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
              {filteredAudit.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-neutral-500"
                  >
                    {isAr
                      ? "لا توجد سجلات تدقيق مطابقة."
                      : "No matching audit entries found."}
                  </td>
                </tr>
              ) : (
                filteredAudit.map((entry) => (
                  <tr key={entry.history_id}>
                    <td className="py-2.5 pe-3 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                      <span dir="ltr">
                        {new Date(entry.changed_at).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        {entry.item_title ?? entry.item_serial_id.slice(0, 8)}
                      </p>
                      {entry.item_barcode && (
                        <p dir="ltr" className="font-mono text-[11px] text-neutral-500 text-start">
                          {entry.item_barcode}
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div
                        dir="ltr"
                        className="inline-flex flex-wrap items-center gap-1.5 font-mono text-[11px]"
                      >
                        <span className="rounded bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 text-neutral-600 dark:text-neutral-400">
                          {entry.from_status ?? "NEW"}
                        </span>
                        <span>→</span>
                        <span className="rounded bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 text-emerald-800 dark:text-emerald-300 font-semibold">
                          {entry.to_status}
                        </span>
                      </div>
                      {entry.note && (
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {entry.note}
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 ps-3 text-neutral-700 dark:text-neutral-300">
                      {entry.actor_name ?? (isAr ? "النظام" : "System")}
                      {entry.actor_role ? (
                        <span className="block text-[11px] text-neutral-500">
                          {entry.actor_role}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

