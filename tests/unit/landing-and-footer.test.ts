import { readFileSync } from "node:fs";
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
    return (key: string) => ns[key] ?? `${namespace}.${key}`;
  },
}));

vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
  getTranslations: vi.fn(async ({ locale, namespace }: { locale: string; namespace: string }) => {
    const bundle = locale === "ar" ? arMessages : enMessages;
    const ns = bundle[namespace] ?? {};
    return (key: string) => ns[key] ?? `${namespace}.${key}`;
  }),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
    React.createElement("a", { href, ...props }, children),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import HomePage from "@/app/[locale]/page";
import { SiteFooter } from "@/components/layout/site-footer";

describe("Milestone 3: Root Landing Page & Site Footer (Requirement R3)", () => {
  describe("1. Localization Key Parity & Content Sanitization", () => {
    it("ensures Landing and Footer namespaces exist in both en.json and ar.json with 100% key parity", () => {
      const enLandingKeys = Object.keys(enMessages.Landing ?? {}).sort();
      const arLandingKeys = Object.keys(arMessages.Landing ?? {}).sort();
      expect(enLandingKeys.length).toBeGreaterThan(30);
      expect(arLandingKeys).toEqual(enLandingKeys);

      const enFooterKeys = Object.keys(enMessages.Footer ?? {}).sort();
      const arFooterKeys = Object.keys(arMessages.Footer ?? {}).sort();
      expect(enFooterKeys.length).toBeGreaterThanOrEqual(10);
      expect(arFooterKeys).toEqual(enFooterKeys);
    });

    it("ensures zero exposed requirement tags (FR-, NFR-, SRS) in Landing and Footer messages", () => {
      const landingEn = JSON.stringify(enMessages.Landing);
      const landingAr = JSON.stringify(arMessages.Landing);
      const footerEn = JSON.stringify(enMessages.Footer);
      const footerAr = JSON.stringify(arMessages.Footer);

      for (const text of [landingEn, landingAr, footerEn, footerAr]) {
        expect(text).not.toMatch(/\b(FR|NFR)-\d+\b/);
        expect(text).not.toMatch(/\bSRS\b/i);
        expect(text.toLowerCase()).not.toContain("graduation");
        expect(text).not.toContain("مشروع التخرج");
      }
    });
  });

  describe("2. Logical Directional Styling (ADR-005)", () => {
    it("ensures page.tsx and site-footer.tsx do not use physical horizontal directional utilities", () => {
      const pageCode = readFileSync("src/app/[locale]/page.tsx", "utf8");
      const footerCode = readFileSync("src/components/layout/site-footer.tsx", "utf8");
      const physicalRegex = /\b(ml|mr|pl|pr|text-left|text-right)-\d+|\b(text-left|text-right)\b/;

      expect(pageCode).not.toMatch(physicalRegex);
      expect(footerCode).not.toMatch(physicalRegex);
    });

    it("ensures layout.tsx mounts SiteFooter beneath main", () => {
      const layoutCode = readFileSync("src/app/[locale]/layout.tsx", "utf8");
      expect(layoutCode).toContain("<SiteFooter");
      expect(layoutCode).toMatch(/<main[^>]*>[\s\S]*?<\/main>\s*<SiteFooter\b/);
    });
  });

  describe("3. Root Landing Page Component Rendering", () => {
    it("renders HomePage in English with all required portal links, auth links, and sections", async () => {
      currentLocale = "en";
      const paramsPromise = Promise.resolve({ locale: "en" });
      const searchParamsPromise = Promise.resolve({});
      const pageJsx = await HomePage({
        params: paramsPromise,
        searchParams: searchParamsPromise,
      } as PageProps<"/[locale]">);
      const html = renderToStaticMarkup(pageJsx);

      // Hero Section
      expect(html).toContain("Give Electronics &amp; Furniture a Certified Second Life");
      expect(html).toContain('href="/store"');
      expect(html).toContain('href="/seller"');

      // 3 Customer Portal Directory Cards (Partner Operations & Admin MIS are isolated on their own subdomains)
      expect(html).toContain('href="/store"');
      expect(html).toContain('href="/seller"');
      expect(html).toContain("Corporate B2B Programs");
      expect(html).not.toContain('href="/partner"');
      expect(html).not.toContain('href="/admin"');

      // Authentication Controls
      expect(html).toContain('href="/login"');
      expect(html).toContain('href="/register"');

      // 4-Stage Lifecycle
      expect(html).toContain("01");
      expect(html).toContain("Acquire &amp; Collect");
      expect(html).toContain("02");
      expect(html).toContain("Inspect &amp; Sanitize");
      expect(html).toContain("03");
      expect(html).toContain("Refurbish or Harvest");
      expect(html).toContain("04");
      expect(html).toContain("Re-Commerce &amp; Zero Landfill");

      // Sustainability Metrics
      expect(html).toContain("450+ kg");
      expect(html).toContain("1,280+");

      // No exposed requirement tags
      expect(html).not.toMatch(/\b(FR|NFR)-\d+\b/);
    });

    it("renders HomePage in Arabic with full RTL fidelity and accurate translations", async () => {
      currentLocale = "ar";
      const paramsPromise = Promise.resolve({ locale: "ar" });
      const searchParamsPromise = Promise.resolve({});
      const pageJsx = await HomePage({
        params: paramsPromise,
        searchParams: searchParamsPromise,
      } as PageProps<"/[locale]">);
      const html = renderToStaticMarkup(pageJsx);

      // Hero Section (Arabic)
      expect(html).toContain("امنح الإلكترونيات والأثاث حياة ثانية موثقة");
      expect(html).toContain('href="/store"');
      expect(html).toContain('href="/seller"');

      // 3 Customer Portal Directory Cards (Arabic)
      expect(html).toContain("متجر الأجهزة المعتمدة");
      expect(html).toContain("بوابة البائع والتسعير الذكي");
      expect(html).toContain("برامج الشركات والمؤسسات (B2B)");
      expect(html).not.toContain('href="/partner"');
      expect(html).not.toContain('href="/admin"');

      // Auth Controls (Arabic)
      expect(html).toContain("تسجيل الدخول");
      expect(html).toContain("إنشاء حساب جديد");

      // No exposed requirement tags
      expect(html).not.toMatch(/\b(FR|NFR)-\d+\b/);
    });
  });

  describe("4. SiteFooter Component Rendering", () => {
    it("renders SiteFooter in English with all required navigation links and compliance anchors", () => {
      currentLocale = "en";
      const html = renderToStaticMarkup(React.createElement(SiteFooter));

      expect(html).toContain('href="/store"');
      expect(html).toContain('href="/seller"');
      expect(html).not.toContain('href="/partner"');
      expect(html).not.toContain('href="/admin"');
      expect(html).toContain('href="/login"');
      expect(html).toContain('href="/register"');

      expect(html).not.toContain("Standards & Compliance");
      expect(html).not.toContain("Licensed Zero-Landfill Recycling");
      expect(html).toContain("© 2026 Mustadama. All rights reserved.");

      expect(html).not.toMatch(/\b(FR|NFR)-\d+\b/);
    });

    it("renders SiteFooter in Arabic with correct localized text and links", () => {
      currentLocale = "ar";
      const html = renderToStaticMarkup(React.createElement(SiteFooter));

      expect(html).toContain('href="/store"');
      expect(html).toContain('href="/seller"');
      expect(html).not.toContain('href="/partner"');
      expect(html).not.toContain('href="/admin"');
      expect(html).toContain('href="/login"');
      expect(html).toContain('href="/register"');

      expect(html).toContain("متجر الأجهزة المعتمدة");
      expect(html).not.toContain("المعايير والضوابط");
      expect(html).not.toContain("إعادة تدوير مرخصة بدون مكبات");

      expect(html).not.toMatch(/\b(FR|NFR)-\d+\b/);
    });
  });
});
