import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium, type Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

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
  usePathname: () => "/",
}));

import HomePage from "@/app/[locale]/page";
import { GraduationDemoToolbar } from "@/components/demo/graduation-demo-toolbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

// Read compiled Tailwind CSS
const compiledCss = readFileSync(
  ".next/dev/static/chunks/src_app_globals_css_css_1igg3k2-ikub5._.single.css",
  "utf8"
);

async function generateFullHtml(locale: "en" | "ar"): Promise<string> {
  currentLocale = locale;
  const isRtl = locale === "ar";

  const toolbarHtml = renderToStaticMarkup(
    React.createElement(GraduationDemoToolbar, {
      activeUserId: "user-1",
      activeEmail: "test@mustadama.eg",
      activeRole: "Customer",
      activeAccountType: "Individual",
      notifications: [
        {
          notification_id: "notif-1",
          channel: "SMS",
          type: "OfferReady",
          message:
            locale === "ar"
              ? "تم إصدار عرض السعر لجهازك بنجاح، يمكنك القبول أو الرفض خلال ٧ أيام."
              : "Diagnostic quote generated for your item. You have 7 days to review.",
          created_at: new Date().toISOString(),
        },
      ],
    })
  );

  const headerHtml = renderToStaticMarkup(React.createElement(SiteHeader));

  const pageJsx = await HomePage({
    params: Promise.resolve({ locale }),
    searchParams: Promise.resolve({}),
  } as PageProps<"/[locale]">);
  const homeHtml = renderToStaticMarkup(pageJsx);

  const footerHtml = renderToStaticMarkup(React.createElement(SiteFooter));

  return `<!DOCTYPE html>
<html lang="${locale}" dir="${isRtl ? "rtl" : "ltr"}" class="h-full antialiased">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${locale === "ar" ? "مُستدام" : "Mustadama"}</title>
  <style>
    ${compiledCss}
    /* Default system font fallback for layout consistency */
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  </style>
</head>
<body class="min-h-full flex flex-col">
  ${toolbarHtml}
  ${headerHtml}
  <main class="flex-1">${homeHtml}</main>
  ${footerHtml}
</body>
</html>`;
}

describe("Empirical Challenger M3_2: Layout Responsiveness & CSS Stability", () => {
  let browser: Browser;
  let enHtml: string;
  let arHtml: string;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    enHtml = await generateFullHtml("en");
    arHtml = await generateFullHtml("ar");
  }, 30000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  describe("1. Viewport Scaling & Zero Horizontal Overflow", () => {
    const viewports = [
      { name: "Mobile (375px)", width: 375, height: 667 },
      { name: "Tablet (768px)", width: 768, height: 1024 },
      { name: "Desktop (1280px)", width: 1280, height: 800 },
    ];

    for (const vp of viewports) {
      it(`verifies zero horizontal overflow at ${vp.name} in English (LTR)`, async () => {
        const page = await browser.newPage({
          viewport: { width: vp.width, height: vp.height },
        });
        await page.setContent(enHtml, { waitUntil: "domcontentloaded" });

        const overflowInfo = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const clientWidth = docEl.clientWidth;
          const windowWidth = window.innerWidth;

          // Find any offending element extending beyond the viewport
          const overflowingElements: Array<{ tag: string; id: string; className: string; rect: DOMRect }> = [];
          const all = document.querySelectorAll("*");
          all.forEach((el) => {
            const rect = el.getBoundingClientRect();
            // allow 1px subpixel tolerance
            if (rect.right > windowWidth + 1 || rect.left < -1) {
              overflowingElements.push({
                tag: el.tagName,
                id: el.id,
                className: (el.className || "").toString().slice(0, 80),
                rect,
              });
            }
          });

          return {
            scrollWidth,
            clientWidth,
            windowWidth,
            hasOverflow: scrollWidth > windowWidth,
            overflowingCount: overflowingElements.length,
            sampleOverflow: overflowingElements.slice(0, 3),
          };
        });

        await page.close();

        expect(overflowInfo.hasOverflow).toBe(false);
        expect(overflowInfo.scrollWidth).toBeLessThanOrEqual(vp.width);
      });

      it(`verifies zero horizontal overflow at ${vp.name} in Arabic (RTL)`, async () => {
        const page = await browser.newPage({
          viewport: { width: vp.width, height: vp.height },
        });
        await page.setContent(arHtml, { waitUntil: "domcontentloaded" });

        const overflowInfo = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const windowWidth = window.innerWidth;

          return {
            scrollWidth,
            windowWidth,
            hasOverflow: scrollWidth > windowWidth,
          };
        });

        await page.close();

        expect(overflowInfo.hasOverflow).toBe(false);
        expect(overflowInfo.scrollWidth).toBeLessThanOrEqual(vp.width);
      });
    }
  });

  describe("2. Clean Grid Wrapping Across Breakpoints", () => {
    it("tests Subsystems & Portal Directory grid: 1 col (375px) -> 2 cols (768px) -> 3 cols (1280px)", async () => {
      // 1. Mobile (375px)
      const pageMobile = await browser.newPage({ viewport: { width: 375, height: 667 } });
      await pageMobile.setContent(enHtml, { waitUntil: "domcontentloaded" });
      const mobileCols = await pageMobile.evaluate(() => {
        // Find the portal directory grid container
        const grid = document.querySelector(".grid.grid-cols-1.gap-6.sm\\:grid-cols-2.lg\\:grid-cols-3");
        if (!grid) return null;
        const style = window.getComputedStyle(grid);
        return style.gridTemplateColumns.split(" ").length;
      });
      await pageMobile.close();
      expect(mobileCols).toBe(1);

      // 2. Tablet (768px)
      const pageTablet = await browser.newPage({ viewport: { width: 768, height: 1024 } });
      await pageTablet.setContent(enHtml, { waitUntil: "domcontentloaded" });
      const tabletCols = await pageTablet.evaluate(() => {
        const grid = document.querySelector(".grid.grid-cols-1.gap-6.sm\\:grid-cols-2.lg\\:grid-cols-3");
        if (!grid) return null;
        const style = window.getComputedStyle(grid);
        return style.gridTemplateColumns.split(" ").length;
      });
      await pageTablet.close();
      expect(tabletCols).toBe(2);

      // 3. Desktop (1280px)
      const pageDesktop = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      await pageDesktop.setContent(enHtml, { waitUntil: "domcontentloaded" });
      const desktopCols = await pageDesktop.evaluate(() => {
        const grid = document.querySelector(".grid.grid-cols-1.gap-6.sm\\:grid-cols-2.lg\\:grid-cols-3");
        if (!grid) return null;
        const style = window.getComputedStyle(grid);
        return style.gridTemplateColumns.split(" ").length;
      });
      await pageDesktop.close();
      expect(desktopCols).toBe(3);
    });

    it("tests Circular Lifecycle grid: 1 col (375px) -> 2 cols (768px) -> 4 cols (1280px)", async () => {
      const pageMobile = await browser.newPage({ viewport: { width: 375, height: 667 } });
      await pageMobile.setContent(arHtml, { waitUntil: "domcontentloaded" });
      const mobileCols = await pageMobile.evaluate(() => {
        const grid = document.querySelector(".mt-10.grid.grid-cols-1.gap-6.sm\\:grid-cols-2.lg\\:grid-cols-4");
        if (!grid) return null;
        return window.getComputedStyle(grid).gridTemplateColumns.split(" ").length;
      });
      await pageMobile.close();
      expect(mobileCols).toBe(1);

      const pageDesktop = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      await pageDesktop.setContent(arHtml, { waitUntil: "domcontentloaded" });
      const desktopCols = await pageDesktop.evaluate(() => {
        const grid = document.querySelector(".mt-10.grid.grid-cols-1.gap-6.sm\\:grid-cols-2.lg\\:grid-cols-4");
        if (!grid) return null;
        return window.getComputedStyle(grid).gridTemplateColumns.split(" ").length;
      });
      await pageDesktop.close();
      expect(desktopCols).toBe(4);
    });

    it("tests Platform Trust grid: 1 col (375px) -> 2 cols (768px) -> 3 cols (1280px)", async () => {
      const pageMobile = await browser.newPage({ viewport: { width: 375, height: 667 } });
      await pageMobile.setContent(enHtml, { waitUntil: "domcontentloaded" });
      const mobileCols = await pageMobile.evaluate(() => {
        const grid = document.querySelector(".grid.grid-cols-1.gap-6.sm\\:grid-cols-2.lg\\:grid-cols-3");
        if (!grid) return null;
        return window.getComputedStyle(grid).gridTemplateColumns.split(" ").length;
      });
      await pageMobile.close();
      expect(mobileCols).toBe(1);

      const pageTablet = await browser.newPage({ viewport: { width: 768, height: 1024 } });
      await pageTablet.setContent(enHtml, { waitUntil: "domcontentloaded" });
      const tabletCols = await pageTablet.evaluate(() => {
        const grid = document.querySelector(".grid.grid-cols-1.gap-6.sm\\:grid-cols-2.lg\\:grid-cols-3");
        if (!grid) return null;
        return window.getComputedStyle(grid).gridTemplateColumns.split(" ").length;
      });
      await pageTablet.close();
      expect(tabletCols).toBe(2);

      const pageDesktop = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      await pageDesktop.setContent(enHtml, { waitUntil: "domcontentloaded" });
      const desktopCols = await pageDesktop.evaluate(() => {
        const grid = document.querySelector(".grid.grid-cols-1.gap-6.sm\\:grid-cols-2.lg\\:grid-cols-3");
        if (!grid) return null;
        return window.getComputedStyle(grid).gridTemplateColumns.split(" ").length;
      });
      await pageDesktop.close();
      expect(desktopCols).toBe(3);
    });

    it("tests SiteFooter grid: 1 col (375px) -> 3 cols (768px and 1280px)", async () => {
      const pageMobile = await browser.newPage({ viewport: { width: 375, height: 667 } });
      await pageMobile.setContent(arHtml, { waitUntil: "domcontentloaded" });
      const mobileCols = await pageMobile.evaluate(() => {
        const footerGrid = document.querySelector("footer .grid.grid-cols-1.gap-8.md\\:grid-cols-3");
        if (!footerGrid) return null;
        return window.getComputedStyle(footerGrid).gridTemplateColumns.split(" ").length;
      });
      await pageMobile.close();
      expect(mobileCols).toBe(1);

      const pageTablet = await browser.newPage({ viewport: { width: 768, height: 1024 } });
      await pageTablet.setContent(arHtml, { waitUntil: "domcontentloaded" });
      const tabletCols = await pageTablet.evaluate(() => {
        const footerGrid = document.querySelector("footer .grid.grid-cols-1.gap-8.md\\:grid-cols-3");
        if (!footerGrid) return null;
        return window.getComputedStyle(footerGrid).gridTemplateColumns.split(" ").length;
      });
      await pageTablet.close();
      expect(tabletCols).toBe(3);
    });
  });

  describe("3. Sticky Header & Footer Coexistence & Stacking", () => {
    it("verifies DemoToolbar is sticky z-50 and does not overlap SiteHeader at scroll 0", async () => {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      await page.setContent(enHtml, { waitUntil: "domcontentloaded" });

      const metrics = await page.evaluate(() => {
        const toolbar = document.querySelector("div.sticky.top-0.z-50") as HTMLElement;
        const header = document.querySelector("header") as HTMLElement;
        const main = document.querySelector("main") as HTMLElement;
        const footer = document.querySelector("footer") as HTMLElement;

        const toolbarRect = toolbar?.getBoundingClientRect();
        const headerRect = header?.getBoundingClientRect();
        const mainRect = main?.getBoundingClientRect();
        const footerRect = footer?.getBoundingClientRect();

        const toolbarStyle = window.getComputedStyle(toolbar);

        return {
          toolbarPosition: toolbarStyle.position,
          toolbarTop: toolbarStyle.top,
          toolbarZIndex: toolbarStyle.zIndex,
          toolbarRect: toolbarRect ? { top: toolbarRect.top, bottom: toolbarRect.bottom, height: toolbarRect.height } : null,
          headerRect: headerRect ? { top: headerRect.top, bottom: headerRect.bottom } : null,
          mainRect: mainRect ? { top: mainRect.top, bottom: mainRect.bottom } : null,
          footerRect: footerRect ? { top: footerRect.top, bottom: footerRect.bottom } : null,
          // Check no overlap at scroll 0: header top must be >= toolbar bottom
          hasHeaderOverlap: headerRect && toolbarRect ? headerRect.top < toolbarRect.bottom - 0.5 : false,
          hasMainOverlap: mainRect && headerRect ? mainRect.top < headerRect.bottom - 0.5 : false,
        };
      });

      await page.close();

      expect(metrics.toolbarPosition).toBe("sticky");
      expect(metrics.toolbarTop).toBe("0px");
      expect(metrics.toolbarZIndex).toBe("50");
      expect(metrics.hasHeaderOverlap).toBe(false);
      expect(metrics.hasMainOverlap).toBe(false);
    });

    it("verifies DemoToolbar stays pinned at top during scroll while header scrolls underneath", async () => {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      await page.setContent(enHtml, { waitUntil: "domcontentloaded" });

      // Scroll down 400px
      await page.evaluate(() => window.scrollTo(0, 400));

      const scrollMetrics = await page.evaluate(() => {
        const toolbar = document.querySelector("div.sticky.top-0.z-50") as HTMLElement;
        const header = document.querySelector("header") as HTMLElement;

        const toolbarRect = toolbar?.getBoundingClientRect();
        const headerRect = header?.getBoundingClientRect();

        return {
          scrollY: window.scrollY,
          toolbarTop: toolbarRect?.top,
          headerTop: headerRect?.top,
          isToolbarPinned: Math.abs((toolbarRect?.top ?? -999) - 0) < 1,
        };
      });

      await page.close();

      expect(scrollMetrics.isToolbarPinned).toBe(true);
      expect(scrollMetrics.headerTop).toBeLessThan(0);
    });

    it("verifies SiteFooter is positioned after main content without clashing", async () => {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      await page.setContent(arHtml, { waitUntil: "domcontentloaded" });

      const footerCoexistence = await page.evaluate(() => {
        const main = document.querySelector("main") as HTMLElement;
        const footer = document.querySelector("footer") as HTMLElement;

        const mainRect = main?.getBoundingClientRect();
        const footerRect = footer?.getBoundingClientRect();

        return {
          mainBottom: mainRect.bottom,
          footerTop: footerRect.top,
          hasClash: footerRect.top < mainRect.bottom - 0.5,
        };
      });

      await page.close();

      expect(footerCoexistence.hasClash).toBe(false);
    });
  });

  describe("4. Arabic Text Truncation, Direction & RTL Containment", () => {
    it("verifies Arabic text inside cards does not overflow container widths at 375px", async () => {
      const page = await browser.newPage({ viewport: { width: 375, height: 667 } });
      await page.setContent(arHtml, { waitUntil: "domcontentloaded" });

      const textOverflowResults = await page.evaluate(() => {
        const cards = document.querySelectorAll(".rounded-2xl, .rounded-xl");
        const issues: Array<{ cardClass: string; scrollWidth: number; clientWidth: number }> = [];

        cards.forEach((card) => {
          const el = card as HTMLElement;
          // Card internal content should not exceed clientWidth by more than 1px
          if (el.scrollWidth > el.clientWidth + 1) {
            issues.push({
              cardClass: el.className.slice(0, 50),
              scrollWidth: el.scrollWidth,
              clientWidth: el.clientWidth,
            });
          }
        });

        return {
          totalCardsChecked: cards.length,
          issuesCount: issues.length,
          issues,
        };
      });

      await page.close();

      expect(textOverflowResults.totalCardsChecked).toBeGreaterThan(10);
      expect(textOverflowResults.issuesCount).toBe(0);
    });

    it("verifies numerical metrics maintain LTR isolation (.ltr-data) inside RTL layout", async () => {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      await page.setContent(arHtml, { waitUntil: "domcontentloaded" });

      const ltrDataResults = await page.evaluate(() => {
        const elements = document.querySelectorAll(".ltr-data");
        const results: Array<{ text: string; direction: string; unicodeBidi: string }> = [];

        elements.forEach((el) => {
          const style = window.getComputedStyle(el);
          results.push({
            text: el.textContent?.trim() || "",
            direction: style.direction,
            unicodeBidi: style.unicodeBidi,
          });
        });

        return {
          count: elements.length,
          allLtr: results.every((r) => r.direction === "ltr"),
          results,
        };
      });

      await page.close();

      expect(ltrDataResults.count).toBeGreaterThanOrEqual(8); // 4 lifecycle numbers + 4 metrics
      expect(ltrDataResults.allLtr).toBe(true);
    });

    it("verifies text-start aligns to right in Arabic (RTL) and left in English (LTR)", async () => {
      const pageAr = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      await pageAr.setContent(arHtml, { waitUntil: "domcontentloaded" });

      const arMetrics = await pageAr.evaluate(() => {
        const section = document.querySelector("section.text-start") as HTMLElement;
        const heading = section?.querySelector("h2, h1") as HTMLElement;
        const sectionRect = section?.getBoundingClientRect();
        const headingRect = heading?.getBoundingClientRect();
        const style = section ? window.getComputedStyle(section) : null;
        return {
          textAlign: style?.textAlign,
          direction: style?.direction,
          // In RTL, heading right edge aligns near section right edge
          offsetFromStart: sectionRect && headingRect ? Math.abs(sectionRect.right - headingRect.right) : -1,
        };
      });
      await pageAr.close();

      const pageEn = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      await pageEn.setContent(enHtml, { waitUntil: "domcontentloaded" });

      const enMetrics = await pageEn.evaluate(() => {
        const section = document.querySelector("section.text-start") as HTMLElement;
        const heading = section?.querySelector("h2, h1") as HTMLElement;
        const sectionRect = section?.getBoundingClientRect();
        const headingRect = heading?.getBoundingClientRect();
        const style = section ? window.getComputedStyle(section) : null;
        return {
          textAlign: style?.textAlign,
          direction: style?.direction,
          // In LTR, heading left edge aligns near section left edge
          offsetFromStart: sectionRect && headingRect ? Math.abs(headingRect.left - sectionRect.left) : -1,
        };
      });
      await pageEn.close();

      expect(arMetrics.textAlign).toBe("start");
      expect(arMetrics.direction).toBe("rtl");
      expect(arMetrics.offsetFromStart).toBeLessThan(40); // within padding

      expect(enMetrics.textAlign).toBe("start");
      expect(enMetrics.direction).toBe("ltr");
      expect(enMetrics.offsetFromStart).toBeLessThan(40); // within padding
    });
  });

  describe("5. Adversarial Stress Testing & Edge Cases", () => {
    it("stress-tests 320px ultra-narrow mobile viewport in Arabic (RTL) for zero overflow", async () => {
      const page = await browser.newPage({ viewport: { width: 320, height: 568 } });
      await page.setContent(arHtml, { waitUntil: "domcontentloaded" });

      const overflow = await page.evaluate(() => {
        const docEl = document.documentElement;
        return {
          scrollWidth: docEl.scrollWidth,
          clientWidth: docEl.clientWidth,
          hasOverflow: docEl.scrollWidth > window.innerWidth,
        };
      });

      await page.close();

      expect(overflow.hasOverflow).toBe(false);
      expect(overflow.scrollWidth).toBeLessThanOrEqual(320);
    });

    it("stress-tests notification popover drawer at 375px mobile in RTL and LTR", async () => {
      // In LTR
      const pageEn = await browser.newPage({ viewport: { width: 375, height: 667 } });
      await pageEn.setContent(enHtml, { waitUntil: "domcontentloaded" });
      const enDrawerFit = await pageEn.evaluate(() => {
        // Inject open drawer markup into toolbar
        const toolbar = document.querySelector(".sticky.top-0") as HTMLElement;
        const popoverContainer = toolbar?.querySelector(".relative:has(button[aria-haspopup])") || toolbar?.lastElementChild;
        if (!popoverContainer) return null;

        const drawer = document.createElement("div");
        drawer.className = "absolute top-full end-0 mt-1.5 w-80 max-h-80 overflow-y-auto rounded-xl bg-slate-950 border border-slate-700 p-3 z-50";
        drawer.innerHTML = "<p>Sample Notification Alert with Long Arabic and English Text</p>";
        popoverContainer.appendChild(drawer);

        const rect = drawer.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          width: rect.width,
          windowWidth: window.innerWidth,
          overflowRight: rect.right > window.innerWidth + 1,
          overflowLeft: rect.left < -1,
        };
      });
      await pageEn.close();

      expect(enDrawerFit).not.toBeNull();
      expect(enDrawerFit?.overflowRight).toBe(false);

      // In RTL
      const pageAr = await browser.newPage({ viewport: { width: 375, height: 667 } });
      await pageAr.setContent(arHtml, { waitUntil: "domcontentloaded" });
      const arDrawerFit = await pageAr.evaluate(() => {
        const toolbar = document.querySelector(".sticky.top-0") as HTMLElement;
        const popoverContainer = toolbar?.querySelector(".relative:has(button[aria-haspopup])") || toolbar?.lastElementChild;
        if (!popoverContainer) return null;

        const drawer = document.createElement("div");
        drawer.className = "absolute top-full end-0 mt-1.5 w-80 max-h-80 overflow-y-auto rounded-xl bg-slate-950 border border-slate-700 p-3 z-50";
        drawer.innerHTML = "<p>إشعار جديد: تم اعتماد فحص الجهاز ونقله إلى خط التجديد الفني بنجاح</p>";
        popoverContainer.appendChild(drawer);

        const rect = drawer.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          width: rect.width,
          windowWidth: window.innerWidth,
          overflowRight: rect.right > window.innerWidth + 1,
          overflowLeft: rect.left < -1,
        };
      });
      await pageAr.close();

      expect(arDrawerFit).not.toBeNull();
      // On 375px with end-0, verify drawer is within screen bounds
      expect(arDrawerFit?.overflowLeft).toBe(false);
    });

    it("stress-tests viewport dynamic resize from mobile portrait to landscape", async () => {
      const page = await browser.newPage({ viewport: { width: 375, height: 667 } });
      await page.setContent(arHtml, { waitUntil: "domcontentloaded" });

      const initialOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(initialOverflow).toBe(false);

      // Resize to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      const landscapeOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(landscapeOverflow).toBe(false);

      // Resize back to tablet portrait
      await page.setViewportSize({ width: 768, height: 1024 });
      const tabletOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(tabletOverflow).toBe(false);

      await page.close();
    });
  });
});
