import { test, expect } from "playwright/test";

test.describe("Suite 1: Root Landing Page & Navigation", () => {
  test("NAV-01: Root route / redirects to localized home page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/(en|ar)(\/)?$/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("NAV-02: Hero section renders title, subtitle, and primary CTAs", async ({ page }) => {
    await page.goto("/en");

    // Brand and headline
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/Give Electronics|Second Life/i);

    // Primary CTAs in hero
    const shopCta = page.locator('main a[href*="/store"]').first();
    const sellCta = page.locator('main a[href*="/seller"]').first();

    await expect(shopCta).toBeVisible();
    await expect(sellCta).toBeVisible();

    // Trust badges in hero
    await expect(page.getByText(/NIST SP 800-88/i).first()).toBeVisible();
    await expect(page.getByText(/Up to 90-Day Warranty/i).first()).toBeVisible();
  });

  test("NAV-03: Subsystems directory links to all 4 portals and auth gateways", async ({ page }) => {
    await page.goto("/en");

    // Subsystems directory section
    const portalsHeading = page.getByRole("heading", { name: /Connected Solutions for Every Circular Stakeholder/i });
    await expect(portalsHeading).toBeVisible();

    // Verify presence of customer & operations subsystem links in main (Admin & MIS is isolated on admin subdomain)
    const main = page.locator("main");
    await expect(main.locator('a[href$="/store"]').first()).toBeVisible();
    await expect(main.locator('a[href$="/seller"]').first()).toBeVisible();
    await expect(main.locator('a[href$="/partner"]').first()).toBeVisible();
    await expect(main.locator('a[href$="/admin"]')).toHaveCount(0);

    // Auth links in main gateway
    await expect(main.locator('a[href$="/login"]').first()).toBeVisible();
    await expect(main.locator('a[href$="/register"]').first()).toBeVisible();
  });

  test("NAV-04: Circular lifecycle pipeline and sustainability metrics render", async ({ page }) => {
    await page.goto("/en");

    const main = page.locator("main");

    // 4-step circular process headings
    await expect(main.getByRole("heading", { name: /Acquire & Collect/i })).toBeVisible();
    await expect(main.getByRole("heading", { name: /Inspect & Sanitize/i })).toBeVisible();
    await expect(main.getByRole("heading", { name: /Refurbish or Harvest/i })).toBeVisible();
    await expect(main.getByRole("heading", { name: /Re-Commerce & Zero Landfill/i })).toBeVisible();

    // Sustainability banner
    await expect(main.getByRole("heading", { name: /Real Impact for Egypt's Environment/i })).toBeVisible();
    await expect(main.getByText(/E-Waste Diverted from Landfills/i)).toBeVisible();
  });

  test("NAV-05: Global SiteFooter renders with portal links and copyright", async ({ page }) => {
    await page.goto("/en");

    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    // Footer columns (using role heading to avoid strict mode collisions with links)
    await expect(footer.getByRole("heading", { name: /Marketplace & Sourcing/i })).toBeVisible();
    await expect(footer.getByRole("heading", { name: /Operations & Governance/i })).toBeVisible();
    await expect(footer.getByRole("heading", { name: /Standards & Compliance/i })).toHaveCount(0);
    await expect(footer.getByText(/Licensed Zero-Landfill Recycling/i)).toHaveCount(0);

    // Copyright statement
    await expect(footer.getByText(/© 2026 Mustadama\. All rights reserved\./i)).toBeVisible();
  });

  test("NAV-06: Bilingual parity and RTL/LTR switching", async ({ page }) => {
    // Start in English
    await page.goto("/en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    // Find and trigger language switcher to Arabic
    const langSelect = page.locator("header select").first();
    await expect(langSelect).toBeVisible();
    await langSelect.selectOption("ar");

    // Wait for URL to update to Arabic
    await expect(page).toHaveURL(/\/ar/);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");

    // Arabic brand name and text visible
    await expect(page.getByText("مُستدام").first()).toBeVisible();

    // Switch back to English
    const arLangSelect = page.locator("header select").first();
    await arLangSelect.selectOption("en");
    await expect(page).toHaveURL(/\/en/);
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("NAV-07: Responsive viewport verification (mobile 375px and desktop 1280px)", async ({ page }) => {
    // 1. Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/en");
    await expect(page.locator("h1")).toBeVisible();

    // Verify no horizontal document overflow on mobile
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // 2. Desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/en");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("NAV-08: Production UI sanitization (zero FR/NFR requirement tags)", async ({ page }) => {
    await page.goto("/en");
    const bodyContent = await page.locator("body").innerText();

    // Verify zero occurrences of internal requirement markers
    expect(bodyContent).not.toMatch(/\bFR-\d{2}\b/i);
    expect(bodyContent).not.toMatch(/\bNFR-\d{2}\b/i);
    expect(bodyContent).not.toMatch(/\[FR-\d{2}\]/i);
  });
});

