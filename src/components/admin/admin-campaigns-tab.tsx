"use client";

import { useMemo, useState } from "react";
import type { CustomerSegment } from "@/types/domain";
import type { AdminCampaignLogRow, AdminCustomerRow } from "./admin-types";

interface AdminCampaignsTabProps {
  isAr: boolean;
  isAdmin: boolean;
  isPending: boolean;
  customers: AdminCustomerRow[];
  campaignLogs: AdminCampaignLogRow[];
  onDispatchCampaign: (payload: {
    segment: CustomerSegment;
    channel: "sms" | "email";
    message: string;
    promoCode?: string;
  }) => Promise<void>;
  onUpdateSegment: (userId: string, segment: CustomerSegment) => Promise<void>;
}

const SEGMENTS: CustomerSegment[] = ["Individual", "Startup", "Enterprise"];

export function AdminCampaignsTab({
  isAr,
  isAdmin,
  isPending,
  customers,
  campaignLogs,
  onDispatchCampaign,
  onUpdateSegment,
}: AdminCampaignsTabProps) {
  const [segment, setSegment] = useState<CustomerSegment>("Startup");
  const [campaignChannel, setCampaignChannel] = useState<"sms" | "email">(
    "email",
  );
  const [promoCode, setPromoCode] = useState("GREENB2B15");
  const [campaignMsg, setCampaignMsg] = useState(
    "Exclusive 15% B2B Green Office Refurbished Bundle for Startups & SMEs!",
  );

  // Customer Directory Filter State
  const [directorySegment, setDirectorySegment] = useState<
    "All" | CustomerSegment
  >("All");
  const [searchQuery, setSearchQuery] = useState("");

  const segmentCounts = useMemo(() => {
    const counts: Record<CustomerSegment, number> = {
      Individual: 0,
      Startup: 0,
      Enterprise: 0,
    };
    for (const c of customers) {
      if (counts[c.segment] !== undefined) {
        counts[c.segment] += 1;
      }
    }
    return counts;
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return customers.filter((c) => {
      if (directorySegment !== "All" && c.segment !== directorySegment) {
        return false;
      }
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.tax_id ?? "").toLowerCase().includes(q)
      );
    });
  }, [customers, directorySegment, searchQuery]);

  const targetCount = segmentCounts[segment] ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onDispatchCampaign({
      segment,
      channel: campaignChannel,
      message: campaignMsg,
      promoCode,
    });
  };

  return (
    <div className="space-y-6">
      {/* Segment Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SEGMENTS.map((seg) => {
          const isTarget = segment === seg;
          const label =
            seg === "Individual"
              ? isAr
                ? "الأفراد (Individual)"
                : "Individual Buyers & Sellers"
              : seg === "Startup"
                ? isAr
                  ? "الشركات الناشئة والصغيرة (Startup / SME)"
                  : "Startup / Small Office (SME)"
                : isAr
                  ? "المؤسسات الكبرى (Enterprise)"
                  : "Large Enterprise";

          return (
            <button
              key={seg}
              type="button"
              onClick={() => {
                setSegment(seg);
                setDirectorySegment(seg);
              }}
              className={`rounded-xl border p-4 text-start transition cursor-pointer ${
                isTarget
                  ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30"
                  : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700"
              }`}
            >
              <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                {label}
              </p>
              <p
                dir="ltr"
                className="text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-1 text-start"
              >
                {segmentCounts[seg]}
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                {isAr
                  ? "انقر لتحديد الشريحة وتصفية العملاء"
                  : "Click to target & filter directory"}
              </p>
            </button>
          );
        })}
      </div>

      {/* Campaign Composer + Recent Dispatch History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4"
        >
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {isAr
                ? "الحملات الترويجية الموجهة حسب شرائح العملاء"
                : "Customer Segmentation & Promotional Campaigns"}
            </h2>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
              {isAr
                ? `المستلمون المطابقون حالياً لشريحة ${segment}: ${targetCount} عميل`
                : `Matched recipients in "${segment}" segment: ${targetCount} customer(s)`}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="cmp-seg"
                className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
              >
                {isAr ? "شريحة العملاء المستهدفة" : "Target Customer Segment"}
              </label>
              <select
                id="cmp-seg"
                disabled={!isAdmin}
                value={segment}
                onChange={(e) => setSegment(e.target.value as CustomerSegment)}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs"
              >
                <option value="Individual">
                  {isAr ? "أفراد (Individual)" : "Individual"}
                </option>
                <option value="Startup">
                  {isAr ? "شركات ناشئة (Startup / SME)" : "Startup / SME"}
                </option>
                <option value="Enterprise">
                  {isAr ? "مؤسسات كبرى (Enterprise)" : "Enterprise"}
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="cmp-chan"
                className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
              >
                {isAr ? "قناة الإرسال" : "Notification Channel"}
              </label>
              <select
                id="cmp-chan"
                disabled={!isAdmin}
                value={campaignChannel}
                onChange={(e) =>
                  setCampaignChannel(e.target.value as "sms" | "email")
                }
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs"
              >
                <option value="email">{isAr ? "بريد إلكتروني (Email)" : "Email"}</option>
                <option value="sms">{isAr ? "رسالة نصية (SMS)" : "SMS"}</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="cmp-code"
                className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
              >
                {isAr ? "كود الخصم (اختياري)" : "Promo Code (Optional)"}
              </label>
              <input
                id="cmp-code"
                type="text"
                dir="ltr"
                disabled={!isAdmin}
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="GREEN15"
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-xs font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="cmp-msg"
              className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              {isAr ? "نص العرض الترويجي" : "Promotional Offer Message"}
            </label>
            <textarea
              id="cmp-msg"
              rows={3}
              required
              disabled={!isAdmin}
              value={campaignMsg}
              onChange={(e) => setCampaignMsg(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent p-3 text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || !isAdmin}
            className="rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white transition cursor-pointer"
          >
            {isAr ? "إرسال الحملة الترويجية الموجهة" : "Dispatch Targeted Campaign"}
          </button>
        </form>

        {/* Recent Dispatched Campaigns History */}
        <div className="lg:col-span-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-3">
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            {isAr
              ? `سجل الحملات المرسلة مؤخراً (${campaignLogs.length})`
              : `Recent Campaign Dispatches (${campaignLogs.length})`}
          </h3>
          {campaignLogs.length === 0 ? (
            <p className="text-xs text-neutral-500 py-8 text-center">
              {isAr
                ? "لم يتم إرسال أي حملات ترويجية بعد."
                : "No promotional campaigns have been dispatched yet."}
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pe-1">
              {campaignLogs.map((log) => (
                <div
                  key={log.notification_id}
                  className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 text-xs space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-neutral-600 dark:text-neutral-400">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {log.recipient_name ?? (isAr ? "عميل" : "Customer")}
                      {log.recipient_segment ? ` • ${log.recipient_segment}` : ""}
                    </span>
                    <span dir="ltr" className="font-mono text-[11px] uppercase">
                      {log.channel} •{" "}
                      {new Date(log.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {log.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filterable Registered Customers Directory */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            {isAr
              ? `دليل العملاء المسجلين (${filteredCustomers.length})`
              : `Registered Customer Directory (${filteredCustomers.length})`}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {(["All", "Individual", "Startup", "Enterprise"] as const).map(
              (seg) => (
                <button
                  key={seg}
                  type="button"
                  onClick={() => setDirectorySegment(seg)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                    directorySegment === seg
                      ? "bg-emerald-700 text-white"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  {seg === "All" ? (isAr ? "الكل" : "All") : seg}
                </button>
              ),
            )}
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isAr ? "بحث بالاسم أو البريد..." : "Search name, email, Tax ID..."
              }
              className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-1.5 text-xs w-48"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 text-start">
                <th className="py-2.5 pe-3 font-semibold text-start">
                  {isAr ? "العميل" : "Customer"}
                </th>
                <th className="py-2.5 px-3 font-semibold text-start">
                  {isAr ? "النوع" : "Account"}
                </th>
                <th className="py-2.5 px-3 font-semibold text-start">
                  {isAr ? "البطاقة الضريبية" : "Tax ID / CR"}
                </th>
                <th className="py-2.5 ps-3 font-semibold text-start">
                  {isAr ? "الشريحة التسويقية" : "Segment"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-neutral-500"
                  >
                    {isAr
                      ? "لا يوجد عملاء مطابقون لمعايير التصفية."
                      : "No customers match the active filters."}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.user_id}>
                    <td className="py-3 pe-3">
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {c.name}
                      </p>
                      <p dir="ltr" className="font-mono text-[11px] text-neutral-500 text-start">
                        {c.email}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[11px] font-medium">
                        {c.account_type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                      <span dir="ltr">
                        {c.tax_id ? `${c.tax_id} / ${c.commercial_reg ?? "—"}` : "—"}
                      </span>
                    </td>
                    <td className="py-3 ps-3">
                      <select
                        aria-label={`Segment for ${c.name}`}
                        disabled={!isAdmin || isPending}
                        value={c.segment}
                        onChange={(e) =>
                          onUpdateSegment(
                            c.user_id,
                            e.target.value as CustomerSegment,
                          )
                        }
                        className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-xs"
                      >
                        <option value="Individual">Individual</option>
                        <option value="Startup">Startup</option>
                        <option value="Enterprise">Enterprise</option>
                      </select>
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

