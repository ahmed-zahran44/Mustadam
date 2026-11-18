import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function SiteFooter({
  isAdminSubdomain = false,
}: {
  isAdminSubdomain?: boolean;
}) {
  const tBrand = useTranslations("Brand");
  const tFooter = useTranslations("Footer");

  if (isAdminSubdomain) {
    return (
      <footer className="border-t border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center text-xs text-neutral-500">
          <p>{tFooter("copyright")}</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <Link
              href="/"
              className="text-lg font-bold text-emerald-700 dark:text-emerald-500"
            >
              {tBrand("name")}
            </Link>
            <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
              {tFooter("tagline")}
            </p>
          </div>

          {/* Marketplace Column */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
              {tFooter("marketplaceHeading")}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/store"
                  className="transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  {tFooter("storeLink")}
                </Link>
              </li>
              <li>
                <Link
                  href="/seller"
                  className="transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  {tFooter("sellerLink")}
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  {tFooter("registerLink")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Operations & Governance Column */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
              {tFooter("operationsHeading")}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/partner"
                  className="transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  {tFooter("partnerLink")}
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  {tFooter("loginLink")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t border-neutral-200/80 pt-6 text-center text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-500">
          <p>{tFooter("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
