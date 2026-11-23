"use client";

import { useLocale } from "next-intl";
import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  approveCorporateQuoteAction,
  createOrUpdateCategoryAction,
  dispatchSegmentCampaignAction,
  expireCorporateQuoteAction,
  resolveWarrantyClaimAction,
  reviewBulkyPreverificationAction,
  runAdminAgingAndExpiryAction,
  updateCustomerSegmentAction,
  updateReturnTaskStatusAction,
} from "@/lib/domain/admin-actions";
import type { CustomerSegment, Json } from "@/types/domain";
import { AdminCampaignsTab } from "./admin-campaigns-tab";
import { AdminCategoriesTab } from "./admin-categories-tab";
import { AdminKpisTab } from "./admin-kpis-tab";
import { AdminOperationsTab } from "./admin-operations-tab";
import { AdminQuotesTab } from "./admin-quotes-tab";
import { AdminSupportTab } from "./admin-support-tab";
import type { AdminPortalClientProps } from "./admin-types";

type AdminTab =
  | "kpis"
  | "categories"
  | "campaigns"
  | "quotes"
  | "warranty"
  | "operations";

export function AdminPortalClient({
  activeRole,
  kpis,
  categories,
  quotes,
  claims,
  customers = [],
  campaignLogs = [],
  bulkyRequests = [],
  returnTasks = [],
  inventoryItems = [],
  auditLogs = [],
}: AdminPortalClientProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const isAdmin = activeRole === "Admin";
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<AdminTab>(
    activeRole === "Customer_Service" ? "warranty" : "kpis",
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agingSummary, setAgingSummary] = useState<string | null>(null);

  const openClaimsCount = claims.filter(
    (c) => c.status === "open" || c.status === "in_review",
  ).length;
  const pendingQuotesCount = quotes.filter(
    (q) => q.status === "requested",
  ).length;
  const pendingBulkyCount = bulkyRequests.filter(
    (r) => r.preverification_status === "pending",
  ).length;

  const clearAlerts = () => {
    setError(null);
    setFeedback(null);
  };

  const handleRunAging = () => {
    clearAlerts();
    startTransition(async () => {
      const res = await runAdminAgingAndExpiryAction();
      if (!res.ok) {
        setError(res.error ?? "Failed to execute inventory aging engine.");
        return;
      }
      const summaryText = res.summary
        ? JSON.stringify(res.summary)
        : "Completed";
      setAgingSummary(
        isAr
          ? `تم تنفيذ فحص التقادم وانتهاء العروض بنجاح: ${summaryText}`
          : `Aging & offer expiry engine executed: ${summaryText}`,
      );
      setFeedback(
        isAr
          ? "تم تحديث فئات تقادم المخزون وفحص العروض المنتهية بنجاح."
          : "Inventory aging tiers and 7-day offer expirations updated successfully.",
      );
      router.refresh();
    });
  };

  const handleSaveCategory = async (payload: {
    categoryId?: string;
    name: string;
    nameAr: string;
    baseReferencePrice: number;
    warrantyDays: number;
    isBulky: boolean;
    requiresDataWipe: boolean;
    diagnosticQuestionsJson: Json;
  }): Promise<boolean> => {
    clearAlerts();
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await createOrUpdateCategoryAction(payload);
        if (!res.ok) {
          setError(res.error ?? "Failed to save category.");
          resolve(false);
          return;
        }
        setFeedback(
          isAr
            ? `تم نشر فئة "${payload.name}" واستبيان الفحص الفني بنجاح!`
            : `Category "${payload.name}" and diagnostic assessment schema published successfully!`,
        );
        router.refresh();
        resolve(true);
      });
    });
  };

  const handleDispatchCampaign = async (payload: {
    segment: CustomerSegment;
    channel: "sms" | "email";
    message: string;
    promoCode?: string;
  }) => {
    clearAlerts();
    startTransition(async () => {
      const res = await dispatchSegmentCampaignAction(payload);
      if (!res.ok) {
        setError(res.error ?? "Failed to dispatch promotional campaign.");
        return;
      }
      setFeedback(
        isAr
          ? `تم إرسال الحملة الترويجية بنجاح إلى ${res.sentCount} من عملاء شريحة "${payload.segment}" عبر ${payload.channel.toUpperCase()}.`
          : `Targeted campaign dispatched to ${res.sentCount} "${payload.segment}" recipients via ${payload.channel.toUpperCase()}.`,
      );
      router.refresh();
    });
  };

  const handleUpdateSegment = async (
    userId: string,
    segment: CustomerSegment,
  ) => {
    clearAlerts();
    startTransition(async () => {
      const res = await updateCustomerSegmentAction({ userId, segment });
      if (!res.ok) {
        setError(res.error ?? "Failed to update customer segment.");
        return;
      }
      setFeedback(
        isAr
          ? `تم تحديث شريحة العميل إلى "${segment}".`
          : `Customer segment updated to "${segment}".`,
      );
      router.refresh();
    });
  };

  const handleApproveQuote = async (quoteId: string, discountPct: number) => {
    clearAlerts();
    startTransition(async () => {
      const res = await approveCorporateQuoteAction({ quoteId, discountPct });
      if (!res.ok) {
        setError(res.error ?? "Failed to approve corporate quote.");
        return;
      }
      setFeedback(
        isAr
          ? `تم اعتماد عرض السعر #${quoteId.slice(0, 8)} بخصم ${discountPct}% للشركات (صالح ٧ أيام).`
          : `Quote ${quoteId.slice(0, 8)} approved with ${discountPct}% B2B discount!`,
      );
      router.refresh();
    });
  };

  const handleExpireQuote = async (quoteId: string) => {
    clearAlerts();
    startTransition(async () => {
      const res = await expireCorporateQuoteAction({ quoteId });
      if (!res.ok) {
        setError(res.error ?? "Failed to expire corporate quote.");
        return;
      }
      setFeedback(
        isAr
          ? `تم إنهاء صلاحية عرض السعر #${quoteId.slice(0, 8)}.`
          : `Quote ${quoteId.slice(0, 8)} marked as expired.`,
      );
      router.refresh();
    });
  };

  const handleResolveClaim = async (
    claimId: string,
    status: "in_review" | "resolved" | "rejected",
    resolutionNote: string,
  ) => {
    clearAlerts();
    startTransition(async () => {
      const res = await resolveWarrantyClaimAction({
        claimId,
        status,
        resolutionNote,
      });
      if (!res.ok) {
        setError(res.error ?? "Failed to update warranty claim.");
        return;
      }
      setFeedback(
        isAr
          ? `تم تحديث مطالبة الضمان #${claimId.slice(0, 8)} إلى الحالة: ${status}.`
          : `Warranty claim ${claimId.slice(0, 8)} marked ${status}.`,
      );
      router.refresh();
    });
  };

  const handleUpdateReturnTask = async (
    returnId: string,
    action:
      | "confirm_fee_paid"
      | "authorize_dispatch"
      | "mark_dispatched"
      | "mark_returned",
  ) => {
    clearAlerts();
    startTransition(async () => {
      const res = await updateReturnTaskStatusAction({ returnId, action });
      if (!res.ok) {
        setError(res.error ?? "Failed to update return authorization.");
        return;
      }
      setFeedback(
        isAr
          ? `تم تحديث تفويض الإرجاع #${returnId.slice(0, 8)} بنجاح.`
          : `Return authorization #${returnId.slice(0, 8)} updated successfully.`,
      );
      router.refresh();
    });
  };

  const handleReviewBulky = async (
    requestId: string,
    decision: "approved" | "rejected",
  ) => {
    clearAlerts();
    startTransition(async () => {
      const res = await reviewBulkyPreverificationAction({
        requestId,
        decision,
      });
      if (!res.ok) {
        setError(res.error ?? "Failed to update bulky pre-verification.");
        return;
      }
      setFeedback(
        isAr
          ? `تم ${decision === "approved" ? "اعتماد" : "رفض"} الفحص المسبق للطلب #${requestId.slice(0, 8)}.`
          : `Bulky pre-verification #${requestId.slice(0, 8)} marked ${decision}.`,
      );
      router.refresh();
    });
  };

  const tabs: { id: AdminTab; label: string }[] = [
    {
      id: "kpis",
      label: isAr
        ? "١. مؤشرات الأداء والاستدامة"
        : "1. Platform KPIs & Sustainability",
    },
    {
      id: "categories",
      label: isAr
        ? "٢. إدارة الفئات والاستبيانات الفنية"
        : "2. Categories & Diagnostic Schemas",
    },
    {
      id: "campaigns",
      label: isAr
        ? "٣. شرائح العملاء والحملات الترويجية"
        : "3. Customer Segments & Campaigns",
    },
    {
      id: "quotes",
      label: isAr
        ? `٤. عروض الشركات (${quotes.length}${pendingQuotesCount > 0 ? ` • ${pendingQuotesCount}` : ""})`
        : `4. B2B Quotes (${quotes.length})`,
    },
    {
      id: "warranty",
      label: isAr
        ? `٥. مطالبات الضمان (${claims.length})`
        : `5. Warranty Claims (${claims.length})`,
    },
    {
      id: "operations",
      label: isAr
        ? `٦. حوكمة العمليات والتدقيق${pendingBulkyCount > 0 ? ` (${pendingBulkyCount})` : ""}`
        : `6. Operations & Audit Trail${pendingBulkyCount > 0 ? ` (${pendingBulkyCount})` : ""}`,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      {/* Header & Role Context */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-emerald-700 dark:text-emerald-400">
            {isAr
              ? "لوحة تحكم الإدارة ومؤشرات الأداء والاستدامة"
              : "Admin Control Center & Sustainability Dashboard"}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
            <span>
              {isAr ? "الدور النشط:" : "Active Role:"}{" "}
              <strong className="text-emerald-700 dark:text-emerald-400">
                {activeRole}
              </strong>
            </span>
            <span>•</span>
            <span>
              {isAr
                ? `مطالبات مفتوحة: ${openClaimsCount} • عروض شركات معلقة: ${pendingQuotesCount}`
                : `Open Claims: ${openClaimsCount} • Pending B2B Quotes: ${pendingQuotesCount}`}
            </span>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div
          role="tablist"
          aria-label={isAr ? "أقسام لوحة الإدارة" : "Admin sections"}
          className="flex flex-wrap gap-1.5"
        >
          {tabs.map((tItem) => (
            <button
              key={tItem.id}
              type="button"
              role="tab"
              aria-selected={tab === tItem.id}
              onClick={() => setTab(tItem.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                tab === tItem.id
                  ? "bg-emerald-700 text-white"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              {tItem.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback & Error Alerts */}
      {feedback && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-400 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200"
        >
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold opacity-70 hover:opacity-100 cursor-pointer"
            aria-label={isAr ? "إغلاق" : "Dismiss"}
          >
            ✕
          </button>
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-400 px-4 py-3 text-sm text-rose-800 dark:text-rose-200"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs font-semibold opacity-70 hover:opacity-100 cursor-pointer"
            aria-label={isAr ? "إغلاق" : "Dismiss"}
          >
            ✕
          </button>
        </div>
      )}

      {/* Active Tab Panel */}
      {tab === "kpis" && (
        <AdminKpisTab
          isAr={isAr}
          isAdmin={isAdmin}
          isPending={isPending}
          kpis={kpis}
          agingSummary={agingSummary}
          onRunAging={handleRunAging}
        />
      )}

      {tab === "categories" && (
        <AdminCategoriesTab
          isAr={isAr}
          isAdmin={isAdmin}
          isPending={isPending}
          categories={categories}
          onSaveCategory={handleSaveCategory}
        />
      )}

      {tab === "campaigns" && (
        <AdminCampaignsTab
          isAr={isAr}
          isAdmin={isAdmin}
          isPending={isPending}
          customers={customers}
          campaignLogs={campaignLogs}
          onDispatchCampaign={handleDispatchCampaign}
          onUpdateSegment={handleUpdateSegment}
        />
      )}

      {tab === "quotes" && (
        <AdminQuotesTab
          isAr={isAr}
          isAdmin={isAdmin}
          isPending={isPending}
          quotes={quotes}
          onApproveQuote={handleApproveQuote}
          onExpireQuote={handleExpireQuote}
        />
      )}

      {tab === "warranty" && (
        <AdminSupportTab
          isAr={isAr}
          isPending={isPending}
          claims={claims}
          returnTasks={returnTasks}
          onResolveClaim={handleResolveClaim}
          onUpdateReturnTask={handleUpdateReturnTask}
        />
      )}

      {tab === "operations" && (
        <AdminOperationsTab
          isAr={isAr}
          isAdmin={isAdmin}
          isPending={isPending}
          bulkyRequests={bulkyRequests}
          inventoryItems={inventoryItems}
          auditLogs={auditLogs}
          onReviewBulky={handleReviewBulky}
        />
      )}
    </div>
  );
}
