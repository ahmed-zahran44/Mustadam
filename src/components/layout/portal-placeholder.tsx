import { useTranslations } from "next-intl";

export function PortalPlaceholder({ portal }: { portal: "seller" | "store" | "partner" | "admin" }) {
  const tNav = useTranslations("Nav");
  const t = useTranslations("Portal");

  return (
    <section className="mx-auto max-w-4xl px-6 py-16 text-start">
      <h1 className="text-3xl font-bold">{tNav(portal)}</h1>
      <p className="mt-3 text-neutral-600 dark:text-neutral-300">
        {t("placeholder")}
      </p>
    </section>
  );
}

