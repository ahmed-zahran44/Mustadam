"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  CURATED_FURNITURE,
  CURATED_LAPTOPS,
} from "@/lib/catalog/laptop-media";

interface InteractiveShowcaseProps {
  locale: string;
}

const TRADE_IN_PRESETS = [
  {
    id: "macbook",
    brand: "Apple MacBook Pro / Air",
    brandAr: "أبل ماك بوك برو / إير",
    baseMin: 21500,
    baseMax: 28500,
    co2Kg: 185,
  },
  {
    id: "dell-xps",
    brand: "Dell XPS / Latitude / G15",
    brandAr: "ديل XPS / لاتيتيود / G15",
    baseMin: 14000,
    baseMax: 24500,
    co2Kg: 160,
  },
  {
    id: "thinkpad",
    brand: "Lenovo ThinkPad X1 / Legion",
    brandAr: "لينوفو ثينك باد X1 / ليجن",
    baseMin: 15500,
    baseMax: 27000,
    co2Kg: 170,
  },
  {
    id: "ergonomic-furniture",
    brand: "Office Chairs & Standing Desks",
    brandAr: "كراسي مكتبية طبية ومكاتب عمل",
    baseMin: 1200,
    baseMax: 3800,
    co2Kg: 140,
  },
] as const;

const CONDITION_MULTIPLIERS = [
  {
    id: "A",
    labelEn: "Grade A • Like New",
    labelAr: "درجة A • كالجديد",
    mult: 1.0,
    descEn: "Flawless screen, >88% battery health, zero chassis dents",
    descAr: "شاشة خالية من الخدوش، بطارية أعلى من ٨٨٪، هيكل ممتاز",
  },
  {
    id: "B",
    labelEn: "Grade B • Certified Good",
    labelAr: "درجة B • حالة جيدة جداً",
    mult: 0.82,
    descEn: "100% functional, minor cosmetic micro-wear on outer shell",
    descAr: "كفاءة تشغيل ١٠٠٪ مع آثار استخدام طفيفة على الهيكل الخارجي",
  },
  {
    id: "C",
    labelEn: "Grade C • Working Eco",
    labelAr: "درجة C • اقتصادي يعمل بكفاءة",
    mult: 0.65,
    descEn: "Verified motherboard & display, visible wear, maximum savings",
    descAr: "لوحة أم وشاشة مفحوصة بالكامل مع أعلى نسبة توفير",
  },
] as const;

const LIVE_ACTIVITY_FEED = [
  {
    cityEn: "New Cairo",
    cityAr: "القاهرة الجديدة",
    textEn: "Apple MacBook Pro 13 passed 25-point inspection & NIST data purge",
    textAr: "اجتاز جهاز أبل ماك بوك برو ١٣ الفحص الفني ومسح البيانات المعتمد",
    tag: "NIST SP 800-88",
  },
  {
    cityEn: "Alexandria",
    cityAr: "الإسكندرية",
    textEn: "Lenovo ThinkPad X1 Carbon Gen 9 reserved with 90-day warranty",
    textAr: "تم حجز لينوفو ثينك باد X1 كاربون مع تفعيل ضمان ٩٠ يوماً",
    tag: "Grade A • -34% vs New",
  },
  {
    cityEn: "Sheikh Zayed",
    cityAr: "الشيخ زايد",
    textEn: "Corporate batch of 12 Dell Latitude 7420 units scheduled for pickup",
    textAr: "جدولة استلام دفعة شركات مكونة من ١٢ جهاز ديل لاتيتيود 7420",
    tag: "B2B Circular Lot",
  },
  {
    cityEn: "Maadi",
    cityAr: "المعادي",
    textEn: "Asus ROG Zephyrus G14 thermal & GPU stress test certified",
    textAr: "اعتماد اختبار الأداء الحراري وكارت الشاشة لجهاز أسوس زيفيروس G14",
    tag: "RTX Certified",
  },
] as const;

export function InteractiveECommerceShowcase({
  locale,
}: InteractiveShowcaseProps) {
  const isAr = locale === "ar";
  const spotlightModels = [
    CURATED_LAPTOPS[0],
    CURATED_LAPTOPS[4],
    CURATED_FURNITURE[0],
    CURATED_FURNITURE[2],
  ];

  const [activeModelIdx, setActiveModelIdx] = useState(0);
  const [activePhotoAngle, setActivePhotoAngle] = useState<0 | 1>(0);
  const [selectedTradeBrand, setSelectedTradeBrand] = useState(0);
  const [selectedCondition, setSelectedCondition] = useState(0);
  const [tickerIdx, setTickerIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIdx((prev) => (prev + 1) % LIVE_ACTIVITY_FEED.length);
    }, 4200);
    return () => clearInterval(timer);
  }, []);

  const currentModel = spotlightModels[activeModelIdx] ?? spotlightModels[0];
  const retailNewPrice = Math.round(currentModel.priceEgp * 1.48);
  const savingsEgp = retailNewPrice - currentModel.priceEgp;
  const savingsPct = Math.round((savingsEgp / retailNewPrice) * 100);

  const preset = TRADE_IN_PRESETS[selectedTradeBrand];
  const cond = CONDITION_MULTIPLIERS[selectedCondition];
  const estMin = Math.round((preset.baseMin * cond.mult) / 100) * 100;
  const estMax = Math.round((preset.baseMax * cond.mult) / 100) * 100;
  const currentActivity = LIVE_ACTIVITY_FEED[tickerIdx];

  return (
    <section className="mx-auto max-w-6xl px-6 text-start space-y-6">
      {/* 1. Live Circular E-Commerce Telemetry Ticker Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-600/20 bg-white/85 px-4 py-2.5 backdrop-blur-md dark:border-emerald-500/25 dark:bg-neutral-900/85">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          </span>
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
            {isAr ? currentActivity.cityAr : currentActivity.cityEn}
          </span>
          <p
            key={tickerIdx}
            className="animate-hero-1 truncate text-xs font-medium text-neutral-700 dark:text-neutral-200"
          >
            {isAr ? currentActivity.textAr : currentActivity.textEn}
          </p>
        </div>
        <span className="ltr-data shrink-0 rounded-full border border-emerald-600/25 bg-emerald-50/80 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/60 dark:text-emerald-300">
          {currentActivity.tag}
        </span>
      </div>

      {/* 2. Interactive Bento Grid: 3D Studio Product Inspector + Instant Trade-In & Savings Calculator */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Bento Left (7 Cols): Interactive Studio Angle & Retail Savings Inspector */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-neutral-200/80 bg-white/85 p-6 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/85 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                {isAr
                  ? "استوديو الفحص التفاعلي وتوفير الأسعار"
                  : "Interactive Hardware Studio & Retail Comparison"}
              </span>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                {isAr ? currentModel.titleAr : currentModel.title}
              </h3>
            </div>
            <span className="ltr-data inline-flex items-center rounded-full bg-emerald-700 px-3 py-1 text-xs font-extrabold text-white">
              {isAr
                ? `وفّر ${savingsPct}% مقارنة بالجديد`
                : `Save ${savingsPct}% vs. Brand New`}
            </span>
          </div>

          {/* Model Switcher Pills */}
          <div className="flex flex-wrap gap-2">
            {spotlightModels.map((m, idx) => (
              <button
                key={m.slug}
                type="button"
                onClick={() => {
                  setActiveModelIdx(idx);
                  setActivePhotoAngle(0);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition duration-200 ${
                  activeModelIdx === idx
                    ? "bg-neutral-900 text-white dark:bg-emerald-600 dark:text-white"
                    : "border border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-emerald-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
                }`}
              >
                {m.brand} • {m.cpu.split("-")[0]}
              </button>
            ))}
          </div>

          {/* Studio Stage with Animated Photo Switcher & Telemetry Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <div className="sm:col-span-7 relative aspect-[4/3] overflow-hidden rounded-xl border border-neutral-200/70 bg-gradient-to-br from-neutral-100 via-white to-emerald-50/40 dark:border-neutral-800 dark:from-neutral-950 dark:via-neutral-900 dark:to-emerald-950/30">
              <img
                key={`${currentModel.slug}-${activePhotoAngle}`}
                src={currentModel.images[activePhotoAngle]}
                alt={isAr ? currentModel.titleAr : currentModel.title}
                className="animate-product-levitate h-full w-full object-contain p-4 transition duration-500"
              />
              <div className="absolute bottom-2.5 start-2.5 flex gap-1.5">
                {[0, 1].map((angle) => (
                  <button
                    key={angle}
                    type="button"
                    onClick={() => setActivePhotoAngle(angle as 0 | 1)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                      activePhotoAngle === angle
                        ? "bg-emerald-700 text-white"
                        : "bg-black/60 text-white hover:bg-black/80"
                    }`}
                  >
                    {isAr ? `زاوية ${angle + 1}` : `Angle ${angle + 1}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-5 space-y-3">
              <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/80 p-3.5 dark:border-neutral-800 dark:bg-neutral-950/70 space-y-1.5">
                <p className="text-[11px] font-semibold text-neutral-500">
                  {isAr ? "سعر مُستدام المعتمد" : "Mustadama Certified Price"}
                </p>
                <p className="ltr-data font-mono text-2xl font-extrabold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {currentModel.priceEgp.toLocaleString()} EGP
                </p>
                <p className="ltr-data font-mono text-xs text-neutral-400 line-through">
                  {isAr ? "سعر الجديد:" : "Retail New:"}{" "}
                  {retailNewPrice.toLocaleString()} EGP
                </p>
                <p className="ltr-data text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {isAr
                    ? `توفير فوري: ${savingsEgp.toLocaleString()} ج.م`
                    : `Instant Savings: ${savingsEgp.toLocaleString()} EGP`}
                </p>
              </div>

              <ul className="space-y-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                  <span className="ltr-data font-medium">
                    {currentModel.cpu} • {currentModel.ram}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                  <span className="ltr-data font-medium">
                    {currentModel.storage} • {currentModel.gpu}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                  <span>
                    {isAr
                      ? "ضمان تسلسلي ٩٠ يوماً + شهادة مسح بيانات"
                      : "90-Day Serialized Warranty + NIST Certificate"}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bento Right (5 Cols): Interactive Trade-In & Condition Estimator */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-neutral-200/80 bg-white/85 p-6 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/85 space-y-5">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              {isAr
                ? "حاسبة التقييم الفوري والأثر البيئي"
                : "Instant Trade-In & Circular Value Estimator"}
            </span>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {isAr
                ? "قدّر قيمة جهازك المستعمل في ثوانٍ"
                : "Estimate Your Device Payout in Seconds"}
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                {isAr ? "١. اختر فئة اللابتوب:" : "1. Select Laptop Series:"}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {TRADE_IN_PRESETS.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedTradeBrand(idx)}
                    className={`rounded-lg px-2.5 py-2 text-start text-xs font-semibold transition ${
                      selectedTradeBrand === idx
                        ? "border border-emerald-600 bg-emerald-50/90 text-emerald-950 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-200"
                        : "border border-neutral-200 bg-neutral-50/70 text-neutral-700 hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
                    }`}
                  >
                    {isAr ? item.brandAr : item.brand}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                {isAr ? "٢. اختر حالة الجهاز:" : "2. Select Condition Tier:"}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {CONDITION_MULTIPLIERS.map((c, idx) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCondition(idx)}
                    className={`rounded-lg px-2 py-2 text-center text-xs font-bold transition ${
                      selectedCondition === idx
                        ? "bg-emerald-700 text-white"
                        : "border border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
                    }`}
                  >
                    Grade {c.id}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                {isAr ? cond.descAr : cond.descEn}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-600/25 bg-emerald-50/70 p-4 dark:border-emerald-500/30 dark:bg-emerald-950/40 space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                {isAr ? "العرض التقديري الفوري:" : "Estimated Instant Offer:"}
              </span>
              <span className="ltr-data font-mono text-lg font-extrabold tabular-nums text-emerald-800 dark:text-emerald-300">
                {estMin.toLocaleString()} – {estMax.toLocaleString()} EGP
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-emerald-800/90 dark:text-emerald-300/90">
              <span>
                {isAr ? "انبعاثات كربونية يتم توفيرها:" : "Carbon Footprint Avoided:"}
              </span>
              <span className="ltr-data font-mono font-bold">
                ~{preset.co2Kg} kg CO₂e
              </span>
            </div>
          </div>

          <div className="flex gap-2.5">
            <Link
              href="/seller"
              className="flex-1 rounded-xl bg-emerald-700 py-2.5 text-center text-xs font-bold text-white transition hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              {isAr ? "ابدأ طلب البيع الآن" : "Lock In Valuation Offer"}
            </Link>
            <Link
              href="/store"
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-center text-xs font-bold text-neutral-800 transition hover:border-emerald-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
            >
              {isAr ? "تصفح المتجر" : "Shop Deals"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

