"use client";

import { useLocale } from "next-intl";
import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  allocateBatchManifestLogisticsAction,
  completeDismantlingAndHarvestAction,
  completeRefurbishmentTicketAction,
  receiveItemAtWarehouseAction,
  recordRecyclingBatchHandoverAction,
  submitInspectionAndOfferAction,
  updateLogisticsCustodyAction,
} from "@/lib/domain/partner-actions";
import type { ConditionGrade, TechnicalClassification } from "@/types/domain";

interface PartnerItemRow {
  item_serial_id: string;
  title: string;
  barcode: string | null;
  current_status: string;
  category_id: string;
  estimated_min_price: number;
  estimated_max_price: number;
  final_purchase_price: number | null;
  logistics_cost: number;
  refurbishment_cost: number;
  data_wiped_bool: boolean;
  categories?: { name: string; requires_data_wipe: boolean } | null;
}

interface ManifestRow {
  manifest_id: string;
  zone: string;
  scheduled_date: string;
  total_batch_logistics_cost: number;
  status: string;
}

interface RefurbTicketRow {
  refurb_id: string;
  item_serial_id: string;
  work_description: string | null;
  labor_cost: number;
  parts_cost: number;
  status: string;
}

interface DismantleTicketRow {
  dismantle_id: string;
  item_serial_id: string;
  trigger: string;
  status: string;
}

interface SparePartRow {
  part_id: string;
  part_name: string;
  estimated_cost: number;
  status: string;
  source_item_serial_id: string;
}

interface PartnerPortalClientProps {
  activeRole: string;
  items: PartnerItemRow[];
  manifests: ManifestRow[];
  refurbTickets: RefurbTicketRow[];
  dismantleTickets: DismantleTicketRow[];
  spareParts: SparePartRow[];
}

export function PartnerPortalClient({
  activeRole,
  items,
  manifests,
  refurbTickets,
  dismantleTickets,
  spareParts,
}: PartnerPortalClientProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<
    "logistics" | "intake" | "inspection" | "refurb" | "dismantle"
  >("inspection");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Inspection Form State
  const [selectedInspItem, setSelectedInspItem] = useState<string>(
    items.find((i) => i.current_status === "Received_Pending_Inspection")
      ?.item_serial_id ?? "",
  );
  const [classification, setClassification] =
    useState<TechnicalClassification>("Ready_For_Sale");
  const [conditionNotes, setConditionNotes] = useState(
    "Tested motherboard, display, and ports. Passed hardware diagnostics.",
  );
  const [dataWiped, setDataWiped] = useState(true);
  const [finalOfferPrice, setFinalOfferPrice] = useState(7800);

  // Refurbishment Form State
  const [laborCost, setLaborCost] = useState(250);
  const [externalPartsCost] = useState(0);
  const [selectedSparePartId, setSelectedSparePartId] = useState("");
  const [finalGrade, setFinalGrade] = useState<ConditionGrade>("A");
  const [targetSellingPrice, setTargetSellingPrice] = useState(10500);

  // Dismantling Form State
  const [harvestPartName, setHarvestPartName] = useState(
    "16GB DDR4 SODIMM RAM Module",
  );
  const [harvestEstimatedCost, setHarvestEstimatedCost] = useState(450);
  const [scrapType, setScrapType] = useState<
    "E-waste" | "Metal" | "Wood" | "Plastic"
  >("E-waste");
  const [scrapWeight, setScrapWeight] = useState(1.8);

  // Batch Cost State
  const [batchCostInput, setBatchCostInput] = useState(600);

  const logisticsItems = items.filter((i) =>
    ["Submitted", "Awaiting_Handover", "Received_At_Dropoff_Hub"].includes(
      i.current_status,
    ),
  );
  const intakeItems = items.filter(
    (i) => i.current_status === "In_Transit_To_Warehouse",
  );
  const inspectionItems = items.filter(
    (i) => i.current_status === "Received_Pending_Inspection",
  );
  const scrapReadyItems = items.filter(
    (i) => i.current_status === "Scrap_Ready_For_Recycling",
  );

  const handleCustody = (
    itemSerialId: string,
    targetStatus: "Received_At_Dropoff_Hub" | "In_Transit_To_Warehouse",
  ) => {
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      const res = await updateLogisticsCustodyAction({
        itemSerialId,
        targetStatus,
      });
      if (!res.ok) {
        setError(res.error ?? "Failed");
        return;
      }
      setFeedback(`Custody updated to ${targetStatus}`);
      router.refresh();
    });
  };

  const handleBatchAllocation = (manifestId: string) => {
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      const res = await allocateBatchManifestLogisticsAction({
        manifestId,
        totalBatchCost: batchCostInput,
      });
      if (!res.ok) {
        setError(res.error ?? "Failed");
        return;
      }
      const resultObj = res.result as { itemsCount?: number; allocatedCostPerItem?: number } | null;
      setFeedback(
        isAr
          ? `تم توزيع تكلفة النقل المجمع بنجاح (${resultObj?.allocatedCostPerItem ?? 0} ج.م لكل قطعة).`
          : `Batch logistics cost successfully allocated across ${resultObj?.itemsCount ?? 0} items (${resultObj?.allocatedCostPerItem ?? 0} EGP per item).`,
      );
      router.refresh();
    });
  };

  const handleWarehouseIntake = (itemSerialId: string) => {
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      const res = await receiveItemAtWarehouseAction({
        itemSerialId,
        logisticsCost: 150,
      });
      if (!res.ok) {
        setError(res.error ?? "Intake failed");
        return;
      }
      setFeedback(
        `Warehouse Intake complete! Assigned Serial Barcode: ${res.barcode}`,
      );
      router.refresh();
    });
  };

  const handleInspectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInspItem) return;
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      const res = await submitInspectionAndOfferAction({
        itemSerialId: selectedInspItem,
        technicalClassification: classification,
        conditionNotes,
        dataWipedBool: dataWiped,
        finalPurchasePrice: finalOfferPrice,
      });
      if (!res.ok) {
        setError(res.error ?? "Inspection failed");
        return;
      }
      setFeedback(
        `Inspection logged & Final Offer (${finalOfferPrice} EGP) sent! 7-Day (168h) seller decision timer expires at ${new Date(res.offerExpiresAt!).toLocaleString()}.`,
      );
      router.refresh();
    });
  };

  const handleCompleteRefurb = (refurbId: string, itemSerialId: string) => {
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      const res = await completeRefurbishmentTicketAction({
        refurbId,
        itemSerialId,
        workDescription:
          "Completed component replacement, thermal paste & full cleaning",
        laborCost,
        externalPartsCost,
        consumedSparePartId: selectedSparePartId || undefined,
        finalGrade,
        targetSellingPrice,
      });
      if (!res.ok) {
        setError(res.error ?? "Refurbishment failed");
        return;
      }
      setFeedback(
        `Refurbishment closed! Total Unit Cost = ${res.totalUnitCost} EGP | Tier 1 Target Selling Price (35% Markup) = ${res.targetSellingPrice} EGP. Item is now Listed_In_Store (Grade ${finalGrade}).`,
      );
      router.refresh();
    });
  };

  const handleCompleteDismantle = (
    dismantleId: string,
    itemSerialId: string,
  ) => {
    setError(null);
    setFeedback(null);
    const targetItem = items.find((i) => i.item_serial_id === itemSerialId);
    startTransition(async () => {
      const res = await completeDismantlingAndHarvestAction({
        dismantleId,
        itemSerialId,
        categoryId:
          targetItem?.category_id ?? "33333333-3333-3333-3333-333333333301",
        harvestedPartName: harvestPartName,
        harvestedPartEstimatedCost: harvestEstimatedCost,
        scrapMaterialType: scrapType,
        scrapWeightKg: scrapWeight,
      });
      if (!res.ok) {
        setError(res.error ?? "Dismantling failed");
        return;
      }
      setFeedback(
        `Item dismantled! Harvested "${harvestPartName}" (estimated_cost: ${harvestEstimatedCost} EGP) into Spare Parts Inventory and logged ${scrapWeight} kg of ${scrapType} scrap.`,
      );
      router.refresh();
    });
  };

  const handleRecycleHandover = () => {
    if (!scrapReadyItems.length) return;
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      const res = await recordRecyclingBatchHandoverAction({
        recyclerEntityName: "Egypt Green E-Waste & Metals Certified Recycler",
        materialType: "Mixed",
        totalWeightKg: scrapReadyItems.length * 4.5,
        revenueAmount: scrapReadyItems.length * 320,
        itemSerialIds: scrapReadyItems.map((i) => i.item_serial_id),
      });
      if (!res.ok) {
        setError(res.error ?? "Handover failed");
        return;
      }
      setFeedback(
        `Recycling Batch ${res.batchId} handed over! Items transitioned to Recycled_Closed.`,
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
              ? "بوابة عمليات الشركاء والمراكز الفنية"
              : "Partner Operations & Technical Hub"}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Active Role: <strong className="text-emerald-700">{activeRole}</strong>
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "logistics", label: isAr ? "١. الخدمات اللوجستية والشحنات" : "1. Logistics & Shipped Batches" },
            { id: "intake", label: isAr ? "٢. استلام المستودع والباركود" : "2. Warehouse Intake & Barcode" },
            { id: "inspection", label: isAr ? "٣. الفحص الفني ومسح البيانات" : "3. Technical Inspection & Data Sanitization" },
            { id: "refurb", label: isAr ? "٤. التجديد وقطع الغيار" : "4. Refurbishment & Spare Parts" },
            { id: "dismantle", label: isAr ? "٥. التفكيك وإعادة التدوير" : "5. Dismantling & Recycling" },
          ].map((tItem) => (
            <button
              key={tItem.id}
              type="button"
              onClick={() =>
                setTab(
                  tItem.id as
                    | "logistics"
                    | "intake"
                    | "inspection"
                    | "refurb"
                    | "dismantle",
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

      {/* 1. LOGISTICS & EQUAL BATCH LOGISTICS SPLIT */}
      {tab === "logistics" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
            <h2 className="text-base font-bold">
              {isAr
                ? "استلام المندوب ونقاط التسليم"
                : "Courier Pickup & Drop-Off Intake"}
            </h2>
            {logisticsItems.length === 0 ? (
              <p className="text-xs text-neutral-500">
                No items awaiting courier or drop-off custody.
              </p>
            ) : (
              logisticsItems.map((item) => (
                <div
                  key={item.item_serial_id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 dark:border-neutral-800 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-neutral-500">
                      Status: <span className="font-mono">{item.current_status}</span>
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    {item.current_status === "Awaiting_Handover" && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          handleCustody(
                            item.item_serial_id,
                            "Received_At_Dropoff_Hub",
                          )
                        }
                        className="rounded bg-slate-700 hover:bg-slate-600 px-2.5 py-1 text-xs text-white"
                      >
                        Drop-off Hub Scan (QR)
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        handleCustody(
                          item.item_serial_id,
                          "In_Transit_To_Warehouse",
                        )
                      }
                      className="rounded bg-emerald-700 hover:bg-emerald-600 px-2.5 py-1 text-xs text-white"
                    >
                      Dispatch to Warehouse
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
            <h2 className="text-base font-bold">
              {isAr
                ? "توزيع تكلفة النقل المجمع للشحنات الضخمة"
                : "Bulky Batch Logistics Cost Allocation"}
            </h2>
            <p className="text-xs text-neutral-500">
              Formula:{" "}
              <code className="font-mono">
                Allocated_Logistics_Cost = Total_Batch_Cost / Items_Count_In_Batch
              </code>
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="batch-cost" className="text-xs font-medium">
                Total Batch Cost (EGP):
              </label>
              <input
                id="batch-cost"
                type="number"
                dir="ltr"
                value={batchCostInput}
                onChange={(e) => setBatchCostInput(Number(e.target.value))}
                className="w-28 rounded border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 py-1 text-xs font-mono"
              />
            </div>
            {manifests.map((m) => (
              <div
                key={m.manifest_id}
                className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-800 p-3"
              >
                <div className="text-xs">
                  <p className="font-semibold">{m.zone}</p>
                  <p className="text-neutral-500">
                    Date: {m.scheduled_date} • Current Total Cost:{" "}
                    <span dir="ltr" className="font-mono">
                      {Number(m.total_batch_logistics_cost).toLocaleString()} EGP
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleBatchAllocation(m.manifest_id)}
                  className="rounded bg-emerald-700 hover:bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Allocate Equal Batch Cost
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. WAREHOUSE INTAKE & SERIAL BARCODE */}
      {tab === "intake" && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
          <h2 className="text-base font-bold">
            {isAr
              ? "استلام المستودع المركزي وإصدار باركود التتبع الفريد"
              : "Warehouse Intake & Unique Barcode Generation"}
          </h2>
          {intakeItems.length === 0 ? (
            <p className="text-xs text-neutral-500">
              No items currently In_Transit_To_Warehouse.
            </p>
          ) : (
            intakeItems.map((item) => (
              <div
                key={item.item_serial_id}
                className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-800 p-4"
              >
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-xs text-neutral-500 font-mono">
                    ID: {item.item_serial_id}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleWarehouseIntake(item.item_serial_id)}
                  className="rounded-lg bg-emerald-700 hover:bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
                >
                  Confirm Warehouse Receipt & Generate Barcode
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. TECHNICAL INSPECTION, NIST 800-88 DATA WIPE & 7-DAY OFFER */}
      {tab === "inspection" && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-5">
          <h2 className="text-base font-bold">
            {isAr
              ? "الفحص الفني، مسح البيانات المعتمد، وإصدار العرض النهائي (صالح لمدة ٧ أيام)"
              : "Technical Inspection, Data Sanitization & 7-Day Final Offer"}
          </h2>

          {inspectionItems.length === 0 ? (
            <p className="text-xs text-neutral-500">
              No items currently in Received_Pending_Inspection.
            </p>
          ) : (
            <form onSubmit={handleInspectionSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="insp-item"
                    className="block text-xs font-medium mb-1"
                  >
                    Select Item in Inspection Queue
                  </label>
                  <select
                    id="insp-item"
                    value={selectedInspItem}
                    onChange={(e) => setSelectedInspItem(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
                  >
                    {inspectionItems.map((i) => (
                      <option key={i.item_serial_id} value={i.item_serial_id}>
                        {i.title} ({i.barcode ?? i.item_serial_id.slice(0, 8)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="insp-class"
                    className="block text-xs font-medium mb-1"
                  >
                    {isAr ? "التصنيف الفني" : "Technical Classification"}
                  </label>
                  <select
                    id="insp-class"
                    value={classification}
                    onChange={(e) =>
                      setClassification(
                        e.target.value as TechnicalClassification,
                      )
                    }
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
                  >
                    <option value="Ready_For_Sale">
                      Ready_For_Sale (Direct to Storefront on Accept)
                    </option>
                    <option value="Repairable">
                      Repairable (Routes to Refurbishment on Accept)
                    </option>
                    <option value="Irreparable">
                      Irreparable (Routes to Dismantling/Harvesting on Accept)
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="insp-offer"
                    className="block text-xs font-medium mb-1"
                  >
                    {isAr ? "سعر عرض الشراء النهائي (جنيه)" : "Final Purchase Offer Price (EGP)"}
                  </label>
                  <input
                    id="insp-offer"
                    type="number"
                    required
                    dir="ltr"
                    value={finalOfferPrice}
                    onChange={(e) => setFinalOfferPrice(Number(e.target.value))}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm font-mono"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 cursor-pointer w-full">
                    <input
                      type="checkbox"
                      checked={dataWiped}
                      onChange={(e) => setDataWiped(e.target.checked)}
                      className="h-4 w-4 accent-emerald-600"
                    />
                    <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                      {isAr
                        ? "تأكيد مسح البيانات وفق معيار NIST 800-88 وإصدار الشهادة (إلزامي للبيع)"
                        : "Confirm NIST 800-88 Data Destruction & Issue Certificate (Required for Resale)"}
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label
                  htmlFor="insp-notes"
                  className="block text-xs font-medium mb-1"
                >
                  Inspector Condition Notes
                </label>
                <textarea
                  id="insp-notes"
                  rows={2}
                  required
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent p-3 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Submit Inspection & Dispatch 7-Day Offer to Seller
              </button>
            </form>
          )}
        </div>
      )}

      {/* 4. REFURBISHMENT & HARVESTED SPARE PARTS CONSUMPTION */}
      {tab === "refurb" && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-5">
          <h2 className="text-base font-bold">
            {isAr
              ? "منصة التجديد وإدارة قطع الغيار المستخرجة"
              : "Refurbishment Workbench & Spare Parts Inventory"}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-lg bg-neutral-50 dark:bg-neutral-950 p-4 border border-neutral-200 dark:border-neutral-800">
            <div>
              <label
                htmlFor="ref-labor"
                className="block text-xs font-medium mb-1"
              >
                Labor Cost (EGP)
              </label>
              <input
                id="ref-labor"
                type="number"
                dir="ltr"
                value={laborCost}
                onChange={(e) => setLaborCost(Number(e.target.value))}
                className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-xs font-mono"
              />
            </div>

            <div>
              <label
                htmlFor="ref-part"
                className="block text-xs font-medium mb-1"
              >
                {isAr ? "تركيب قطعة غيار مستخرجة" : "Install Harvested Spare Part"}
              </label>
              <select
                id="ref-part"
                value={selectedSparePartId}
                onChange={(e) => setSelectedSparePartId(e.target.value)}
                className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-xs"
              >
                <option value="">-- No Internal Part --</option>
                {spareParts
                  .filter((sp) => sp.status === "Available")
                  .map((sp) => (
                    <option key={sp.part_id} value={sp.part_id}>
                      {sp.part_name} (+{sp.estimated_cost} EGP estimated_cost)
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="ref-grade"
                className="block text-xs font-medium mb-1"
              >
                Final Condition Grade
              </label>
              <select
                id="ref-grade"
                value={finalGrade}
                onChange={(e) =>
                  setFinalGrade(e.target.value as ConditionGrade)
                }
                className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-xs"
              >
                <option value="A">Grade A (Like New)</option>
                <option value="B">Grade B (Very Good)</option>
                <option value="C">Grade C (Functional)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="ref-price"
                className="block text-xs font-medium mb-1"
              >
                Target Selling Price (EGP)
              </label>
              <input
                id="ref-price"
                type="number"
                dir="ltr"
                value={targetSellingPrice}
                onChange={(e) => setTargetSellingPrice(Number(e.target.value))}
                className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-xs font-mono"
              />
            </div>
          </div>

          {refurbTickets.filter((rt) => rt.status === "open").length === 0 ? (
            <p className="text-xs text-neutral-500">
              No open refurbishment tickets.
            </p>
          ) : (
            refurbTickets
              .filter((rt) => rt.status === "open")
              .map((rt) => (
                <div
                  key={rt.refurb_id}
                  className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-800 p-4"
                >
                  <div className="text-xs space-y-1">
                    <p className="font-semibold font-mono">
                      Ticket: {rt.refurb_id.slice(0, 8)} • Item:{" "}
                      {rt.item_serial_id.slice(0, 8)}
                    </p>
                    <p className="text-neutral-500">{rt.work_description}</p>
                  </div>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      handleCompleteRefurb(rt.refurb_id, rt.item_serial_id)
                    }
                    className="rounded-lg bg-emerald-700 hover:bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
                  >
                    Close Ticket, Rollup Cost & List in Store
                  </button>
                </div>
              ))
          )}
        </div>
      )}

      {/* 5. DISMANTLING, SPARE PARTS HARVESTING & RECYCLING */}
      {tab === "dismantle" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
            <h2 className="text-base font-bold">
              {isAr
                ? "منصة التفكيك للقطع غير القابلة للإصلاح واستخراج قطع الغيار"
                : "Dismantling Workbench & Spare Parts Harvesting"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-lg bg-neutral-50 dark:bg-neutral-950 p-4 border border-neutral-200 dark:border-neutral-800">
              <div>
                <label
                  htmlFor="harv-name"
                  className="block text-xs font-medium mb-1"
                >
                  Harvested Spare Part Name
                </label>
                <input
                  id="harv-name"
                  type="text"
                  value={harvestPartName}
                  onChange={(e) => setHarvestPartName(e.target.value)}
                  className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-xs"
                />
              </div>
              <div>
                <label
                  htmlFor="harv-cost"
                  className="block text-xs font-medium mb-1"
                >
                  {isAr ? "القيمة التقديرية للقطعة (جنيه)" : "Part Estimated Value (EGP)"}
                </label>
                <input
                  id="harv-cost"
                  type="number"
                  dir="ltr"
                  value={harvestEstimatedCost}
                  onChange={(e) =>
                    setHarvestEstimatedCost(Number(e.target.value))
                  }
                  className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label
                  htmlFor="scrap-mat"
                  className="block text-xs font-medium mb-1"
                >
                  Scrap Material Category
                </label>
                <select
                  id="scrap-mat"
                  value={scrapType}
                  onChange={(e) =>
                    setScrapType(
                      e.target.value as
                        | "E-waste"
                        | "Metal"
                        | "Wood"
                        | "Plastic",
                    )
                  }
                  className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-xs"
                >
                  <option value="E-waste">E-waste</option>
                  <option value="Metal">Metal</option>
                  <option value="Wood">Wood</option>
                  <option value="Plastic">Plastic</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="scrap-wt"
                  className="block text-xs font-medium mb-1"
                >
                  Scrap Weight (kg)
                </label>
                <input
                  id="scrap-wt"
                  type="number"
                  step="0.1"
                  dir="ltr"
                  value={scrapWeight}
                  onChange={(e) => setScrapWeight(Number(e.target.value))}
                  className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
            </div>

            {dismantleTickets.filter((dt) => dt.status === "open").length ===
            0 ? (
              <p className="text-xs text-neutral-500">
                No open dismantling tickets.
              </p>
            ) : (
              dismantleTickets
                .filter((dt) => dt.status === "open")
                .map((dt) => (
                  <div
                    key={dt.dismantle_id}
                    className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-800 p-4"
                  >
                    <div className="text-xs">
                      <p className="font-semibold font-mono">
                        Dismantle Ticket: {dt.dismantle_id.slice(0, 8)} •
                        Trigger: <strong className="uppercase">{dt.trigger}</strong>
                      </p>
                      <p className="text-neutral-500 font-mono">
                        Item: {dt.item_serial_id}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        handleCompleteDismantle(
                          dt.dismantle_id,
                          dt.item_serial_id,
                        )
                      }
                      className="rounded-lg bg-emerald-700 hover:bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Harvest Part & Transition to Scrap_Ready_For_Recycling
                    </button>
                  </div>
                ))
            )}
          </div>

          {/* Licensed Recycler Handover */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold">
                {isAr
                  ? `تسليم الخردة لمصانع التدوير المرخصة (${scrapReadyItems.length} قطعة جاهزة)`
                  : `Licensed Recycler Batch Handover (${scrapReadyItems.length} Scrap_Ready_For_Recycling items)`}
              </h3>
              <p className="text-xs text-neutral-500">
                {isAr
                  ? "توثيق تسليم المواد والمخلفات إلى مصانع إعادة التدوير المرخصة والمعتمدة."
                  : "Transfers certified scrap materials to licensed recycling facilities for final processing."}
              </p>
            </div>
            <button
              type="button"
              disabled={isPending || scrapReadyItems.length === 0}
              onClick={handleRecycleHandover}
              className="rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white"
            >
              Record Recycler Handover Batch
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
