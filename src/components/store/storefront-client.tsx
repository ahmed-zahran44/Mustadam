"use client";

import { useLocale } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import type {
  PaymentChannel,
  PaymentOutcome,
} from "@/lib/adapters/payment-gateway";
import { resolveProductMedia } from "@/lib/catalog/laptop-media";
import {
  confirmOrderDeliveryAction,
  createSerializedOrderReservationAction,
  executeSimulatedPaymentAction,
  submitCorporateQuoteRequestAction,
  submitWarrantyClaimAction,
} from "@/lib/domain/store-actions";

interface StoreCatalogItem {
  item_serial_id: string;
  title: string;
  title_ar: string | null;
  barcode: string | null;
  category_id: string;
  condition_grade: string | null;
  selling_price: number | null;
  target_selling_price: number | null;
  total_unit_cost: number | null;
  aging_tier: string | null;
  listed_date: string | null;
  diagnostic_answers?: unknown;
  categories?: { name: string; name_ar: string; warranty_days: number } | null;
}

interface BuyerOrderRow {
  order_id: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  payment_transaction_ref: string | null;
  reserved_until: string;
  invoice_url: string | null;
  created_at: string;
  order_items_warranty: Array<{
    order_item_id: string;
    item_serial_id: string;
    sold_price: number;
    delivery_date: string | null;
    warranty_end_date: string | null;
  }>;
}

interface QuoteRequestRow {
  quote_id: string;
  status: string;
  discount_pct: number;
  valid_until: string | null;
  created_at: string;
}

interface StorefrontClientProps {
  accountType: string;
  catalogItems: StoreCatalogItem[];
  orders: BuyerOrderRow[];
  quotes: QuoteRequestRow[];
}

export function StorefrontClient({
  accountType,
  catalogItems,
  orders,
  quotes,
}: StorefrontClientProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"catalog" | "orders" | "quotes">(
    "catalog",
  );
  const [gradeFilter, setGradeFilter] = useState<string>("ALL");
  const [brandFilter, setBrandFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"featured" | "price_asc" | "price_desc">(
    "featured",
  );
  const [quickViewItem, setQuickViewItem] = useState<StoreCatalogItem | null>(
    null,
  );
  const [quickViewImgIdx, setQuickViewImgIdx] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState(
    "5th Settlement, New Cairo",
  );
  const [paymentChannel, setPaymentChannel] = useState<PaymentChannel>("Card");
  const [simulatedOutcome, setSimulatedOutcome] =
    useState<PaymentOutcome>("SUCCESS");
  const [activeReservation, setActiveReservation] = useState<{
    orderId: string;
    totalAmount: number;
    reservedUntil: string;
  } | null>(null);
  const [claimDesc, setClaimDesc] = useState(
    "Device battery drains faster than specification during normal load.",
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    for (const item of catalogItems) {
      const media = resolveProductMedia(item.title, item.diagnostic_answers);
      if (media.brand) brands.add(media.brand);
    }
    return Array.from(brands).sort();
  }, [catalogItems]);

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = catalogItems.filter((item) => {
      if (gradeFilter !== "ALL" && item.condition_grade !== gradeFilter) {
        return false;
      }
      const media = resolveProductMedia(item.title, item.diagnostic_answers);
      if (brandFilter !== "ALL" && media.brand !== brandFilter) {
        return false;
      }
      if (q) {
        const haystack = [
          item.title,
          item.title_ar ?? "",
          item.barcode ?? "",
          media.brand ?? "",
          media.cpu ?? "",
          media.ram ?? "",
          media.gpu ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === "price_asc") {
      return [...list].sort(
        (a, b) => Number(a.selling_price ?? 0) - Number(b.selling_price ?? 0),
      );
    }
    if (sortBy === "price_desc") {
      return [...list].sort(
        (a, b) => Number(b.selling_price ?? 0) - Number(a.selling_price ?? 0),
      );
    }
    return list;
  }, [catalogItems, gradeFilter, brandFilter, searchQuery, sortBy]);

  const toggleItemSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleReserveCheckout = () => {
    if (!selectedIds.length) return;
    setError(null);
    setFeedback(null);
    const approvedQuote = quotes.find((q) => q.status === "quoted");
    startTransition(async () => {
      const res = await createSerializedOrderReservationAction({
        itemSerialIds: selectedIds,
        paymentMethod: paymentChannel,
        deliveryAddress,
        quoteId: approvedQuote?.quote_id,
      });
      if (!res.ok) {
        setError(res.error ?? "Checkout lock failed");
        return;
      }
      setActiveReservation({
        orderId: res.orderId!,
        totalAmount: res.totalAmount!,
        reservedUntil: res.reservedUntil!,
      });
      setFeedback(
        isAr
          ? `تم حجز الطلب #${res.orderId!.slice(0, 8)}! يرجى إتمام الدفع خلال ١٥ دقيقة (حتى ${new Date(res.reservedUntil!).toLocaleTimeString()}) لتأكيد الشراء.`
          : `Order #${res.orderId!.slice(0, 8)} reserved! Complete payment within 15 minutes (until ${new Date(res.reservedUntil!).toLocaleTimeString()}) to secure your items.`,
      );
      router.refresh();
    });
  };

  const handleSimulatePayment = (orderId: string, amountEgp: number) => {
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      const res = await executeSimulatedPaymentAction({
        orderId,
        amountEgp,
        channel: paymentChannel,
        simulatedOutcome,
      });
      if (!res.ok) {
        setError(res.error ?? "Payment failed");
        return;
      }
      setActiveReservation(null);
      setSelectedIds([]);
      setFeedback(
        res.outcome === "SUCCESS"
          ? `Payment SUCCESS (${res.transactionRef})! Item transitioned to Sold & PDF Tax Invoice generated.`
          : `Payment FAILED (${res.transactionRef}). 15-minute reservation lock immediately released for other buyers!`,
      );
      router.refresh();
    });
  };

  const handleRequestB2BQuote = () => {
    if (!selectedIds.length) return;
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      const res = await submitCorporateQuoteRequestAction({
        itemSerialIds: selectedIds,
      });
      if (!res.ok) {
        setError(res.error ?? "Quote request failed");
        return;
      }
      setFeedback(`Corporate Bulk Quote Request ${res.quoteId} submitted!`);
      router.refresh();
    });
  };

  const handleConfirmDelivery = (orderItemId: string) => {
    startTransition(async () => {
      const res = await confirmOrderDeliveryAction(orderItemId);
      if (res.ok) {
        setFeedback(
          isAr
            ? `تم تأكيد الاستلام (${res.deliveryDate})! الضمان سارٍ حتى ${res.warrantyEndDate}.`
            : `Delivery confirmed (${res.deliveryDate})! Your warranty is active until ${res.warrantyEndDate}.`,
        );
        router.refresh();
      }
    });
  };

  const handleWarrantyClaim = (orderItemId: string) => {
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      const res = await submitWarrantyClaimAction({
        orderItemId,
        description: claimDesc,
      });
      if (!res.ok) {
        setError(res.error ?? "Claim failed");
        return;
      }
      setFeedback(
        isAr
          ? "تم تقديم طلب الضمان بنجاح! سيقوم فريق خدمة العملاء بمراجعته والتواصل معك."
          : "Warranty claim submitted successfully! Our support team will review your request shortly.",
      );
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-700">
            {isAr
              ? "متجر الأجهزة والقطع المجددة المعتمدة"
              : "Certified Pre-Owned & Refurbished Store"}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {isAr
              ? "كل منتج معروض هو قطعة فريدة مفحوصة وموثقة برقم تسلسلي، مع حجز مؤقت لمدة ١٥ دقيقة أثناء إتمام الدفع."
              : "Every product is an individually verified, serialized unit with a 15-minute checkout reservation hold."}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("catalog")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              activeTab === "catalog"
                ? "bg-emerald-700 text-white"
                : "bg-neutral-100 dark:bg-neutral-800"
            }`}
          >
            {isAr
              ? `المتجر (${catalogItems.length})`
              : `Catalog (${catalogItems.length})`}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              activeTab === "orders"
                ? "bg-emerald-700 text-white"
                : "bg-neutral-100 dark:bg-neutral-800"
            }`}
          >
            {isAr
              ? `طلباتي والضمان (${orders.length})`
              : `My Orders & Warranty (${orders.length})`}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("quotes")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              activeTab === "quotes"
                ? "bg-emerald-700 text-white"
                : "bg-neutral-100 dark:bg-neutral-800"
            }`}
          >
            {isAr
              ? `عروض أسعار الشركات (${quotes.length})`
              : `B2B Quotes (${quotes.length})`}
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

      {/* TAB 1: SERIALIZED STOREFRONT & SIMULATED PAYMENT GATEWAY */}
      {activeTab === "catalog" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* E-Commerce Search, Brand, Grade & Sort Controls */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="store-search"
                    placeholder={
                      isAr
                        ? "ابحث عن لابتوب، معالج، رام، أو باركود..."
                        : "Search laptops, CPU, RAM, GPU, or barcode..."
                    }
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3.5 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as "featured" | "price_asc" | "price_desc",
                    )
                  }
                  aria-label={isAr ? "ترتيب حسب" : "Sort by"}
                  className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs font-medium"
                >
                  <option value="featured">
                    {isAr ? "الترتيب: المميزة" : "Sort: Featured"}
                  </option>
                  <option value="price_asc">
                    {isAr
                      ? "السعر: من الأقل للأعلى"
                      : "Price: Low to High"}
                  </option>
                  <option value="price_desc">
                    {isAr
                      ? "السعر: من الأعلى للأقل"
                      : "Price: High to Low"}
                  </option>
                </select>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-neutral-500">
                    {isAr ? "الدرجة:" : "Filter by Condition Grade:"}
                  </span>
                  {["ALL", "A", "B", "C"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGradeFilter(g)}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                        gradeFilter === g
                          ? "bg-emerald-700 text-white"
                          : "bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      }`}
                    >
                      {g === "ALL" ? "All Grades" : `Grade ${g}`}
                    </button>
                  ))}
                </div>

                {availableBrands.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBrandFilter("ALL")}
                      className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                        brandFilter === "ALL"
                          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                      }`}
                    >
                      {isAr ? "كل الماركات" : "All Brands"}
                    </button>
                    {availableBrands.map((brand) => (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => setBrandFilter(brand)}
                        className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                          brandFilter === brand
                            ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {filteredCatalog.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 p-10 text-center space-y-2">
                <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  {isAr
                    ? "لا توجد أجهزة مطابقة لخيارات البحث الحالية."
                    : "No certified devices match your current filters."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setGradeFilter("ALL");
                    setBrandFilter("ALL");
                    setSearchQuery("");
                  }}
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 underline"
                >
                  {isAr ? "إعادة ضبط الفلاتر" : "Reset all filters"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredCatalog.map((item) => {
                  const isSelected = selectedIds.includes(item.item_serial_id);
                  const hasMarkdown =
                    item.aging_tier === "31_60" || item.aging_tier === "61_90";
                  const media = resolveProductMedia(
                    item.title,
                    item.diagnostic_answers,
                  );

                  return (
                    <div
                      key={item.item_serial_id}
                      className={`group rounded-xl border p-5 space-y-3 transition flex flex-col justify-between ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-sm"
                          : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-emerald-500/60 hover:shadow-md"
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Product Image Gallery Preview */}
                        <button
                          type="button"
                          onClick={() => {
                            setQuickViewItem(item);
                            setQuickViewImgIdx(0);
                          }}
                          className="relative block w-full aspect-[4/3] overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-950 border border-neutral-200/70 dark:border-neutral-800"
                        >
                          <img
                            src={media.images[0]}
                            alt={isAr ? item.title_ar ?? item.title : item.title}
                            loading="lazy"
                            className="h-full w-full object-contain p-2 transition duration-300 group-hover:scale-105"
                          />
                          <div className="absolute top-2 start-2 flex flex-wrap gap-1">
                            <span className="inline-block rounded-md bg-emerald-700/90 px-2 py-0.5 text-[11px] font-bold text-white shadow-xs">
                              Grade {item.condition_grade ?? "A"}
                            </span>
                            {hasMarkdown && (
                              <span className="inline-block rounded-md bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-xs">
                                {item.aging_tier === "31_60"
                                  ? "-20% OFF"
                                  : "Clearance"}
                              </span>
                            )}
                          </div>
                          <span className="absolute bottom-2 end-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                            {isAr ? "معاينة سريعة" : "Quick View"}
                          </span>
                        </button>

                        <div className="flex items-center justify-between gap-2 text-[11px] text-neutral-500">
                          <span className="font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                            {media.brand ??
                              (isAr
                                ? item.categories?.name_ar
                                : item.categories?.name) ??
                              "Certified"}
                          </span>
                          <span dir="ltr" className="font-mono">
                            {item.barcode ?? item.item_serial_id.slice(0, 8)}
                          </span>
                        </div>

                        <h3 className="font-bold text-base leading-snug text-neutral-900 dark:text-neutral-100">
                          {isAr ? item.title_ar ?? item.title : item.title}
                        </h3>

                        {/* Hardware Spec Chips */}
                        {(media.cpu || media.ram || media.storage || media.gpu) && (
                          <div
                            dir="ltr"
                            className="flex flex-wrap gap-1.5 text-[11px] text-neutral-700 dark:text-neutral-300"
                          >
                            {media.cpu && (
                              <span className="rounded bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 font-medium">
                                {media.cpu}
                              </span>
                            )}
                            {media.ram && (
                              <span className="rounded bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 font-medium">
                                {media.ram}
                              </span>
                            )}
                            {media.storage && (
                              <span className="rounded bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 font-medium">
                                {media.storage}
                              </span>
                            )}
                            {media.gpu && (
                              <span className="rounded bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 font-medium">
                                {media.gpu}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="flex items-baseline gap-2">
                            <span
                              dir="ltr"
                              className="text-xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400"
                            >
                              {Number(item.selling_price ?? 0).toLocaleString()}{" "}
                              EGP
                            </span>
                            {hasMarkdown && item.target_selling_price && (
                              <span
                                dir="ltr"
                                className="text-xs font-mono line-through text-neutral-400"
                              >
                                {Number(
                                  item.target_selling_price,
                                ).toLocaleString()}{" "}
                                EGP
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-neutral-500">
                          Warranty:{" "}
                          <strong>
                            {item.categories?.warranty_days ?? 90} Days
                          </strong>{" "}
                          • Serialized Unit (Qty = 1)
                        </p>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              toggleItemSelection(item.item_serial_id)
                            }
                            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                              isSelected
                                ? "bg-emerald-700 text-white"
                                : "bg-neutral-900 text-white hover:bg-emerald-700 dark:bg-neutral-800 dark:hover:bg-emerald-700"
                            }`}
                          >
                            {isSelected
                              ? isAr
                                ? "محدد في السلة ✓"
                                : "Selected in Cart ✓"
                              : isAr
                                ? "إضافة إلى السلة"
                                : "Select Serialized Unit"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setQuickViewItem(item);
                              setQuickViewImgIdx(0);
                            }}
                            className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                          >
                            {isAr ? "التفاصيل" : "Specs"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Checkout & Simulated Payment Gateway Box */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4 h-fit">
            <h2 className="text-base font-bold">
              {isAr
                ? "إتمام الطلب وبوابة الدفع الإلكتروني"
                : "Checkout & Electronic Payment"}
            </h2>

            <p className="text-xs text-neutral-500">
              {isAr ? (
                <>
                  القطع المحددة: <strong>{selectedIds.length}</strong> (الدفع إلكتروني آمن؛ الدفع عند الاستلام غير متاح).
                </>
              ) : (
                <>
                  Selected Items: <strong>{selectedIds.length}</strong> (Electronic payment required; Cash on Delivery is not supported).
                </>
              )}
            </p>

            <div>
              <label
                htmlFor="chk-addr"
                className="block text-xs font-medium mb-1"
              >
                {isAr ? "عنوان التوصيل" : "Delivery Address"}
              </label>
              <input
                id="chk-addr"
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label
                htmlFor="chk-channel"
                className="block text-xs font-medium mb-1"
              >
                {isAr ? "وسيلة الدفع الإلكتروني" : "Electronic Payment Channel"}
              </label>
              <select
                id="chk-channel"
                value={paymentChannel}
                onChange={(e) =>
                  setPaymentChannel(e.target.value as PaymentChannel)
                }
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs"
              >
                <option value="Card">
                  Bank Card (Visa / Mastercard / Meeza)
                </option>
                <option value="Wallet">Mobile Wallet (Vodafone / Fawry)</option>
                <option value="InstaPay">InstaPay Instant Transfer</option>
              </select>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={isPending || selectedIds.length === 0}
                onClick={handleReserveCheckout}
                className="w-full rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 py-2.5 text-xs font-semibold text-white"
              >
                {isAr
                  ? "١. حجز المنتجات وإتمام الدفع (١٥ دقيقة)"
                  : "1. Reserve Items & Proceed to Payment"}
              </button>

              {accountType === "Company" && (
                <button
                  type="button"
                  disabled={isPending || selectedIds.length === 0}
                  onClick={handleRequestB2BQuote}
                  className="w-full rounded-lg border border-emerald-600 text-emerald-700 dark:text-emerald-300 py-2 text-xs font-semibold"
                >
                  {isAr
                    ? "طلب عرض أسعار للشركات (B2B)"
                    : "Request Corporate Bulk Quote"}
                </button>
              )}
            </div>

            {activeReservation && (
              <div className="rounded-lg bg-slate-900 text-slate-100 p-4 space-y-3">
                <p className="text-xs font-semibold text-emerald-400">
                  Active 15-Minute Lock: Order{" "}
                  {activeReservation.orderId.slice(0, 8)}
                </p>
                <p className="text-xs">
                  Total:{" "}
                  <strong dir="ltr" className="font-mono">
                    {activeReservation.totalAmount.toLocaleString()} EGP
                  </strong>
                </p>
                <div>
                  <label
                    htmlFor="sim-outcome"
                    className="block text-[11px] text-slate-300 mb-1"
                  >
                    {isAr ? "نتيجة الدفع المحاكية:" : "Simulated Payment Outcome:"}
                  </label>
                  <select
                    id="sim-outcome"
                    value={simulatedOutcome}
                    onChange={(e) =>
                      setSimulatedOutcome(e.target.value as PaymentOutcome)
                    }
                    className="w-full rounded bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="SUCCESS">
                      SUCCESS (Mark Sold + Issue Tax Invoice)
                    </option>
                    <option value="FAILED">
                      FAILED (Release 15-Min Lock Immediately)
                    </option>
                  </select>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    handleSimulatePayment(
                      activeReservation.orderId,
                      activeReservation.totalAmount,
                    )
                  }
                  className="w-full rounded bg-emerald-600 hover:bg-emerald-500 py-2 text-xs font-bold text-white"
                >
                  2. Trigger Simulated Payment Webhook
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS, TAX INVOICE PDF & WARRANTY CLAIMS */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <p className="text-sm text-neutral-500">No orders placed yet.</p>
          ) : (
            orders.map((o) => (
              <div
                key={o.order_id}
                className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                  <div>
                    <span className="font-mono font-bold text-sm">
                      Order #{o.order_id.slice(0, 8)}
                    </span>{" "}
                    <span className="rounded bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      {o.payment_status} ({o.payment_method})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span dir="ltr" className="font-mono font-bold text-sm">
                      {Number(o.total_amount).toLocaleString()} EGP
                    </span>
                    {o.payment_status === "SUCCESS" && (
                      <a
                        href={`/api/documents/invoice/${o.order_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded bg-emerald-700 px-3 py-1 text-xs font-semibold text-white"
                      >
                        {isAr ? "📄 تحميل الفاتورة الضريبية" : "📄 Download Tax Invoice"}
                      </a>
                    )}
                  </div>
                </div>

                {o.order_items_warranty.map((oi) => (
                  <div
                    key={oi.order_item_id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-neutral-50 dark:bg-neutral-950 p-3 text-xs"
                  >
                    <div>
                      <p className="font-mono">
                        Item Serial: {oi.item_serial_id}
                      </p>
                      <p className="text-neutral-500">
                        Delivery Date: {oi.delivery_date ?? "Pending Delivery"}{" "}
                        • Warranty Valid Until:{" "}
                        <strong>{oi.warranty_end_date ?? "N/A"}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!oi.delivery_date && o.payment_status === "SUCCESS" && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            handleConfirmDelivery(oi.order_item_id)
                          }
                          className="rounded bg-slate-800 text-white px-3 py-1.5 font-semibold"
                        >
                          {isAr ? "تأكيد الاستلام وتفعيل الضمان" : "Confirm Delivery & Activate Warranty"}
                        </button>
                      )}
                      {oi.warranty_end_date && (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={claimDesc}
                            onChange={(e) => setClaimDesc(e.target.value)}
                            className="rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-xs w-48"
                          />
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              handleWarrantyClaim(oi.order_item_id)
                            }
                            className="rounded bg-amber-600 text-white px-3 py-1.5 font-semibold"
                          >
                            {isAr ? "تقديم طلب ضمان" : "Submit Warranty Claim"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: CORPORATE B2B QUOTES */}
      {activeTab === "quotes" && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-3">
          <h2 className="text-base font-bold">
            {isAr
              ? "طلبات عروض الأسعار للشركات"
              : "Corporate Bulk Quote Requests"}
          </h2>
          {quotes.length === 0 ? (
            <p className="text-xs text-neutral-500">No B2B quotes requested.</p>
          ) : (
            quotes.map((q) => (
              <div
                key={q.quote_id}
                className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 text-xs"
              >
                <div>
                  <p className="font-mono font-semibold">
                    Quote #{q.quote_id.slice(0, 8)} • Status: {q.status}
                  </p>
                  <p className="text-neutral-500">
                    Discount Approved: <strong>{q.discount_pct}%</strong> •
                    Valid Until: {q.valid_until ?? "Pending Admin Approval"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Quick-View Product Detail Modal */}
      {quickViewItem && (() => {
        const qvMedia = resolveProductMedia(
          quickViewItem.title,
          quickViewItem.diagnostic_answers,
        );
        const qvSelected = selectedIds.includes(quickViewItem.item_serial_id);
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
          >
            <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    {qvMedia.brand ?? "Certified"} • Grade{" "}
                    {quickViewItem.condition_grade ?? "A"}
                  </span>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                    {isAr
                      ? quickViewItem.title_ar ?? quickViewItem.title
                      : quickViewItem.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickViewItem(null)}
                  className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-1 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  {isAr ? "إغلاق" : "Close"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950">
                    <img
                      src={qvMedia.images[quickViewImgIdx] ?? qvMedia.images[0]}
                      alt={quickViewItem.title}
                      className="h-full w-full object-contain p-3"
                    />
                  </div>
                  {qvMedia.images.length > 1 && (
                    <div className="flex gap-2">
                      {qvMedia.images.map((img, idx) => (
                        <button
                          key={img}
                          type="button"
                          onClick={() => setQuickViewImgIdx(idx)}
                          className={`h-14 w-16 overflow-hidden rounded-lg border p-1 bg-neutral-50 dark:bg-neutral-950 ${
                            quickViewImgIdx === idx
                              ? "border-emerald-600 ring-2 ring-emerald-500/30"
                              : "border-neutral-200 dark:border-neutral-800"
                          }`}
                        >
                          <img
                            src={img}
                            alt=""
                            className="h-full w-full object-contain"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-baseline gap-2">
                    <span
                      dir="ltr"
                      className="text-2xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400"
                    >
                      {Number(quickViewItem.selling_price ?? 0).toLocaleString()}{" "}
                      EGP
                    </span>
                  </div>

                  <dl
                    dir="ltr"
                    className="grid grid-cols-2 gap-2 text-xs border-y border-neutral-200 dark:border-neutral-800 py-3"
                  >
                    {qvMedia.cpu && (
                      <>
                        <dt className="text-neutral-500">Processor</dt>
                        <dd className="font-medium">{qvMedia.cpu}</dd>
                      </>
                    )}
                    {qvMedia.ram && (
                      <>
                        <dt className="text-neutral-500">Memory</dt>
                        <dd className="font-medium">{qvMedia.ram}</dd>
                      </>
                    )}
                    {qvMedia.storage && (
                      <>
                        <dt className="text-neutral-500">Storage</dt>
                        <dd className="font-medium">{qvMedia.storage}</dd>
                      </>
                    )}
                    {qvMedia.gpu && (
                      <>
                        <dt className="text-neutral-500">Graphics</dt>
                        <dd className="font-medium">{qvMedia.gpu}</dd>
                      </>
                    )}
                    {qvMedia.screen && (
                      <>
                        <dt className="text-neutral-500">Display</dt>
                        <dd className="font-medium">{qvMedia.screen}</dd>
                      </>
                    )}
                    <dt className="text-neutral-500">Serial Barcode</dt>
                    <dd className="font-mono">
                      {quickViewItem.barcode ??
                        quickViewItem.item_serial_id.slice(0, 8)}
                    </dd>
                  </dl>

                  <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                    <p>
                      ✓ NIST SP 800-88 Data Sanitization Verified
                    </p>
                    <p>
                      ✓ {quickViewItem.categories?.warranty_days ?? 90}-Day
                      Serialized Hardware Warranty
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      toggleItemSelection(quickViewItem.item_serial_id);
                      setQuickViewItem(null);
                    }}
                    className={`w-full rounded-lg py-2.5 text-sm font-semibold transition ${
                      qvSelected
                        ? "bg-rose-600 text-white hover:bg-rose-700"
                        : "bg-emerald-700 text-white hover:bg-emerald-800"
                    }`}
                  >
                    {qvSelected
                      ? isAr
                        ? "إزالة من السلة"
                        : "Remove from Cart"
                      : isAr
                        ? "إضافة إلى السلة"
                        : "Add to Cart"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

