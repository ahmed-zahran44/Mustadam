import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CURATED_LAPTOPS } from "@/lib/catalog/laptop-media";

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

  return (
    <div className="space-y-20 pb-20">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden border-b border-neutral-200/80 bg-gradient-to-b from-emerald-50/50 via-white to-transparent dark:border-neutral-800 dark:from-emerald-950/20 dark:via-neutral-950 dark:to-transparent">
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-20 text-start">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800 shadow-xs dark:border-emerald-500/30 dark:bg-emerald-950/50 dark:text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
            {t("badge")}
          </div>

          <h1 className="mt-6 max-w-3xl text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl dark:text-neutral-50">
            {t("title")}
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg dark:text-neutral-300">
            {t("subtitle")}
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/store"
              className="inline-flex flex-col items-start justify-center rounded-xl bg-emerald-700 px-6 py-3.5 text-white shadow-md transition hover:bg-emerald-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 dark:bg-emerald-600 dark:hover:bg-emerald-700"
            >
              <span className="text-base font-semibold">{t("ctaShop")}</span>
              <span className="text-xs text-emerald-100 opacity-90">{t("ctaShopSub")}</span>
            </Link>

            <Link
              href="/seller"
              className="inline-flex flex-col items-start justify-center rounded-xl border border-neutral-300 bg-white px-6 py-3.5 text-neutral-800 shadow-xs transition hover:border-emerald-600 hover:bg-neutral-50 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:border-emerald-500 dark:hover:bg-neutral-800"
            >
              <span className="text-base font-semibold">{t("ctaSell")}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">{t("ctaSellSub")}</span>
            </Link>
          </div>

          {/* Trust Highlights Bar */}
          <div className="mt-14 grid grid-cols-2 gap-4 border-t border-neutral-200/80 pt-8 sm:grid-cols-4 dark:border-neutral-800">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>{t("badgeNistTitle")}</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t("badgeNistDesc")}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{t("badgeWarrantyTitle")}</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t("badgeWarrantyDesc")}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{t("badgeGradingTitle")}</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t("badgeGradingDesc")}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{t("badgeRecyclingTitle")}</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t("badgeRecyclingDesc")}</p>
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
          {featuredLaptops.map((laptop) => (
            <Link
              key={laptop.slug}
              href="/store"
              className="group flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs transition hover:border-emerald-600 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-emerald-500"
            >
              <div className="space-y-3">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800">
                  <img
                    src={laptop.images[0]}
                    alt={isAr ? laptop.titleAr : laptop.title}
                    loading="lazy"
                    className="h-full w-full object-contain p-2 transition duration-300 group-hover:scale-105"
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

          {/* 3. Partner Operations Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs transition hover:border-emerald-600 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-emerald-500">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                  {t("portalPartnerBadge")}
                </span>
                <span className="text-emerald-700 dark:text-emerald-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {t("portalPartnerTitle")}
              </h3>
              <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                {t("portalPartnerDesc")}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <Link
                href="/partner"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                <span>{t("portalPartnerCta")}</span>
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
