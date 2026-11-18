import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Script from "next/script";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DemoToolbarWrapper } from "@/components/demo/demo-toolbar-wrapper";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { isRtl, routing } from "@/i18n/routing";
import { isAdminSubdomain } from "@/lib/auth/subdomain";
import "../globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const cairo = Cairo({ variable: "--font-cairo", subsets: ["arabic", "latin"] });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Brand" });
  return { title: t("name"), description: t("tagline") };
}

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("mustadama-theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const requestHeaders = await headers();
  const adminHost = isAdminSubdomain(requestHeaders.get("host"));

  return (
    <html
      lang={locale}
      dir={isRtl(locale) ? "rtl" : "ltr"}
      className={`${inter.variable} ${cairo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Script id="mustadama-theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <NextIntlClientProvider>
          <DemoToolbarWrapper />
          <SiteHeader isAdminSubdomain={adminHost} />
          <main className="flex-1">{children}</main>
          <SiteFooter isAdminSubdomain={adminHost} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

