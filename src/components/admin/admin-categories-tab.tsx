"use client";

import { useMemo, useState } from "react";
import { calculateEstimatedPriceRange } from "@/lib/domain/pricing-engine";
import type { CategoryRow, DiagnosticQuestion, Json } from "@/types/domain";

interface AdminCategoriesTabProps {
  isAr: boolean;
  isAdmin: boolean;
  isPending: boolean;
  categories: CategoryRow[];
  onSaveCategory: (payload: {
    categoryId?: string;
    name: string;
    nameAr: string;
    baseReferencePrice: number;
    warrantyDays: number;
    isBulky: boolean;
    requiresDataWipe: boolean;
    diagnosticQuestionsJson: Json;
  }) => Promise<boolean>;
}

const DEFAULT_QUESTIONS: DiagnosticQuestion[] = [
  {
    id: "power",
    question_en: "Powers on normally?",
    question_ar: "هل يعمل الجهاز بشكل طبيعي؟",
    type: "boolean",
    deduction_pct: 0.25,
  },
];

function parseQuestionsSafe(raw: unknown): DiagnosticQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item, idx) => ({
      id: typeof item.id === "string" && item.id.trim() ? item.id : `q_${idx + 1}`,
      question_en:
        typeof item.question_en === "string"
          ? item.question_en
          : typeof item.question === "string"
            ? item.question
            : "",
      question_ar:
        typeof item.question_ar === "string" ? item.question_ar : "",
      type: "boolean",
      deduction_pct: Number.isFinite(Number(item.deduction_pct))
        ? Number(item.deduction_pct)
        : 0.1,
    }));
}

export function AdminCategoriesTab({
  isAr,
  isAdmin,
  isPending,
  categories,
  onSaveCategory,
}: AdminCategoriesTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catNameAr, setCatNameAr] = useState("");
  const [catBasePrice, setCatBasePrice] = useState(6000);
  const [catWarrantyDays, setCatWarrantyDays] = useState(60);
  const [catBulky, setCatBulky] = useState(false);
  const [catWipe, setCatWipe] = useState(false);
  const [questions, setQuestions] =
    useState<DiagnosticQuestion[]>(DEFAULT_QUESTIONS);
  const [catJson, setCatJson] = useState(JSON.stringify(DEFAULT_QUESTIONS));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRawJson, setShowRawJson] = useState(true);

  const syncQuestionsToJson = (next: DiagnosticQuestion[]) => {
    setQuestions(next);
    setCatJson(JSON.stringify(next, null, 2));
    setJsonError(null);
  };

  const handleJsonChange = (value: string) => {
    setCatJson(value);
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        setJsonError(
          isAr
            ? "يجب أن يكون مخطط الأسئلة مصفوفة JSON صالحة."
            : "Diagnostic schema must be a valid JSON array.",
        );
        return;
      }
      setQuestions(parseQuestionsSafe(parsed));
      setJsonError(null);
    } catch {
      setJsonError(
        isAr
          ? "صيغة JSON غير صالحة في أسئلة التشخيص."
          : "Invalid JSON format in diagnostic questions.",
      );
    }
  };

  const handleAddQuestionRow = () => {
    const nextIdx = questions.length + 1;
    syncQuestionsToJson([
      ...questions,
      {
        id: `check_${nextIdx}`,
        question_en: "All ports and controls functional?",
        question_ar: "هل جميع المنافذ والأزرار تعمل بكفاءة؟",
        type: "boolean",
        deduction_pct: 0.1,
      },
    ]);
  };

  const handleUpdateQuestion = (
    idx: number,
    patch: Partial<DiagnosticQuestion>,
  ) => {
    const updated = questions.map((q, i) => (i === idx ? { ...q, ...patch } : q));
    syncQuestionsToJson(updated);
  };

  const handleRemoveQuestion = (idx: number) => {
    syncQuestionsToJson(questions.filter((_, i) => i !== idx));
  };

  const handleLoadCategoryForEdit = (cat: CategoryRow) => {
    const parsed = parseQuestionsSafe(cat.diagnostic_questions_json);
    const effectiveQuestions = parsed.length > 0 ? parsed : DEFAULT_QUESTIONS;
    setEditingId(cat.category_id);
    setCatName(cat.name);
    setCatNameAr(cat.name_ar);
    setCatBasePrice(Number(cat.base_reference_price));
    setCatWarrantyDays(Number(cat.warranty_days));
    setCatBulky(Boolean(cat.is_bulky));
    setCatWipe(Boolean(cat.requires_data_wipe));
    setQuestions(effectiveQuestions);
    setCatJson(JSON.stringify(effectiveQuestions, null, 2));
    setJsonError(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setCatName("");
    setCatNameAr("");
    setCatBasePrice(6000);
    setCatWarrantyDays(60);
    setCatBulky(false);
    setCatWipe(false);
    setQuestions(DEFAULT_QUESTIONS);
    setCatJson(JSON.stringify(DEFAULT_QUESTIONS));
    setJsonError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let parsedJson: Json;
    try {
      parsedJson = JSON.parse(catJson) as Json;
    } catch {
      setJsonError(
        isAr
          ? "صيغة JSON غير صالحة في أسئلة التشخيص."
          : "Invalid JSON format in diagnostic questions.",
      );
      return;
    }

    const ok = await onSaveCategory({
      categoryId: editingId ?? undefined,
      name: catName,
      nameAr: catNameAr,
      baseReferencePrice: catBasePrice,
      warrantyDays: catWarrantyDays,
      isBulky: catBulky,
      requiresDataWipe: catWipe,
      diagnosticQuestionsJson: parsedJson,
    });

    if (ok) {
      resetForm();
    }
  };

  // Deduplicate display notice if duplicate legacy rows exist, while showing all rows
  const filteredCategories = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.name_ar.toLowerCase().includes(q),
    );
  }, [categories, searchTerm]);

  // Live Pricing Preview (all passed vs all failed)
  const previewMint = useMemo(() => {
    const allYes = Object.fromEntries(questions.map((q) => [q.id, true]));
    const allNo = Object.fromEntries(questions.map((q) => [q.id, false]));
    return {
      best: calculateEstimatedPriceRange({
        baseReferencePrice: catBasePrice,
        questions,
        answers: allYes,
      }),
      worst: calculateEstimatedPriceRange({
        baseReferencePrice: catBasePrice,
        questions,
        answers: allNo,
      }),
    };
  }, [catBasePrice, questions]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Category & Diagnostic Schema Builder Form */}
      <form
        onSubmit={handleSubmit}
        className="lg:col-span-7 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {editingId
                ? isAr
                  ? "تعديل الفئة والاستبيان التشخيصي"
                  : "Edit Category & Diagnostic Schema"
                : isAr
                  ? "إضافة فئة جديدة واستبيان تشخيصي"
                  : "Add Category & Diagnostic Schema"}
            </h2>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
              {isAr
                ? "قم بتعريف قواعد التسعير والضمان وأسئلة الفحص الفني دون الحاجة لتعديل الكود."
                : "Configure base pricing, warranty policies, and dynamic diagnostic rules live."}
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            >
              {isAr ? "إلغاء التعديل" : "Cancel Edit"}
            </button>
          )}
        </div>

        {!isAdmin && (
          <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3.5 py-2.5 text-xs text-amber-900 dark:text-amber-200">
            {isAr
              ? "وضع القراءة فقط: تعديل الفئات متاح لمدير المنصة فقط."
              : "Read-only mode: category configuration requires Platform Manager (Admin) permissions."}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="cat-name-en"
              className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              {isAr ? "اسم الفئة (إنجليزي)" : "Category Name (EN)"}
            </label>
            <input
              id="cat-name-en"
              type="text"
              required
              disabled={!isAdmin}
              placeholder="Category Name (EN)"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-xs disabled:opacity-60"
            />
          </div>
          <div>
            <label
              htmlFor="cat-name-ar"
              className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              {isAr ? "اسم الفئة (عربي)" : "Category Name (AR)"}
            </label>
            <input
              id="cat-name-ar"
              type="text"
              required
              disabled={!isAdmin}
              placeholder="اسم الفئة (AR)"
              value={catNameAr}
              onChange={(e) => setCatNameAr(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-xs disabled:opacity-60"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="cat-base"
              className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              {isAr ? "السعر المرجعي الأساسي (ج.م)" : "Base Reference Price (EGP)"}
            </label>
            <input
              id="cat-base"
              type="number"
              min={0}
              step={100}
              dir="ltr"
              disabled={!isAdmin}
              value={catBasePrice}
              onChange={(e) => setCatBasePrice(Number(e.target.value))}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-xs font-mono tabular-nums disabled:opacity-60"
            />
          </div>
          <div>
            <label
              htmlFor="cat-war"
              className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              {isAr ? "فترة الضمان القياسية (أيام)" : "Standard Warranty (Days)"}
            </label>
            <input
              id="cat-war"
              type="number"
              min={0}
              max={3650}
              dir="ltr"
              disabled={!isAdmin}
              value={catWarrantyDays}
              onChange={(e) => setCatWarrantyDays(Number(e.target.value))}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-xs font-mono tabular-nums disabled:opacity-60"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-5 text-xs text-neutral-800 dark:text-neutral-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              disabled={!isAdmin}
              checked={catBulky}
              onChange={(e) => setCatBulky(e.target.checked)}
            />
            {isAr
              ? "أثاث/أجهزة ضخمة (نقل جماعي وفحص مسبق)"
              : "Bulky Furniture (Batch Truck & Pre-Verification)"}
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              disabled={!isAdmin}
              checked={catWipe}
              onChange={(e) => setCatWipe(e.target.checked)}
            />
            {isAr
              ? "تتطلب مسح البيانات المعتمد (NIST 800-88)"
              : "Requires NIST 800-88 Data Sanitization"}
          </label>
        </div>

        {/* Visual Interactive Diagnostic Question Builder */}
        <div className="space-y-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              {isAr
                ? `منشئ أسئلة التشخيص المرئي (${questions.length})`
                : `Visual Diagnostic Question Builder (${questions.length})`}
            </span>
            {isAdmin && (
              <button
                type="button"
                onClick={handleAddQuestionRow}
                className="rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-2.5 py-1 text-[11px] font-semibold hover:opacity-90 cursor-pointer"
              >
                {isAr ? "+ إضافة سؤال" : "+ Add Question"}
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {questions.map((q, idx) => (
              <div
                key={`${q.id}-${idx}`}
                className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 space-y-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    dir="ltr"
                    disabled={!isAdmin}
                    value={q.id}
                    onChange={(e) =>
                      handleUpdateQuestion(idx, { id: e.target.value })
                    }
                    placeholder="id"
                    className="w-28 rounded border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 py-1 text-[11px] font-mono"
                  />
                  <div className="flex items-center gap-1 text-[11px] text-neutral-600 dark:text-neutral-400">
                    <span>{isAr ? "نسبة الخصم:" : "Deduction:"}</span>
                    <input
                      type="number"
                      min={0}
                      max={85}
                      step={5}
                      dir="ltr"
                      disabled={!isAdmin}
                      value={Math.round(q.deduction_pct * 100)}
                      onChange={(e) =>
                        handleUpdateQuestion(idx, {
                          deduction_pct: Math.min(
                            0.85,
                            Math.max(0, Number(e.target.value) / 100),
                          ),
                        })
                      }
                      className="w-16 rounded border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 py-1 text-[11px] font-mono tabular-nums"
                    />
                    <span>%</span>
                  </div>
                  {isAdmin && questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="ms-auto text-[11px] font-medium text-rose-600 hover:underline cursor-pointer"
                    >
                      {isAr ? "حذف" : "Remove"}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={q.question_en}
                    onChange={(e) =>
                      handleUpdateQuestion(idx, { question_en: e.target.value })
                    }
                    placeholder="English prompt"
                    className="rounded border border-neutral-300 dark:border-neutral-700 bg-transparent px-2.5 py-1.5 text-xs"
                  />
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={q.question_ar}
                    onChange={(e) =>
                      handleUpdateQuestion(idx, { question_ar: e.target.value })
                    }
                    placeholder="السؤال بالعربية"
                    className="rounded border border-neutral-300 dark:border-neutral-700 bg-transparent px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Live Diagnostic Price Range Preview */}
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 text-xs flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-emerald-900 dark:text-emerald-200">
              {isAr ? "معاينة نطاق التسعير التشخيصي:" : "Live Valuation Preview:"}
            </span>
            <div className="flex flex-wrap gap-3 font-mono tabular-nums" dir="ltr">
              <span className="text-emerald-800 dark:text-emerald-300">
                All Pass: {previewMint.best.estimatedMinPrice.toLocaleString()}–
                {previewMint.best.estimatedMaxPrice.toLocaleString()} EGP
              </span>
              <span className="text-amber-800 dark:text-amber-300">
                Max Deductions: {previewMint.worst.estimatedMinPrice.toLocaleString()}–
                {previewMint.worst.estimatedMaxPrice.toLocaleString()} EGP
              </span>
            </div>
          </div>
        </div>

        {/* Raw JSON Schema Editor (Always synced with Visual Builder) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="cat-json"
              className="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
            >
              {isAr
                ? "مخطط أسئلة التشخيص (JSON)"
                : "Diagnostic Questions JSON Schema"}
            </label>
            <button
              type="button"
              onClick={() => setShowRawJson((prev) => !prev)}
              className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              {showRawJson
                ? isAr
                  ? "إخفاء JSON"
                  : "Hide JSON"
                : isAr
                  ? "عرض JSON"
                  : "Show JSON"}
            </button>
          </div>
          {showRawJson && (
            <textarea
              id="cat-json"
              rows={4}
              dir="ltr"
              disabled={!isAdmin}
              value={catJson}
              onChange={(e) => handleJsonChange(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent p-2.5 text-xs font-mono disabled:opacity-60"
            />
          )}
          {jsonError && (
            <p className="text-xs text-rose-600 dark:text-rose-400">
              {jsonError}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending || !isAdmin || Boolean(jsonError)}
          className="rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white transition cursor-pointer"
        >
          {editingId
            ? isAr
              ? "تحديث الفئة الديناميكية"
              : "Update Dynamic Category"
            : isAr
              ? "حفظ الفئة الديناميكية"
              : "Save Dynamic Category"}
        </button>
      </form>

      {/* Active Categories Directory */}
      <div className="lg:col-span-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            {isAr
              ? `الفئات النشطة (${categories.length})`
              : `Active Categories (${categories.length})`}
          </h2>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isAr ? "بحث في الفئات..." : "Filter categories..."}
            className="w-40 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-2.5 py-1.5 text-xs"
          />
        </div>

        <div className="space-y-2.5 max-h-[580px] overflow-y-auto pe-1">
          {filteredCategories.length === 0 ? (
            <p className="text-xs text-neutral-500 py-6 text-center">
              {isAr ? "لا توجد فئات مطابقة." : "No matching categories found."}
            </p>
          ) : (
            filteredCategories.map((c) => {
              const qCount = Array.isArray(c.diagnostic_questions_json)
                ? c.diagnostic_questions_json.length
                : 0;
              const isSelected = editingId === c.category_id;
              return (
                <div
                  key={c.category_id}
                  className={`rounded-lg border p-3.5 text-xs space-y-1.5 transition ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30"
                      : "border-neutral-200 dark:border-neutral-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                      <span>{c.name}</span>
                      <span className="text-neutral-400 mx-1">/</span>
                      <span>{c.name_ar}</span>
                    </div>
                    <span
                      dir="ltr"
                      className="font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400 shrink-0"
                    >
                      {Number(c.base_reference_price).toLocaleString()} EGP
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-neutral-600 dark:text-neutral-400">
                    <span>
                      {isAr
                        ? `الضمان: ${c.warranty_days} يوم • ضخم: ${c.is_bulky ? "نعم" : "لا"} • مسح NIST: ${c.requires_data_wipe ? "إلزامي" : "لا"} • أسئلة: ${qCount}`
                        : `Warranty: ${c.warranty_days}d • Bulky: ${c.is_bulky ? "Yes" : "No"} • NIST Wipe: ${c.requires_data_wipe ? "Mandatory" : "No"} • Qs: ${qCount}`}
                    </span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleLoadCategoryForEdit(c)}
                        className="rounded border border-neutral-300 dark:border-neutral-700 px-2 py-0.5 text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                      >
                        {isAr ? "تعديل" : "Edit"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

