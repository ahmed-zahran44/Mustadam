"use client";

import { useLocale } from "next-intl";
import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  approveCorporateQuoteAction,
  createOrUpdateCategoryAction,
  dispatchSegmentCampaignAction,
  resolveWarrantyClaimAction,
} from "@/lib/domain/admin-actions";
import type { CategoryRow, CustomerSegment } from "@/types/domain";

interface AdminKpiStats {
  totalStoreSalesRevenue: number;
  totalRecyclingRevenue: number;
  avgProfitMarginEgp: number;
  sellerOfferAcceptanceRatePct: number;
  aging0to30Count: number;
  aging31to60Count: number;
  aging61to90Count: number;
  decommissionedAgedCount: number;
  totalLandfillDivertedKg: number;
  totalAuditLogEntries: number;
}

interface AdminQuoteRow {
  quote_id: string;
  buyer_id: string;
  status: string;
  discount_pct: number;
  valid_until: string | null;
  created_at: string;
}

interface AdminClaimRow {
  claim_id: string;
  order_item_id: string;
  description: string;
  status: string;
  resolution_note: string | null;
  created_at: string;
}

interface AdminPortalClientProps {
  activeRole: string;
  kpis: AdminKpiStats;
  categories: CategoryRow[];
  quotes: AdminQuoteRow[];
  claims: AdminClaimRow[];
}

export function AdminPortalClient({
  activeRole,
  kpis,
  categories,
  quotes,
  claims,
}: AdminPortalClientProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<
    "kpis" | "categories" | "campaigns" | "quotes" | "warranty"
  >("kpis");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Category Form State
  const [catName, setCatName] = useState("");
  const [catNameAr, setCatNameAr] = useState("");
  const [catBasePrice, setCatBasePrice] = useState(6000);
  const [catWarrantyDays, setCatWarrantyDays] = useState(60);
  const [catBulky, setCatBulky] = useState(false);
  const [catWipe, setCatWipe] = useState(false);
  const [catJson, setCatJson] = useState(
    '[{"id":"power","question_en":"Powers on normally?","question_ar":"هل يعمل الجهاز بشكل طبيعي؟","type":"boolean","deduction_pct":0.25}]',
  );

  // Campaign State
  const [segment, setSegment] = useState<CustomerSegment>("Startup");
  const [campaignChannel, setCampaignChannel] = useState<"sms" | "email">(
    "email",
  );
  const [campaignMsg, setCampaignMsg] = useState(
    "Exclusive 15% B2B Green Office Refurbished Bundle for Startups & SMEs!",
  );

  // Quote & Warranty State
  const [discountInput, setDiscountInput] = useState(12);
  const [resolutionText, setResolutionText] = useState(
    "Approved free replacement battery under 90-day Mustadama warranty.",
  );

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      try {
        const parsed = JSON.parse(catJson);
        const res = await createOrUpdateCategoryAction({
          name: catName,
          nameAr: catNameAr,
          baseReferencePrice: catBasePrice,
          warrantyDays: catWarrantyDays,
          isBulky: catBulky,
          requiresDataWipe: catWipe,
          diagnosticQuestionsJson: parsed,
        });
        if (!res.ok) {
          setError(res.error ?? "Failed");
          return;
        }
        setFeedback(
          isAr
            ? `تم نشر فئة "${catName}" واستبيان الفحص الفني بنجاح!`
            : `Category "${catName}" and diagnostic assessment schema published successfully!`,
        );
        setCatName("");
        setCatNameAr("");
        router.refresh();
      } catch {
        setError("Invalid JSON format in diagnostic questions.");
      }
    });
  };

  const handleDispatchCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      const res = await dispatchSegmentCampaignAction({
        segment,
        channel: campaignChannel,
        message: campaignMsg,
      });
      if (!res.ok) {
        setError(res.error ?? "Failed");
        return;
      }
      setFeedback(
        isAr
          ? `تم إرسال الحملة الترويجية بنجاح إلى ${res.sentCount} من عملاء شريحة "${segment}" عبر ${campaignChannel.toUpperCase()}.`
          : `Targeted campaign dispatched to ${res.sentCount} "${segment}" recipients via ${campaignChannel.toUpperCase()}.`,
      );
      router.refresh();
    });
  };

  const handleApproveQuote = (quoteId: string) => {
    startTransition(async () => {
      const res = await approveCorporateQuoteAction({
        quoteId,
        discountPct: discountInput,
      });
      if (res.ok) {
        setFeedback(
          `Quote ${quoteId.slice(0, 8)} approved with ${discountInput}% B2B discount!`,
        );
        router.refresh();
      }
    });
  };

  const handleResolveClaim = (
    claimId: string,
    status: "resolved" | "rejected",
  ) => {
    startTransition(async () => {
      const res = await resolveWarrantyClaimAction({
        claimId,
        status,
        resolutionNote: resolutionText,
      });
      if (res.ok) {
        setFeedback(`Warranty claim ${claimId.slice(0, 8)} marked ${status}.`);
        router.refresh();
      }
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-700">
            {isAr
              ? "لوحة تحكم الإدارة ومؤشرات الأداء والاستدامة"
              : "Admin Control Center & Sustainability Dashboard"}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Active Role: <strong className="text-emerald-700">{activeRole}</strong>
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "kpis", label: isAr ? "١. مؤشرات الأداء والاستدامة" : "1. Platform KPIs & Sustainability" },
            { id: "categories", label: isAr ? "٢. إدارة الفئات والاستبيانات الفنية" : "2. Categories & Diagnostic Schemas" },
            { id: "campaigns", label: isAr ? "٣. شرائح العملاء والحملات الترويجية" : "3. Customer Segments & Campaigns" },
            { id: "quotes", label: isAr ? `٤. عروض الشركات (${quotes.length})` : `4. B2B Quotes (${quotes.length})` },
            { id: "warranty", label: isAr ? `٥. مطالبات الضمان (${claims.length})` : `5. Warranty Claims (${claims.length})` },
          ].map((tItem) => (
            <button
              key={tItem.id}
              type="button"
              onClick={() =>
                setTab(
                  tItem.id as
                    | "kpis"
                    | "categories"
                    | "campaigns"
                    | "quotes"
                    | "warranty",
                )
              }
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                tab === tItem.id
                  ? "bg-emerald-700 text-white"
                  : "bg-neutral-100 dark:bg-neutral-800"
              }`}
            >
              {tItem.label}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-400 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
          {feedback}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-400 px-4 py-3 text-sm text-rose-800 dark:text-rose-200">
          {error}
        </div>
      )}

      {/* 1. REAL-TIME MIS & SUSTAINABILITY DASHBOARD */}
      {tab === "kpis" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-1">
              <p className="text-xs font-semibold text-neutral-500 uppercase">
                {isAr
                  ? "إجمالي إيرادات المبيعات والتدوير"
                  : "Total Circular Revenue (Sales + Scrap)"}
              </p>
              <p
                dir="ltr"
                className="text-2xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400"
              >
                {(
                  kpis.totalStoreSalesRevenue + kpis.totalRecyclingRevenue
                ).toLocaleString()}{" "}
                EGP
              </p>
              <p className="text-[11px] text-neutral-500">
                Store: {kpis.totalStoreSalesRevenue.toLocaleString()} EGP •
                Recycling: {kpis.totalRecyclingRevenue.toLocaleString()} EGP
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-1">
              <p className="text-xs font-semibold text-neutral-500 uppercase">
                {isAr
                  ? "متوسط هامش الربح للقطعة"
                  : "Avg Profit Margin / Unit"}
              </p>
              <p
                dir="ltr"
                className="text-2xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400"
              >
                {kpis.avgProfitMarginEgp.toLocaleString()} EGP
              </p>
              <p className="text-[11px] text-neutral-500">
                After Purchase + Batch Logistics + Refurb/Parts Cost
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-1">
              <p className="text-xs font-semibold text-neutral-500 uppercase">
                {isAr
                  ? "نسبة قبول عروض البائعين"
                  : "Seller Offer Acceptance Rate"}
              </p>
              <p
                dir="ltr"
                className="text-2xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400"
              >
                {kpis.sellerOfferAcceptanceRatePct}%
              </p>
              <p className="text-[11px] text-neutral-500">
                7-Day (168h) Decision Window Tracking
              </p>
            </div>

            <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 p-5 space-y-1">
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                {isAr
                  ? "الأثر البيئي: النفايات المنقذة من المكبات"
                  : "Environmental Impact: Landfill Diversion"}
              </p>
              <p
                dir="ltr"
                className="text-2xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400"
              >
                {kpis.totalLandfillDivertedKg.toLocaleString()} kg
              </p>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                E-Waste & Furniture Diverted from Landfills
              </p>
            </div>
          </div>

          {/* Inventory Aging Breakdown */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">
                {isAr
                  ? "توزيع تقادم المخزون ودورة التسعير التدريجي"
                  : "Inventory Aging & Lifecycle Breakdown"}
              </h2>
              <span className="text-xs text-neutral-500 font-mono">
                {isAr ? "سجلات تدقيق دورة الحياة:" : "Lifecycle Audit Log Entries:"}{" "}
                <strong>{kpis.totalAuditLogEntries}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-4 border border-emerald-200 dark:border-emerald-900">
                <p className="text-xs font-semibold">0–30 Days (Standard Price)</p>
                <p className="text-2xl font-bold font-mono mt-1">
                  {kpis.aging0to30Count}
                </p>
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 p-4 border border-amber-200 dark:border-amber-900">
                <p className="text-xs font-semibold">
                  31–60 Days (-20% Markdown)
                </p>
                <p className="text-2xl font-bold font-mono mt-1">
                  {kpis.aging31to60Count}
                </p>
              </div>
              <div className="rounded-lg bg-orange-50 dark:bg-orange-950/40 p-4 border border-orange-200 dark:border-orange-900">
                <p className="text-xs font-semibold">
                  61–90 Days (At Unit Cost)
                </p>
                <p className="text-2xl font-bold font-mono mt-1">
                  {kpis.aging61to90Count}
                </p>
              </div>
              <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-4 border border-rose-200 dark:border-rose-900">
                <p className="text-xs font-semibold">
                  91+ Days (Decommissioned_Aged)
                </p>
                <p className="text-2xl font-bold font-mono mt-1">
                  {kpis.decommissionedAgedCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. DYNAMIC CATEGORIES & DIAGNOSTIC SCHEMA */}
      {tab === "categories" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleAddCategory}
            className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4"
          >
            <h2 className="text-base font-bold">
              {isAr
                ? "إضافة فئة جديدة واستبيان تشخيصي"
                : "Add Category & Diagnostic Schema"}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Category Name (EN)"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-xs"
              />
              <input
                type="text"
                required
                placeholder="اسم الفئة (AR)"
                value={catNameAr}
                onChange={(e) => setCatNameAr(e.target.value)}
                className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="cat-base"
                  className="block text-xs font-medium mb-1"
                >
                  Base Reference Price (EGP)
                </label>
                <input
                  id="cat-base"
                  type="number"
                  dir="ltr"
                  value={catBasePrice}
                  onChange={(e) => setCatBasePrice(Number(e.target.value))}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-xs font-mono"
                />
              </div>
              <div>
                <label
                  htmlFor="cat-war"
                  className="block text-xs font-medium mb-1"
                >
                  {isAr ? "فترة الضمان القياسية (أيام)" : "Standard Warranty (Days)"}
                </label>
                <input
                  id="cat-war"
                  type="number"
                  dir="ltr"
                  value={catWarrantyDays}
                  onChange={(e) => setCatWarrantyDays(Number(e.target.value))}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-xs font-mono"
                />
              </div>
            </div>
            <div className="flex gap-4 text-xs">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={catBulky}
                  onChange={(e) => setCatBulky(e.target.checked)}
                />
                Bulky Furniture (Batch Truck)
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={catWipe}
                  onChange={(e) => setCatWipe(e.target.checked)}
                />
                {isAr ? "تتطلب مسح البيانات المعتمد (NIST 800-88)" : "Requires NIST 800-88 Data Sanitization"}
              </label>
            </div>
            <div>
              <label
                htmlFor="cat-json"
                className="block text-xs font-medium mb-1"
              >
                Diagnostic Questions JSON Schema
              </label>
              <textarea
                id="cat-json"
                rows={3}
                dir="ltr"
                value={catJson}
                onChange={(e) => setCatJson(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent p-2.5 text-xs font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-emerald-700 hover:bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
            >
              Save Dynamic Category
            </button>
          </form>

          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-3">
            <h2 className="text-base font-bold">
              Active Categories ({categories.length})
            </h2>
            {categories.map((c) => (
              <div
                key={c.category_id}
                className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 text-xs space-y-1"
              >
                <div className="flex justify-between font-semibold">
                  <span>
                    {c.name} / {c.name_ar}
                  </span>
                  <span dir="ltr" className="font-mono text-emerald-700">
                    {Number(c.base_reference_price).toLocaleString()} EGP
                  </span>
                </div>
                <p className="text-neutral-500">
                  Warranty: {c.warranty_days}d • Bulky:{" "}
                  {c.is_bulky ? "Yes" : "No"} • NIST Wipe:{" "}
                  {c.requires_data_wipe ? "Mandatory" : "No"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. CUSTOMER SEGMENTATION & CAMPAIGNS */}
      {tab === "campaigns" && (
        <form
          onSubmit={handleDispatchCampaign}
          className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4 max-w-xl"
        >
          <h2 className="text-base font-bold">
            {isAr
              ? "الحملات الترويجية الموجهة حسب شرائح العملاء"
              : "Customer Segmentation & Promotional Campaigns"}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="cmp-seg"
                className="block text-xs font-medium mb-1"
              >
                Target Customer Segment
              </label>
              <select
                id="cmp-seg"
                value={segment}
                onChange={(e) => setSegment(e.target.value as CustomerSegment)}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs"
              >
                <option value="Individual">Individual</option>
                <option value="Startup">Startup / SME</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="cmp-chan"
                className="block text-xs font-medium mb-1"
              >
                Notification Channel
              </label>
              <select
                id="cmp-chan"
                value={campaignChannel}
                onChange={(e) =>
                  setCampaignChannel(e.target.value as "sms" | "email")
                }
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="cmp-msg" className="block text-xs font-medium mb-1">
              Promotional Offer Message
            </label>
            <textarea
              id="cmp-msg"
              rows={3}
              required
              value={campaignMsg}
              onChange={(e) => setCampaignMsg(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent p-3 text-xs"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-emerald-700 hover:bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
          >
            Dispatch Targeted Campaign
          </button>
        </form>
      )}

      {/* 4. CORPORATE B2B QUOTES APPROVAL */}
      {tab === "quotes" && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">
              {isAr
                ? "مراجعة واعتماد عروض الأسعار للشركات"
                : "Corporate Bulk Quote Approval"}
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span>B2B Discount %:</span>
              <input
                type="number"
                dir="ltr"
                value={discountInput}
                onChange={(e) => setDiscountInput(Number(e.target.value))}
                className="w-20 rounded border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 py-1 font-mono"
              />
            </div>
          </div>
          {quotes.map((q) => (
            <div
              key={q.quote_id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 text-xs"
            >
              <div>
                <p className="font-mono font-semibold">
                  Quote #{q.quote_id.slice(0, 8)} • Status: {q.status}
                </p>
                <p className="text-neutral-500">
                  Discount: {q.discount_pct}% • Valid Until:{" "}
                  {q.valid_until ?? "Pending"}
                </p>
              </div>
              {q.status === "requested" && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleApproveQuote(q.quote_id)}
                  className="rounded bg-emerald-700 text-white px-3.5 py-1.5 font-semibold"
                >
                  Approve Quote (Valid 7 Days)
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 5. WARRANTY CLAIMS RESOLUTION */}
      {tab === "warranty" && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
          <h2 className="text-base font-bold">
            {isAr
              ? "قائمة مطالبات الضمان وخدمة العملاء"
              : "Customer Service Warranty Claims Queue"}
          </h2>
          <input
            type="text"
            value={resolutionText}
            onChange={(e) => setResolutionText(e.target.value)}
            placeholder="Resolution note..."
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-xs"
          />
          {claims.map((c) => (
            <div
              key={c.claim_id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 text-xs"
            >
              <div>
                <p className="font-semibold">
                  Claim #{c.claim_id.slice(0, 8)} • Status:{" "}
                  <strong className="uppercase">{c.status}</strong>
                </p>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {c.description}
                </p>
                {c.resolution_note && (
                  <p className="text-emerald-700 dark:text-emerald-400">
                    Resolution: {c.resolution_note}
                  </p>
                )}
              </div>
              {c.status === "open" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleResolveClaim(c.claim_id, "resolved")}
                    className="rounded bg-emerald-700 text-white px-3 py-1.5 font-semibold"
                  >
                    Approve & Resolve
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleResolveClaim(c.claim_id, "rejected")}
                    className="rounded bg-rose-700 text-white px-3 py-1.5 font-semibold"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

