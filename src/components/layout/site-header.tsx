import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { PortalDomainKind } from "@/lib/auth/subdomain";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";

const CUSTOMER_NAV = [
  { href: "/store", key: "store" },
  { href: "/seller", key: "seller" },
  { href: "/login", key: "login" },
] as const;

export function SiteHeader({
  domainKind,
  isAdminSubdomain = false,
}: {
  domainKind?: PortalDomainKind;
  isAdminSubdomain?: boolean;
}) {
  const tBrand = useTranslations("Brand");
  const tNav = useTranslations("Nav");
  const resolvedKind: PortalDomainKind =
    domainKind ?? (isAdminSubdomain ? "admin" : "customer");

  const brandHref =
    resolvedKind === "admin"
      ? "/admin"
      : resolvedKind === "partner"
        ? "/partner"
        : "/";

  return (
    <header className="relative z-40 border-b border-neutral-200 bg-white/95 backdrop-blur-xs dark:border-neutral-800 dark:bg-neutral-950/95">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <Link
          href={brandHref}
          className="text-lg font-bold text-emerald-700 dark:text-emerald-400"
        >
          {tBrand("name")}
        </Link>
        {resolvedKind === "admin" ? (
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link
              href="/admin"
              className="rounded-md px-2.5 py-1 font-medium text-emerald-700 hover:bg-neutral-100 dark:text-emerald-400 dark:hover:bg-neutral-800"
            >
              {tNav("admin")}
            </Link>
          </nav>
        ) : resolvedKind === "partner" ? (
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link
              href="/partner"
              className="rounded-md px-2.5 py-1 font-medium text-emerald-700 hover:bg-neutral-100 dark:text-emerald-400 dark:hover:bg-neutral-800"
            >
              {tNav("partner")}
            </Link>
          </nav>
        ) : (
          <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            {CUSTOMER_NAV.map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                className="rounded-md px-2.5 py-1 font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-emerald-700 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-emerald-400"
              >
                {tNav(key)}
              </Link>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
