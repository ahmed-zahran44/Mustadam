"use client";

import { useLocale } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { calculateEstimatedPriceRange } from "@/lib/domain/pricing-engine";
import {
  payReturnFeeAction,
  respondToSellerOfferAction,
  submitCorporateBulkLiquidationAction,
  submitSingleItemRequestAction,
} from "@/lib/domain/seller-actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { compressImageFile } from "@/lib/utils/image-compression";
import type { CategoryRow, DiagnosticQuestion } from "@/types/domain";

interface SellerHubRow {
  hub_id: string;
  name: string;
  name_ar: string;
  city: string;
  zone: string;
}

interface SellerItemRecord {
  item_serial_id: string;
  title: string;
  title_ar: string | null;
  barcode: string | null;
  current_status: string;
  estimated_min_price: number;
  estimated_max_price: number;
  final_purchase_price: number | null;
  seller_decision: string | null;
  offer_expires_at: string | null;
  data_wiped_bool: boolean;
  created_at: string;
}

interface ReturnTaskRecord {
  return_id: string;
  item_serial_id: string;
  fee_amount: number;
  fee_status: string;
  status: string;
}

interface SellerPortalClientProps {
  accountType: string;
  categories: CategoryRow[];
  dropoffHubs: SellerHubRow[];
  myItems: SellerItemRecord[];
  returnTasks: ReturnTaskRecord[];
}

export function SellerPortalClient({
  accountType,
  categories,
  dropoffHubs,
  myItems,
  returnTasks,
}: SellerPortalClientProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"single" | "bulk" | "myItems">(
    "single",
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Single Item Form State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories[0]?.category_id ?? "",
  );
  const [title, setTitle] = useState("");
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [photoUrls, setPhotoUrls] = useState<string[]>([
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
  ]);
  const [handoverMethod, setHandoverMethod] = useState<
    "Courier" | "Partner_Dropoff"
  >("Courier");
  const [dropoffHubId, setDropoffHubId] = useState<string>(
    dropoffHubs[0]?.hub_id ?? "",
  );
  const [pickupAddress, setPickupAddress] = useState("14 Abbas El Akkad, Cairo");
  const [pickupSlot, setPickupSlot] = useState("10:00 AM - 02:00 PM");

  // Corporate Bulk State
  const [bulkAddress, setBulkAddress] = useState(
    "Smart Village, Building B4, Giza",
  );
  const [bulkManifestText, setBulkManifestText] = useState(
    `${categories[0]?.category_id ?? ""},Dell Latitude 7400 (i7 16GB),2.1\n${categories[2]?.category_id ?? ""},Executive Ergonomic Desk Chair,22.0`,
  );

  const selectedCategory = useMemo(
    () => categories.find((c) => c.category_id === selectedCategoryId),
    [categories, selectedCategoryId],
  );

  const questions = useMemo(() => {
    return ((selectedCategory?.diagnostic_questions_json ??
      []) as unknown) as DiagnosticQuestion[];
  }, [selectedCategory]);

  const liveEstimate = useMemo(() => {
    if (!selectedCategory) return null;
    return calculateEstimatedPriceRange({
      baseReferencePrice: Number(selectedCategory.base_reference_price),
      questions,
      answers,
    });
  }, [selectedCategory, questions, answers]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const supabase = createSupabaseBrowserClient();
    const uploaded: string[] = [];

    for (const file of files.slice(0, 5)) {
      const compressed = await compressImageFile(file);
      const path = `seller/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const { data } = await supabase.storage
        .from("item-photos")
        .upload(path, compressed, { contentType: "image/jpeg" });
      if (data?.path) {
        const { data: pub } = supabase.storage
          .from("item-photos")
          .getPublicUrl(data.path);
        uploaded.push(pub.publicUrl);
      }
    }

    if (uploaded.length) {
      setPhotoUrls((prev) => [...prev, ...uploaded].slice(0, 5));
    }
  };

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      const res = await submitSingleItemRequestAction({
        categoryId: selectedCategoryId,
        title,
        answers,
        photoUrls,
        handoverMethod: selectedCategory?.is_bulky
          ? "Batch_Truck"
          : handoverMethod,
        dropoffPartnerId: dropoffHubId,
        pickupAddress,
        pickupSlot,
      });

      if (!res.ok) {
        setError(res.error ?? "Submission failed");
        return;
      }

      setFeedback(
        isAr
          ? `تم تسجيل الطلب بنجاح (${res.trackingCode})! النطاق التقديري: ${res.estimatedMinPrice} - ${res.estimatedMaxPrice} ج.م`
          : `Request submitted (${res.trackingCode})! Estimated range: ${res.estimatedMinPrice} - ${res.estimatedMaxPrice} EGP`,
      );
      setTitle("");
      router.refresh();
    });
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    const lines = bulkManifestText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const items = lines.map((line) => {
      const [catId, itemTitle, weight] = line.split(",");
      return {
        categoryId: (catId?.trim() || categories[0]?.category_id) ?? "",
        title: itemTitle?.trim() || "Corporate Asset",
        weightKg: weight ? Number(weight) : 3,
      };
    });

    startTransition(async () => {
      const res = await submitCorporateBulkLiquidationAction({
        pickupAddress: bulkAddress,
        items,
      });
      if (!res.ok) {
        setError(res.error ?? "Bulk submission failed");
        return;
      }
      setFeedback(
        isAr
          ? `تم تسجيل دفعة تصفية الشركات (${res.trackingCode}) لعدد ${res.count} قطعة!`
          : `Corporate bulk liquidation (${res.trackingCode}) submitted for ${res.count} items!`,
      );
      router.refresh();
    });
  };

  const handleOfferDecision = (
    itemSerialId: string,
    decision: "accept" | "reject",
  ) => {
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      const res = await respondToSellerOfferAction({ itemSerialId, decision });
      if (!res.ok) {
        setError(res.error ?? "Action failed");
        return;
      }
      setFeedback(
        decision === "accept"
          ? `Offer accepted! Payout reference: ${res.payoutRef}`
          : `Offer rejected. Return fee (${res.feeAmount} EGP) generated.`,
      );
      router.refresh();
    });
  };

  const handlePayReturnFee = (returnId: string) => {
    startTransition(async () => {
      const res = await payReturnFeeAction(returnId);
      if (res.ok) {
        setFeedback(`Return fee paid (${res.paymentRef}). Ready for dispatch!`);
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
              ? "بوابة البائع والتسعير الذكي"
              : "Seller Portal & Smart Valuation"}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {isAr
              ? "تقديم طلبات البيع الفردية وتصفية الشركات، اختيار طريقة التسليم، والبت في العروض النهائية خلال ٧ أيام (١٦٨ ساعة)."
              : "Submit single items or corporate bulk liquidations, choose handover method, and decide on final inspection offers within 7 days (168 hours)."}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("single")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "single"
                ? "bg-emerald-700 text-white"
                : "bg-neutral-100 dark:bg-neutral-800"
            }`}
          >
            {isAr ? "تقييم وبيع قطعة" : "Sell Single Item"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bulk")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "bulk"
                ? "bg-emerald-700 text-white"
                : "bg-neutral-100 dark:bg-neutral-800"
            }`}
          >
            {isAr ? "تصفية شركات بالجملة" : "Corporate Bulk Liquidation"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("myItems")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "myItems"
                ? "bg-emerald-700 text-white"
                : "bg-neutral-100 dark:bg-neutral-800"
            }`}
          >
            {isAr
              ? `مقتنياتي وعروض الشراء (${myItems.length})`
              : `My Items & Offers (${myItems.length})`}
          </button>
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

      {/* TAB 1: SINGLE ITEM DIAGNOSTIC & HANDOVER */}
      {activeTab === "single" && (
        <form
          onSubmit={handleSingleSubmit}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <div className="lg:col-span-2 space-y-5 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 bg-white dark:bg-neutral-900">
            <h2 className="text-lg font-semibold">
              {isAr
                ? "١. بيانات القطعة والاستبيان الفني"
                : "1. Item Details & Diagnostic Assessment"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="seller-cat"
                  className="block text-sm font-medium mb-1"
                >
                  {isAr ? "الفئة" : "Category"}
                </label>
                <select
                  id="seller-cat"
                  value={selectedCategoryId}
                  onChange={(e) => {
                    setSelectedCategoryId(e.target.value);
                    setAnswers({});
                  }}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
                >
                  {categories.map((c) => (
                    <option key={c.category_id} value={c.category_id}>
                      {isAr ? c.name_ar : c.name} (
                      {Number(c.base_reference_price).toLocaleString()} EGP)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="seller-title"
                  className="block text-sm font-medium mb-1"
                >
                  {isAr ? "اسم/موديل القطعة" : "Item Title / Model"}
                </label>
                <input
                  id="seller-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. MacBook Pro 14 M1 / Herman Miller Aeron"
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Dynamic JSON Questions */}
            <div className="space-y-3 rounded-lg bg-neutral-50 dark:bg-neutral-950 p-4 border border-neutral-200 dark:border-neutral-800">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                {isAr
                  ? "الأسئلة التشخيصية الخاصة بالفئة"
                  : "Category Diagnostic Questions"}
              </p>
              {questions.map((q) => {
                const checked = answers[q.id] === true;
                return (
                  <label
                    key={q.id}
                    className="flex items-center justify-between gap-3 rounded-md bg-white dark:bg-neutral-900 px-3 py-2.5 border border-neutral-200 dark:border-neutral-800 cursor-pointer"
                  >
                    <span className="text-sm">
                      {isAr ? q.question_ar : q.question_en}{" "}
                      <span className="text-xs text-neutral-500">
                        (-{Math.round(q.deduction_pct * 100)}% if No)
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [q.id]: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-emerald-600"
                    />
                  </label>
                );
              })}
            </div>

            {/* Photos Upload (3 to 5 photos, client-side compressed) */}
            <div className="space-y-2">
              <label
                htmlFor="seller-photos"
                className="block text-sm font-medium"
              >
                {isAr
                  ? `صور الحالة الفعلية (${photoUrls.length}/5 — الحد الأدنى ٣ صور)`
                  : `Condition Photos (${photoUrls.length}/5 — min 3 required, client-side compressed)`}
              </label>
              <input
                id="seller-photos"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="block w-full text-xs text-neutral-600 file:me-3 file:rounded file:border-0 file:bg-emerald-700 file:px-3 file:py-1.5 file:text-white"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {photoUrls.map((url, idx) => (
                  <span
                    key={`${url}-${idx}`}
                    className="rounded bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 text-xs font-mono"
                  >
                    Photo #{idx + 1} ✓
                  </span>
                ))}
              </div>
            </div>

            {/* Logistics & Handover Selector */}
            <div className="space-y-3 border-t border-neutral-200 dark:border-neutral-800 pt-4">
              <h3 className="text-sm font-semibold">
                {isAr
                  ? "٢. طريقة التسليم والخدمات اللوجستية"
                  : "2. Handover & Logistics Selection"}
              </h3>

              {selectedCategory?.is_bulky ? (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-200">
                  {isAr
                    ? "قطعة أثاث ضخمة: تخضع للمراجعة المسبقة للصور وتُجدول ضمن شاحنات النقل المجمعة حسب المنطقة الجغرافية."
                    : "Bulky Furniture Item: Routed to pre-verification and scheduled for zone-based batch truck collection."}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHandoverMethod("Courier")}
                    className={`rounded-lg border py-2 px-3 text-sm font-medium ${
                      handoverMethod === "Courier"
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                        : "border-neutral-300 dark:border-neutral-700"
                    }`}
                  >
                    {isAr
                      ? "مندوب من الباب للباب (Courier)"
                      : "Door-to-Door Courier"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHandoverMethod("Partner_Dropoff")}
                    className={`rounded-lg border py-2 px-3 text-sm font-medium ${
                      handoverMethod === "Partner_Dropoff"
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                        : "border-neutral-300 dark:border-neutral-700"
                    }`}
                  >
                    {isAr
                      ? "نقطة تسليم شريك معتمد (QR)"
                      : "Partner Drop-off Hub (QR)"}
                  </button>
                </div>
              )}

              {!selectedCategory?.is_bulky &&
              handoverMethod === "Partner_Dropoff" ? (
                <div>
                  <label
                    htmlFor="hub-select"
                    className="block text-xs font-medium mb-1"
                  >
                    {isAr ? "اختر نقطة التسليم" : "Select Authorized Drop-off Hub"}
                  </label>
                  <select
                    id="hub-select"
                    value={dropoffHubId}
                    onChange={(e) => setDropoffHubId(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
                  >
                    {dropoffHubs.map((h) => (
                      <option key={h.hub_id} value={h.hub_id}>
                        {isAr ? h.name_ar : h.name} — {h.city} ({h.zone})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="pickup-addr"
                      className="block text-xs font-medium mb-1"
                    >
                      {isAr ? "عنوان الاستلام" : "Pickup Address"}
                    </label>
                    <input
                      id="pickup-addr"
                      type="text"
                      required
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="pickup-slot"
                      className="block text-xs font-medium mb-1"
                    >
                      {isAr ? "فترة الاستلام المفضلة" : "Preferred Time Slot"}
                    </label>
                    <input
                      id="pickup-slot"
                      type="text"
                      value={pickupSlot}
                      onChange={(e) => setPickupSlot(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 py-2.5 text-sm font-semibold text-white transition"
            >
              {isPending
                ? isAr
                  ? "جارٍ الإرسال..."
                  : "Submitting..."
                : isAr
                  ? "تأكيد طلب البيع وإصدار كود التتبع"
                  : "Submit Acquisition Request & Generate Tracking Code"}
            </button>
          </div>

          {/* Right Column: Live Valuation Card */}
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30 p-6 space-y-4 h-fit">
            <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-300">
              {isAr
                ? "التقييم السعري المبدئي الفوري"
                : "Instant Estimated Price Range"}
            </h3>

            {liveEstimate && (
              <>
                <div
                  dir="ltr"
                  className="text-2xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400"
                >
                  {liveEstimate.estimatedMinPrice.toLocaleString()} –{" "}
                  {liveEstimate.estimatedMaxPrice.toLocaleString()} EGP
                </div>
                <div className="text-xs space-y-1 text-neutral-600 dark:text-neutral-400">
                  <p>
                    {isAr ? "نسبة الخصم التشخيصي:" : "Diagnostic Deduction:"}{" "}
                    <span dir="ltr" className="font-mono font-semibold">
                      {Math.round(liveEstimate.totalDeductionPct * 100)}%
                    </span>
                  </p>
                  <p>
                    {isAr ? "القيمة المرجعية المعدلة:" : "Adjusted Base Value:"}{" "}
                    <span dir="ltr" className="font-mono font-semibold">
                      {liveEstimate.adjustedValue.toLocaleString()} EGP
                    </span>
                  </p>
                </div>
                <div className="rounded-lg bg-white dark:bg-neutral-900 border border-emerald-200 dark:border-emerald-800 p-3 text-xs text-neutral-700 dark:text-neutral-300">
                  <strong>{isAr ? "تنبيه قانوني:" : "Legal Disclaimer:"}</strong>{" "}
                  {isAr ? liveEstimate.disclaimerAr : liveEstimate.disclaimerEn}
                </div>
              </>
            )}
          </div>
        </form>
      )}

      {/* TAB 2: CORPORATE BULK LIQUIDATION */}
      {activeTab === "bulk" && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 bg-white dark:bg-neutral-900 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {isAr
                ? "طلبات التصفية بالجملة للشركات"
                : "Corporate Bulk Liquidation Manifest"}
            </h2>
            <span className="rounded bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300">
              Account Type: {accountType}
            </span>
          </div>

          {accountType !== "Company" && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-300 px-4 py-3 text-xs text-amber-800 dark:text-amber-200">
              {isAr
                ? "ملاحظة: هذه الميزة مخصصة لحسابات الشركات فقط (يمكنك التبديل إلى حساب بائع شركات عبر قائمة محاكاة الأدوار أعلاه)."
                : "Note: Corporate liquidation is available exclusively to corporate accounts. Switch to 'Corporate Seller (B2B)' using the role switcher above."}
            </div>
          )}

          <form onSubmit={handleBulkSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="bulk-addr"
                className="block text-sm font-medium mb-1"
              >
                {isAr
                  ? "عنوان مقر الشركة للاستلام بالشاحنة"
                  : "Corporate Warehouse / Office Pickup Address"}
              </label>
              <input
                id="bulk-addr"
                type="text"
                required
                value={bulkAddress}
                onChange={(e) => setBulkAddress(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="bulk-csv"
                className="block text-sm font-medium mb-1"
              >
                {isAr
                  ? "قائمة الأصول (CSV: category_id, title, weight_kg)"
                  : "Structured Asset Lines (CSV format: category_id, title, weight_kg)"}
              </label>
              <textarea
                id="bulk-csv"
                rows={4}
                dir="ltr"
                value={bulkManifestText}
                onChange={(e) => setBulkManifestText(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent p-3 text-xs font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition"
            >
              {isAr
                ? "إرسال قائمة التصفية بالجملة"
                : "Submit Corporate Bulk Manifest"}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: MY ITEMS, 7-DAY OFFER DECISION & RETURN FEES */}
      {activeTab === "myItems" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-lg font-semibold">
                {isAr
                  ? "القطع المقدمة، شهادات مسح البيانات (NIST 800-88)، وعروض الأسعار النهائية (مهلة ٧ أيام / ١٦٨ ساعة)"
                  : "Submitted Items, NIST 800-88 Data Wipe Certificates & Final Offers (7-Day / 168h Window)"}
              </h2>
            </div>

            <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {myItems.length === 0 ? (
                <p className="p-6 text-sm text-neutral-500">
                  {isAr ? "لا توجد قطع مسجلة." : "No items submitted yet."}
                </p>
              ) : (
                myItems.map((item) => (
                  <div
                    key={item.item_serial_id}
                    className="p-6 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {isAr ? item.title_ar ?? item.title : item.title}
                        </span>
                        <span
                          dir="ltr"
                          className="rounded bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-xs font-mono"
                        >
                          {item.barcode ?? item.item_serial_id.slice(0, 8)}
                        </span>
                        <span className="rounded bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                          {item.current_status}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-500">
                        Estimated:{" "}
                        <span dir="ltr" className="font-mono">
                          {Number(item.estimated_min_price).toLocaleString()} –{" "}
                          {Number(item.estimated_max_price).toLocaleString()}{" "}
                          EGP
                        </span>
                        {item.final_purchase_price !== null && (
                          <>
                            {" "}
                            • Final Offer:{" "}
                            <strong
                              dir="ltr"
                              className="font-mono text-emerald-700 dark:text-emerald-400"
                            >
                              {Number(
                                item.final_purchase_price,
                              ).toLocaleString()}{" "}
                              EGP
                            </strong>
                          </>
                        )}
                        {item.offer_expires_at && (
                          <>
                            {" "}
                            • Expires (7d Window):{" "}
                            <span dir="ltr" className="font-mono">
                              {new Date(item.offer_expires_at).toLocaleString()}
                            </span>
                          </>
                        )}
                      </p>

                      {item.data_wiped_bool && (
                        <a
                          href={`/api/documents/certificate/${item.item_serial_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block text-xs font-semibold text-emerald-700 hover:underline"
                        >
                          📄{" "}
                          {isAr
                            ? "تحميل شهادة مسح البيانات المعتمدة (NIST 800-88)"
                            : "Download NIST 800-88 Data Destruction Certificate"}
                        </a>
                      )}
                    </div>

                    {item.current_status === "Awaiting_Seller_Decision" && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            handleOfferDecision(item.item_serial_id, "accept")
                          }
                          className="rounded-lg bg-emerald-700 hover:bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white"
                        >
                          {isAr
                            ? "قبول العرض واستلام المبلغ"
                            : "Accept Offer & Instant Payout"}
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            handleOfferDecision(item.item_serial_id, "reject")
                          }
                          className="rounded-lg bg-rose-700 hover:bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white"
                        >
                          {isAr
                            ? "رفض العرض واسترجاع القطعة"
                            : "Reject Offer & Return Item"}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Return Tasks & Fee Settlement */}
          {returnTasks.length > 0 && (
            <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 p-6 space-y-3">
              <h3 className="text-base font-bold text-amber-800 dark:text-amber-300">
                {isAr
                  ? "مهام إرجاع القطع وتسوية رسوم النقل والفحص"
                  : "Item Returns & Fee Settlement"}
              </h3>
              {returnTasks.map((rt) => (
                <div
                  key={rt.return_id}
                  className="flex items-center justify-between rounded-lg bg-white dark:bg-neutral-900 p-4 border border-amber-200 dark:border-amber-900"
                >
                  <div className="text-xs space-y-1">
                    <p className="font-mono">Item: {rt.item_serial_id}</p>
                    <p>
                      Return Transport & Inspection Fee:{" "}
                      <strong dir="ltr" className="font-mono">
                        {Number(rt.fee_amount).toLocaleString()} EGP
                      </strong>{" "}
                      ({rt.fee_status} • {rt.status})
                    </p>
                  </div>
                  {rt.fee_status === "pending" && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handlePayReturnFee(rt.return_id)}
                      className="rounded-lg bg-amber-600 hover:bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-white"
                    >
                      {isAr
                        ? "سداد رسوم الإرجاع (محاكاة)"
                        : "Settle Return Fee (Simulated)"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

