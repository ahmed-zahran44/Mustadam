"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher() {
  const t = useTranslations("Language");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">{t("label")}</span>
      <select
        value={locale}
        onChange={(e) =>
          router.replace(pathname, {
            locale: e.target.value as (typeof routing.locales)[number],
          })
        }
        className="rounded-md border border-neutral-300 bg-transparent px-2 py-1 dark:border-neutral-700"
      >
        {routing.locales.map((l) => (
          <option key={l} value={l} className="text-black">
            {t(l)}
          </option>
        ))}
      </select>
    </label>
  );
}

