import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let currentLocale = "en";
const enMessages = JSON.parse(readFileSync("messages/en.json", "utf8"));
const arMessages = JSON.parse(readFileSync("messages/ar.json", "utf8"));

vi.mock("next-intl", () => ({
  useLocale: () => currentLocale,
  useTranslations: (namespace: string) => {
    const bundle = currentLocale === "ar" ? arMessages : enMessages;
    const ns = bundle[namespace] ?? {};
    return (key: string) => {
      const val = ns[key];
      if (val === undefined) {
        throw new Error(`Missing translation key: ${namespace}.${key} in locale: ${currentLocale}`);
      }
      return val;
    };
  },
}));

vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
  getTranslations: vi.fn(async ({ locale, namespace }: { locale: string; namespace: string }) => {
    const bundle = locale === "ar" ? arMessages : enMessages;
    const ns = bundle[namespace] ?? {};
    return (key: string) => {
      const val = ns[key];
      if (val === undefined) {
        throw new Error(`Missing translation key: ${namespace}.${key} in locale: ${locale}`);
      }
      return val;
    };
  }),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
    React.createElement("a", { href, ...props }, children),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import HomePage from "@/app/[locale]/page";
import { SiteFooter } from "@/components/layout/site-footer";
import { routing } from "@/i18n/routing";

describe("Adversarial Empirical Verification: Milestone 3 Root Landing Page & Site Footer (Requirement R3)", () => {
  const pageSource = readFileSync("src/app/[locale]/page.tsx", "utf8");
  const footerSource = readFileSync("src/components/layout/site-footer.tsx", "utf8");
  const layoutSource = readFileSync("src/app/[locale]/layout.tsx", "utf8");

  describe("1. Empirical Navigation & Link Completeness", () => {
    const requiredDestinations = [
      "/store",
      "/seller",
      "/login",
      "/register",
    ];

    it("verifies all required customer destinations exist as next-intl Link components in page.tsx", () => {
      // Must import Link from '@/i18n/navigation'
      expect(pageSource).toMatch(/import\s*\{\s*Link\s*\}\s*from\s*["']@\/i18n\/navigation["']/);

      // Verify each required destination appears in href="..."
      for (const dest of requiredDestinations) {
        const regex = new RegExp(`<Link[^>]*href=["']${dest}["']`);
        expect(pageSource).toMatch(regex);
      }
    });

    it("verifies all 6 required destinations exist as next-intl Link components in site-footer.tsx", () => {
      // Must import Link from '@/i18n/navigation'
      expect(footerSource).toMatch(/import\s*\{\s*Link\s*\}\s*from\s*["']@\/i18n\/navigation["']/);

      // Verify each required destination appears in href="..."
      for (const dest of requiredDestinations) {
        const regex = new RegExp(`<Link[^>]*href=["']${dest}["']`);
        expect(footerSource).toMatch(regex);
      }

      // Brand link to root / must also be present
      expect(footerSource).toMatch(/<Link[^>]*href=["']\/["']/);
    });

    it("ensures zero raw <a href> tags are used instead of next-intl Link in page.tsx and site-footer.tsx", () => {
      // Check for <a href= (which bypasses next-intl routing)
      expect(pageSource).not.toMatch(/<a\s+[^>]*href=/);
      expect(footerSource).not.toMatch(/<a\s+[^>]*href=/);
    });

    it("ensures zero dead hrefs, empty anchors, or javascript pseudo-protocols", () => {
      const deadHrefsRegex = /href=["'](#|javascript:|about:|mailto:|tel:|\s*|null|undefined)["']/i;
      expect(pageSource).not.toMatch(deadHrefsRegex);
      expect(footerSource).not.toMatch(deadHrefsRegex);
    });

    it("ensures zero hardcoded locale prefixes in Link hrefs (e.g. /en/... or /ar/...)", () => {
      // Hardcoded locale prefix causes double-prefixing or breaks next-intl dynamic routing
      const hardcodedLocaleRegex = /href=["']\/(en|ar)\//;
      expect(pageSource).not.toMatch(hardcodedLocaleRegex);
      expect(footerSource).not.toMatch(hardcodedLocaleRegex);
    });
  });

  describe("2. Physical Route Destination Integrity (No 404 Targets)", () => {
    it("verifies every internal route targeted by landing page and footer maps to a valid route page.tsx", () => {
      const targetRouteMapping: Record<string, string> = {
        "/": "src/app/[locale]/page.tsx",
        "/store": "src/app/[locale]/(store)/store/page.tsx",
        "/seller": "src/app/[locale]/(seller)/seller/page.tsx",
        "/partner": "src/app/[locale]/(partner)/partner/page.tsx",
        "/admin": "src/app/[locale]/(admin)/admin/page.tsx",
        "/login": "src/app/[locale]/(auth)/login/page.tsx",
        "/register": "src/app/[locale]/(auth)/register/page.tsx",
      };

      for (const [route, expectedFile] of Object.entries(targetRouteMapping)) {
        expect(
          existsSync(join(process.cwd(), expectedFile)),
          `Physical file for route "${route}" must exist at "${expectedFile}"`
        ).toBe(true);
      }
    });

    it("verifies next-intl routing configuration supports both 'en' and 'ar' with defaultLocale 'en'", () => {
      expect(routing.locales).toEqual(["en", "ar"]);
      expect(routing.defaultLocale).toBe("en");
    });
  });

  describe("3. Localization Key Exhaustive AST Extraction & Parity", () => {
    it("ensures every t(...) key called in page.tsx is defined and non-empty in BOTH en and ar dictionaries", () => {
      // Regex to extract all t("keyName") calls from page.tsx
      const callMatches = Array.from(pageSource.matchAll(/\bt\(["']([a-zA-Z0-9_]+)["']\)/g));
      const extractedKeys = Array.from(new Set(callMatches.map((m) => m[1])));

      expect(extractedKeys.length).toBeGreaterThanOrEqual(30);

      const enLanding = enMessages.Landing ?? {};
      const arLanding = arMessages.Landing ?? {};

      for (const key of extractedKeys) {
        expect(
          enLanding[key],
          `Key "${key}" extracted from page.tsx must exist in messages/en.json (Landing)`
        ).toBeDefined();
        expect(
          typeof enLanding[key] === "string" && enLanding[key].trim().length > 0,
          `Key "${key}" in en.json (Landing) must not be empty`
        ).toBe(true);

        expect(
          arLanding[key],
          `Key "${key}" extracted from page.tsx must exist in messages/ar.json (Landing)`
        ).toBeDefined();
        expect(
          typeof arLanding[key] === "string" && arLanding[key].trim().length > 0,
          `Key "${key}" in ar.json (Landing) must not be empty`
        ).toBe(true);
      }
    });

    it("ensures every tFooter(...) and tBrand(...) key called in site-footer.tsx is defined and non-empty in BOTH en and ar dictionaries", () => {
      const footerCalls = Array.from(footerSource.matchAll(/\btFooter\(["']([a-zA-Z0-9_]+)["']\)/g));
      const extractedFooterKeys = Array.from(new Set(footerCalls.map((m) => m[1])));

      expect(extractedFooterKeys.length).toBeGreaterThanOrEqual(7);

      const enFooter = enMessages.Footer ?? {};
      const arFooter = arMessages.Footer ?? {};

      for (const key of extractedFooterKeys) {
        expect(
          enFooter[key],
          `Key "${key}" extracted from site-footer.tsx must exist in messages/en.json (Footer)`
        ).toBeDefined();
        expect(
          typeof enFooter[key] === "string" && enFooter[key].trim().length > 0,
          `Key "${key}" in en.json (Footer) must not be empty`
        ).toBe(true);

        expect(
          arFooter[key],
          `Key "${key}" extracted from site-footer.tsx must exist in messages/ar.json (Footer)`
        ).toBeDefined();
        expect(
          typeof arFooter[key] === "string" && arFooter[key].trim().length > 0,
          `Key "${key}" in ar.json (Footer) must not be empty`
        ).toBe(true);
      }

      const brandCalls = Array.from(footerSource.matchAll(/\btBrand\(["']([a-zA-Z0-9_]+)["']\)/g));
      const extractedBrandKeys = Array.from(new Set(brandCalls.map((m) => m[1])));
      for (const key of extractedBrandKeys) {
        expect(enMessages.Brand?.[key]).toBeDefined();
        expect(arMessages.Brand?.[key]).toBeDefined();
      }
    });
  });

  describe("4. Adversarial Sanitization & Anti-Hallucination Audit", () => {
    it("ensures zero exposed requirement tags (FR-, NFR-, SRS) in landing and footer namespaces", () => {
      const forbiddenPattern = /\b(FR|NFR)-\d+\b|\bSRS\b/i;
      const forbiddenAcademicTerms = ["graduation", "مشروع التخرج", "thesis", "mock requirement"];

      const landingEnStr = JSON.stringify(enMessages.Landing);
      const landingArStr = JSON.stringify(arMessages.Landing);
      const footerEnStr = JSON.stringify(enMessages.Footer);
      const footerArStr = JSON.stringify(arMessages.Footer);

      for (const str of [landingEnStr, landingArStr, footerEnStr, footerArStr]) {
        expect(str).not.toMatch(forbiddenPattern);
        for (const term of forbiddenAcademicTerms) {
          expect(str.toLowerCase()).not.toContain(term.toLowerCase());
        }
      }
    });

    it("ensures zero hardcoded requirement strings in page.tsx and site-footer.tsx source code", () => {
      expect(pageSource).not.toMatch(/\b(FR|NFR)-\d+\b/);
      expect(footerSource).not.toMatch(/\b(FR|NFR)-\d+\b/);
      expect(pageSource.toLowerCase()).not.toContain("graduation demo");
      expect(footerSource.toLowerCase()).not.toContain("graduation demo");
    });
  });

  describe("5. ADR-005 Directional & Bidirectional Class Audit", () => {
    it("ensures page.tsx and site-footer.tsx use strictly logical Tailwind directional utilities", () => {
      const physicalRegex = /\b(ml|mr|pl|pr|left|right)-\d+|\b(text-left|text-right)\b/;
      expect(pageSource).not.toMatch(physicalRegex);
      expect(footerSource).not.toMatch(physicalRegex);
    });

    it("ensures numeric metrics and step numbers use .ltr-data wrapper to prevent RTL corruption", () => {
      // Step numbers: 01, 02, 03, 04
      expect(pageSource).toMatch(/ltr-data[^>]*>\s*\{t\("step1Number"\)\}/);
      expect(pageSource).toMatch(/ltr-data[^>]*>\s*\{t\("step2Number"\)\}/);
      expect(pageSource).toMatch(/ltr-data[^>]*>\s*\{t\("step3Number"\)\}/);
      expect(pageSource).toMatch(/ltr-data[^>]*>\s*\{t\("step4Number"\)\}/);

      // Metrics: landfill, devices, recovery, compliance
      expect(pageSource).toMatch(/ltr-data[^>]*>\s*\{t\("metricLandfillValue"\)\}/);
      expect(pageSource).toMatch(/ltr-data[^>]*>\s*\{t\("metricDevicesValue"\)\}/);
      expect(pageSource).toMatch(/ltr-data[^>]*>\s*\{t\("metricRecoveryValue"\)\}/);
      expect(pageSource).toMatch(/ltr-data[^>]*>\s*\{t\("metricComplianceValue"\)\}/);
    });
  });

  describe("6. Layout Mounting & HTML Static Markup Verification (EN & AR)", () => {
    it("ensures layout.tsx mounts SiteFooter within NextIntlClientProvider after main", () => {
      expect(layoutSource).toContain("<SiteFooter");
      expect(layoutSource).toMatch(/<main\s+className="flex-1">\{children\}<\/main>\s*<SiteFooter\b/);
    });

    it("renders English HomePage static markup without crashing and includes all customer portal & auth links", async () => {
      currentLocale = "en";
      const pageJsx = await HomePage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({}),
      } as PageProps<"/[locale]">);
      const html = renderToStaticMarkup(pageJsx);

      expect(html).toContain('href="/store"');
      expect(html).toContain('href="/seller"');
      expect(html).not.toContain('href="/partner"');
      expect(html).not.toContain('href="/admin"');
      expect(html).toContain('href="/login"');
      expect(html).toContain('href="/register"');

      // Check heading hierarchy
      expect(html).toMatch(/<h1[^>]*>[\s\S]*?<\/h1>/);
      const h2Count = (html.match(/<h2[^>]*>/g) ?? []).length;
      expect(h2Count).toBeGreaterThanOrEqual(4);
    });

    it("renders Arabic HomePage static markup without crashing and includes all customer portal & auth links", async () => {
      currentLocale = "ar";
      const pageJsx = await HomePage({
        params: Promise.resolve({ locale: "ar" }),
        searchParams: Promise.resolve({}),
      } as PageProps<"/[locale]">);
      const html = renderToStaticMarkup(pageJsx);

      expect(html).toContain('href="/store"');
      expect(html).toContain('href="/seller"');
      expect(html).not.toContain('href="/partner"');
      expect(html).not.toContain('href="/admin"');
      expect(html).toContain('href="/login"');
      expect(html).toContain('href="/register"');

      // Verify arabic content
      expect(html).toContain("امنح الإلكترونيات والأثاث حياة ثانية موثقة");
      expect(html).toContain("متجر الأجهزة المعتمدة");
    });

    it("renders SiteFooter static markup in English and Arabic with complete navigation structure", () => {
      currentLocale = "en";
      const enHtml = renderToStaticMarkup(React.createElement(SiteFooter));
      expect(enHtml).toContain('href="/store"');
      expect(enHtml).toContain('href="/seller"');
      expect(enHtml).not.toContain('href="/partner"');
      expect(enHtml).not.toContain('href="/admin"');
      expect(enHtml).toContain('href="/login"');
      expect(enHtml).toContain('href="/register"');
      expect(enHtml).toContain('href="/"');
      expect(enHtml).toContain("Mustadama");

      currentLocale = "ar";
      const arHtml = renderToStaticMarkup(React.createElement(SiteFooter));
      expect(arHtml).toContain('href="/store"');
      expect(arHtml).toContain('href="/seller"');
      expect(arHtml).not.toContain('href="/partner"');
      expect(arHtml).not.toContain('href="/admin"');
      expect(arHtml).toContain('href="/login"');
      expect(arHtml).toContain('href="/register"');
      expect(arHtml).toContain('href="/"');
      expect(arHtml).toContain("مُستدام");
    });
  });
});
