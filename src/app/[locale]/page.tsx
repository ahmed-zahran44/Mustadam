import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeroFoldingLaptopBackground } from "@/components/landing/hero-folding-laptop";
import { InteractiveECommerceShowcase } from "@/components/landing/interactive-showcase";
import { Link } from "@/i18n/navigation";
import {
  CURATED_FURNITURE,
  CURATED_LAPTOPS,
} from "@/lib/catalog/laptop-media";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Landing" });
  const isAr = locale === "ar";
  const featuredLaptops = [
    CURATED_LAPTOPS[0],
    CURATED_LAPTOPS[1],
    CURATED_LAPTOPS[10],
    CURATED_LAPTOPS[13],
  ];
  const featuredFurniture = CURATED_FURNITURE.slice(0, 4);
  const marqueeLaptops = [
    ...CURATED_LAPTOPS.slice(0, 4),
    ...CURATED_FURNITURE.slice(0, 4),
  ];

  return (
    <div className="bg-ecommerce-studio relative isolate overflow-hidden space-y-24 pb-24">
      {/* Blurred Atmospheric Mesh & Architectural Studio Grid across the Landing Page */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="bg-ecommerce-grid absolute inset-0" />
        <div className="animate-ambient-orb-1 absolute -top-28 start-[-10%] h-[28rem] w-[28rem] rounded-full bg-emerald-400/25 blur-3xl dark:bg-emerald-500/15" />
        <div className="animate-ambient-orb-2 absolute top-36 end-[-8%] h-[32rem] w-[32rem] rounded-full bg-teal-300/25 blur-3xl dark:bg-teal-500/15" />
        <div className="animate-ambient-orb-1 absolute top-[42%] start-[18%] h-[26rem] w-[26rem] rounded-full bg-amber-300/15 blur-3xl dark:bg-emerald-600/10" />
        <div className="animate-ambient-orb-2 absolute bottom-24 end-[12%] h-[28rem] w-[28rem] rounded-full bg-teal-400/20 blur-3xl dark:bg-emerald-500/15" />
      </div>

      {/* 1. Hero Section — Big Centered Real Laptop Photo Background that Folds Closed on Scroll */}
      <section className="relative isolate overflow-hidden border-b border-neutral-200/70 bg-gradient-to-b from-white/20 via-transparent to-white/40 dark:border-neutral-800/80 dark:from-neutral-950/20 dark:via-transparent dark:to-neutral-950/40">
        <HeroFoldingLaptopBackground locale={locale} />
        <div className="relative z-10 mx-auto max-w-6xl px-6 pt-16 pb-20 text-start">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            {/* Editorial Lead Column with translucent scrim so the big centered folding laptop remains visible behind */}
            <div className="lg:col-span-7 rounded-2xl border border-neutral-200/60 bg-white/70 p-6 backdrop-blur-md dark:border-neutral-800/70 dark:bg-neutral-950/70">
              <h1 className="animate-hero-1 max-w-2xl text-3xl font-extrabold tracking-[-0.025em] leading-[1.12] text-neutral-950 sm:text-5xl dark:text-neutral-50">
                {t("title")}
              </h1>

              <p className="animate-hero-2 mt-5 max-w-[62ch] text-base leading-relaxed text-neutral-700 sm:text-lg dark:text-neutral-300">
                {t("subtitle")}
              </p>

              {/* Primary Action Buttons */}
              <div className="animate-hero-3 mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/store"
                  className="group inline-flex flex-col items-start justify-center rounded-xl bg-emerald-700 px-6 py-3.5 text-white transition duration-300 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  <span className="text-base font-bold transition-transform duration-300 group-hover:-translate-y-0.5">
                    {t("ctaShop")}
                  </span>
                  <span className="text-xs text-emerald-100">{t("ctaShopSub")}</span>
                </Link>

                <Link
                  href="/seller"
                  className="group inline-flex flex-col items-start justify-center rounded-xl border border-neutral-300/90 bg-white/80 backdrop-blur-md px-6 py-3.5 text-neutral-900 transition duration-300 hover:border-emerald-700 hover:bg-white dark:border-neutral-700 dark:bg-neutral-900/80 dark:text-neutral-100 dark:hover:border-emerald-500 dark:hover:bg-neutral-800"
                >
                  <span className="text-base font-bold transition-transform duration-300 group-hover:-translate-y-0.5">
                    {t("ctaSell")}
                  </span>
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">{t("ctaSellSub")}</span>
                </Link>
              </div>
            </div>

            {/* Hero Flagship Hardware Showcase Card */}
            <div className="animate-hero-4 lg:col-span-5">
              <div className="animate-hardware-float">
                <Link
                  href="/store"
                  className="group block rounded-2xl border border-neutral-200/80 bg-white/80 backdrop-blur-xl p-5 transition duration-300 hover:border-emerald-600 dark:border-neutral-800 dark:bg-neutral-900/80 dark:hover:border-emerald-500"
                >
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="rounded-md bg-emerald-700 px-2.5 py-0.5 text-xs font-bold text-white">
                      {t("featuredGradePrefix")} {featuredLaptops[0].grade}
                    </span>
                    <span className="ltr-data font-mono text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                      MST-LAP-001 • NIST SP 800-88
                    </span>
                  </div>

                  <div className="relative my-4 aspect-[4/3] overflow-hidden rounded-xl bg-neutral-100/80 dark:bg-neutral-950/80 border border-neutral-200/60 dark:border-neutral-800">
                    <img
                      src={featuredLaptops[0].images[0]}
                      alt={isAr ? featuredLaptops[0].titleAr : featuredLaptops[0].title}
                      className="animate-hero-photo-1 h-full w-full object-contain p-4 transition duration-500 group-hover:scale-105"
                    />
                    <img
                      src={featuredLaptops[0].images[1]}
                      alt=""
                      aria-hidden="true"
                      className="animate-hero-photo-2 absolute inset-0 h-full w-full object-contain p-4"
                    />
                  </div>

                  <div className="flex items-end justify-between gap-3 pt-2">
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        {featuredLaptops[0].brand}
                      </p>
                      <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                        {isAr ? featuredLaptops[0].titleAr : featuredLaptops[0].title}
                      </h2>
                      <p className="ltr-data text-xs text-neutral-600 dark:text-neutral-400">
                        {featuredLaptops[0].cpu} • {featuredLaptops[0].ram} • {featuredLaptops[0].storage}
                      </p>
                    </div>
                    <div className="text-end">
                      <span className="ltr-data block font-mono text-xl font-extrabold tabular-nums text-emerald-700 dark:text-emerald-400">
                        {featuredLaptops[0].priceEgp.toLocaleString()} EGP
                      </span>
                      <span className="text-xs font-semibold text-neutral-700 group-hover:text-emerald-700 dark:text-neutral-300 dark:group-hover:text-emerald-400">
                        {t("featuredShopItem")} &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Trust Highlights Bar */}
          <div className="mt-14 grid grid-cols-2 gap-6 border-t border-neutral-200/80 pt-8 sm:grid-cols-4 dark:border-neutral-800">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-400">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>{t("badgeNistTitle")}</span>
              </div>
              <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">{t("badgeNistDesc")}</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-400">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{t("badgeWarrantyTitle")}</span>
              </div>
              <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">{t("badgeWarrantyDesc")}</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-400">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{t("badgeGradingTitle")}</span>
              </div>
              <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">{t("badgeGradingDesc")}</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-400">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{t("badgeRecyclingTitle")}</span>
              </div>
              <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">{t("badgeRecyclingDesc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Certified Laptops Showcase */}
      <section className="mx-auto max-w-6xl px-6 text-start">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              {t("featuredBadge")}
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-100">
              {t("featuredTitle")}
            </h2>
            <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
              {t("featuredSubtitle")}
            </p>
          </div>
          <Link
            href="/store"
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700/30 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70"
          >
            <span>{t("featuredViewAll")}</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredLaptops.map((laptop, idx) => (
            <Link
              key={laptop.slug}
              href="/store"
              className="group flex flex-col justify-between rounded-2xl border border-neutral-200/80 bg-white/80 backdrop-blur-md p-4 transition duration-300 hover:border-emerald-600 dark:border-neutral-800 dark:bg-neutral-900/80 dark:hover:border-emerald-500"
            >
              <div className="space-y-3 transition-transform duration-300 group-hover:-translate-y-0.5">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-100/80 dark:bg-neutral-950/80 border border-neutral-200/60 dark:border-neutral-800">
                  <img
                    src={laptop.images[0]}
                    alt={isAr ? laptop.titleAr : laptop.title}
                    loading="lazy"
                    className={`animate-product-levitate ${
                      idx === 1
                        ? "animate-delay-1"
                        : idx === 2
                          ? "animate-delay-2"
                          : idx === 3
                            ? "animate-delay-3"
                            : ""
                    } h-full w-full object-contain p-2 transition duration-500 group-hover:opacity-0 group-hover:scale-105`}
                  />
                  <img
                    src={laptop.images[1]}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-contain p-2 opacity-0 scale-95 transition duration-500 group-hover:opacity-100 group-hover:scale-105"
                  />
                  <span className="absolute top-2 start-2 rounded-md bg-emerald-700/90 px-2 py-0.5 text-[10px] font-bold text-white">
                    {t("featuredGradePrefix")} {laptop.grade}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    {laptop.brand}
                  </span>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 line-clamp-1">
                    {isAr ? laptop.titleAr : laptop.title}
                  </h3>
                  <p className="ltr-data text-[11px] text-neutral-500 dark:text-neutral-400">
                    {laptop.cpu} • {laptop.ram} • {laptop.storage}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
                <span className="ltr-data text-base font-extrabold font-mono text-emerald-700 dark:text-emerald-400">
                  {laptop.priceEgp.toLocaleString()} EGP
                </span>
                <span className="text-xs font-semibold text-neutral-700 group-hover:text-emerald-700 dark:text-neutral-300 dark:group-hover:text-emerald-400">
                  {t("featuredShopItem")} &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Continuous Moving Product Photo Showcase Reel */}
        <div
          dir="ltr"
          className="mt-8 overflow-hidden rounded-[18px] border border-neutral-200/80 bg-white/70 py-4 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/70"
        >
          <div className="animate-product-marquee flex w-max items-center gap-4 px-2">
            {[...marqueeLaptops, ...marqueeLaptops].map((item, idx) => (
              <Link
                key={`${item.slug}-${idx}`}
                href="/store"
                className="group flex w-60 shrink-0 items-center gap-3 rounded-lg border border-neutral-200/70 bg-white/90 p-2.5 transition duration-300 hover:border-emerald-600 dark:border-neutral-800 dark:bg-neutral-950/80 dark:hover:border-emerald-500"
              >
                <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900">
                  <img
                    src={item.images[0]}
                    alt={isAr ? item.titleAr : item.title}
                    loading="lazy"
                    className="h-full w-full object-contain p-1 transition duration-300 group-hover:scale-110"
                  />
                </div>
                <div className="min-w-0 flex-1 text-start">
                  <p className="truncate text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    {isAr ? item.titleAr : item.title}
                  </p>
                  <p className="ltr-data truncate text-[10px] text-neutral-500 dark:text-neutral-400">
                    {item.cpu} • {item.ram}
                  </p>
                  <p className="ltr-data font-mono text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                    {item.priceEgp.toLocaleString()} EGP
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive E-Commerce Bento Studio, Live Activity Ticker & Instant Trade-In Calculator */}
      <InteractiveECommerceShowcase locale={locale} />

      {/* Featured Certified Office & Studio Furniture Showcase */}
      <section className="mx-auto max-w-6xl px-6 text-start">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              {t("furnitureBadge")}
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-100">
              {t("furnitureTitle")}
            </h2>
            <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
              {t("furnitureSubtitle")}
            </p>
          </div>
          <Link
            href="/store"
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700/30 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70"
          >
            <span>{t("featuredViewAll")}</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredFurniture.map((furn, idx) => (
            <Link
              key={furn.slug}
              href="/store"
              className="group flex flex-col justify-between rounded-2xl border border-neutral-200/80 bg-white/80 backdrop-blur-md p-4 transition duration-300 hover:border-emerald-600 dark:border-neutral-800 dark:bg-neutral-900/80 dark:hover:border-emerald-500"
            >
              <div className="space-y-3 transition-transform duration-300 group-hover:-translate-y-0.5">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-100/80 dark:bg-neutral-950/80 border border-neutral-200/60 dark:border-neutral-800">
                  <img
                    src={furn.images[0]}
                    alt={isAr ? furn.titleAr : furn.title}
                    loading="lazy"
                    className={`animate-product-levitate ${
                      idx === 1
                        ? "animate-delay-1"
                        : idx === 2
                          ? "animate-delay-2"
                          : idx === 3
                            ? "animate-delay-3"
                            : ""
                    } h-full w-full object-cover transition duration-500 group-hover:opacity-0 group-hover:scale-105`}
                  />
                  <img
                    src={furn.images[1]}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover opacity-0 scale-95 transition duration-500 group-hover:opacity-100 group-hover:scale-105"
                  />
                  <span className="absolute top-2 start-2 rounded-md bg-emerald-700/90 px-2 py-0.5 text-[10px] font-bold text-white">
                    {t("featuredGradePrefix")} {furn.grade}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    {furn.brand}
                  </span>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 line-clamp-1">
                    {isAr ? furn.titleAr : furn.title}
                  </h3>
                  <p className="ltr-data text-[11px] text-neutral-500 dark:text-neutral-400">
                    {furn.cpu} • {furn.ram}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
                <span className="ltr-data text-base font-extrabold font-mono text-emerald-700 dark:text-emerald-400">
                  {furn.priceEgp.toLocaleString()} EGP
                </span>
                <span className="text-xs font-semibold text-neutral-700 group-hover:text-emerald-700 dark:text-neutral-300 dark:group-hover:text-emerald-400">
                  {t("featuredShopItem")} &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 2. Subsystems & Portal Directory */}
      <section className="mx-auto max-w-6xl px-6 text-start">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            {t("portalsSectionBadge")}
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-100">
            {t("portalsSectionTitle")}
          </h2>
          <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
            {t("portalsSectionSubtitle")}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* 1. Storefront Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs transition hover:border-emerald-600 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-emerald-500">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                  {t("portalStoreBadge")}
                </span>
                <span className="text-emerald-700 dark:text-emerald-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </span>
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {t("portalStoreTitle")}
              </h3>
              <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                {t("portalStoreDesc")}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <Link
                href="/store"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                <span>{t("portalStoreCta")}</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>

          {/* 2. Seller Portal Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs transition hover:border-emerald-600 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-emerald-500">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                  {t("portalSellerBadge")}
                </span>
                <span className="text-emerald-700 dark:text-emerald-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </span>
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {t("portalSellerTitle")}
              </h3>
              <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                {t("portalSellerDesc")}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <Link
                href="/seller"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                <span>{t("portalSellerCta")}</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>

          {/* 3. Corporate B2B Trade-In & Procurement Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs transition hover:border-emerald-600 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-emerald-500">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                  {t("portalCorporateBadge")}
                </span>
                <span className="text-emerald-700 dark:text-emerald-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </span>
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {t("portalCorporateTitle")}
              </h3>
              <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                {t("portalCorporateDesc")}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                <span>{t("portalCorporateCta")}</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Unified Customer Account Gateway */}
      <section className="mx-auto max-w-6xl px-6 text-start">
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-8 shadow-xs sm:p-10 dark:border-neutral-800 dark:bg-neutral-900/60">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="space-y-2 max-w-2xl">
              <h3 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl dark:text-neutral-100">
                {t("authGatewayTitle")}
              </h3>
              <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {t("authGatewaySubtitle")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-800 focus:outline-hidden dark:bg-emerald-600 dark:hover:bg-emerald-700"
              >
                {t("signInBtn")}
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 shadow-xs transition hover:bg-neutral-50 focus:outline-hidden dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
              >
                {t("registerBtn")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Circular Economy Lifecycle Section */}
      <section className="mx-auto max-w-6xl px-6 text-start">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            {t("lifecycleSectionBadge")}
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-100">
            {t("lifecycleSectionTitle")}
          </h2>
          <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
            {t("lifecycleSectionSubtitle")}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Step 1 */}
          <div className="relative rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
            <span className="ltr-data text-3xl font-extrabold text-emerald-600/30 dark:text-emerald-500/20">
              {t("step1Number")}
            </span>
            <h3 className="mt-3 text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {t("step1Title")}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
              {t("step1Desc")}
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
            <span className="ltr-data text-3xl font-extrabold text-emerald-600/30 dark:text-emerald-500/20">
              {t("step2Number")}
            </span>
            <h3 className="mt-3 text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {t("step2Title")}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
              {t("step2Desc")}
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
            <span className="ltr-data text-3xl font-extrabold text-emerald-600/30 dark:text-emerald-500/20">
              {t("step3Number")}
            </span>
            <h3 className="mt-3 text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {t("step3Title")}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
              {t("step3Desc")}
            </p>
          </div>

          {/* Step 4 */}
          <div className="relative rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
            <span className="ltr-data text-3xl font-extrabold text-emerald-600/30 dark:text-emerald-500/20">
              {t("step4Number")}
            </span>
            <h3 className="mt-3 text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {t("step4Title")}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
              {t("step4Desc")}
            </p>
          </div>
        </div>
      </section>

      {/* 5. Platform Trust & Guarantees */}
      <section className="mx-auto max-w-6xl px-6 text-start">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            {t("trustSectionBadge")}
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-100">
            {t("trustSectionTitle")}
          </h2>
          <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
            {t("trustSectionSubtitle")}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Pillar 1 */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {t("pillar1Title")}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
              {t("pillar1Desc")}
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {t("pillar2Title")}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
              {t("pillar2Desc")}
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {t("pillar3Title")}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
              {t("pillar3Desc")}
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {t("pillar4Title")}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
              {t("pillar4Desc")}
            </p>
          </div>

          {/* Pillar 5 */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {t("pillar5Title")}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
              {t("pillar5Desc")}
            </p>
          </div>

          {/* Pillar 6 */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {t("pillar6Title")}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
              {t("pillar6Desc")}
            </p>
          </div>
        </div>
      </section>

      {/* 6. Sustainability & Circular Impact Metrics */}
      <section className="mx-auto max-w-6xl px-6 text-start">
        <div className="rounded-2xl border border-emerald-600/20 bg-emerald-50/50 p-8 shadow-xs sm:p-10 dark:border-emerald-500/30 dark:bg-emerald-950/20">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              {t("impactSectionBadge")}
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-100">
              {t("impactSectionTitle")}
            </h2>
            <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
              {t("impactSectionSubtitle")}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div className="rounded-xl bg-white p-5 shadow-2xs dark:bg-neutral-900">
              <p className="ltr-data text-2xl font-black text-emerald-700 sm:text-3xl dark:text-emerald-400">
                {t("metricLandfillValue")}
              </p>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                {t("metricLandfillLabel")}
              </p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-2xs dark:bg-neutral-900">
              <p className="ltr-data text-2xl font-black text-emerald-700 sm:text-3xl dark:text-emerald-400">
                {t("metricDevicesValue")}
              </p>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                {t("metricDevicesLabel")}
              </p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-2xs dark:bg-neutral-900">
              <p className="ltr-data text-2xl font-black text-emerald-700 sm:text-3xl dark:text-emerald-400">
                {t("metricRecoveryValue")}
              </p>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                {t("metricRecoveryLabel")}
              </p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-2xs dark:bg-neutral-900">
              <p className="ltr-data text-2xl font-black text-emerald-700 sm:text-3xl dark:text-emerald-400">
                {t("metricComplianceValue")}
              </p>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                {t("metricComplianceLabel")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Call To Action Final Banner */}
      <section className="mx-auto max-w-6xl px-6 text-start">
        <div className="rounded-2xl bg-neutral-900 px-8 py-12 text-center text-white shadow-xl dark:bg-neutral-800">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {t("ctaBannerTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-neutral-300">
            {t("ctaBannerSubtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/store"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-500 focus:outline-hidden"
            >
              {t("ctaBannerShop")}
            </Link>
            <Link
              href="/seller"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-700 bg-neutral-950 px-6 py-3 text-sm font-semibold text-neutral-100 shadow-xs transition hover:bg-neutral-900 focus:outline-hidden"
            >
              {t("ctaBannerSell")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
