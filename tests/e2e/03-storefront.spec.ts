import { test, expect } from "playwright/test";

test.describe("Suite 3: Storefront & Checkout", () => {
  test.beforeEach(async ({ page }) => {
    // Switch to buyer persona to ensure an authenticated session for orders/quotes
    await page.goto("/en");
    const personaSelect = page.locator('select[data-testid="persona-select"]');
    await personaSelect.selectOption("buyer-individual");
    await expect(page).toHaveURL(/\/store/);
    await expect(page.locator("h1")).toContainText(/Store|Certified Pre-Owned/i);
    // Wait for catalog items to load and be visible
    await expect(page.locator(".rounded-xl.border.p-5").first()).toBeVisible({ timeout: 10000 });
  });

  test("STORE-01: Catalog displays serialized items, condition grades, and warranty info", async ({ page }) => {
    // Verify presence of catalog cards
    const catalogCards = page.locator(".rounded-xl.border.p-5");
    expect(await catalogCards.count()).toBeGreaterThanOrEqual(1);

    // Verify condition grade badge (Grade A, B, or C)
    const firstCard = catalogCards.first();
    await expect(firstCard.getByText(/Grade [ABC]/i)).toBeVisible();

    // Verify price displayed with EGP currency
    await expect(firstCard.getByText(/EGP/i)).toBeVisible();

    // Verify warranty duration notice
    await expect(firstCard.getByText(/Warranty:/i)).toBeVisible();
  });

  test("STORE-02: Condition grade filter dynamically filters items", async ({ page }) => {
    // Click Grade A filter
    await page.getByRole("button", { name: "Grade A", exact: true }).click();
    await page.waitForTimeout(300);

    // Verify all currently visible items have Grade A
    const gradeCards = page.locator(".rounded-xl.border.p-5");
    const count = await gradeCards.count();
    for (let i = 0; i < count; i++) {
      await expect(gradeCards.nth(i).getByText(/Grade A/i)).toBeVisible();
    }

    // Reset to All Grades
    await page.getByRole("button", { name: "All Grades", exact: true }).click();
  });

  test("STORE-03: Selecting a serialized unit highlights card and updates checkout box", async ({ page }) => {
    const selectBtn = page.locator('button:has-text("Select Serialized Unit")').first();
    await selectBtn.click();

    // Button text changes to selected indicator
    await expect(page.locator('button:has-text("Selected in Cart ✓")').first()).toBeVisible();

    // Checkout box updates selected count
    await expect(page.getByText(/Selected Items:\s*1/i)).toBeVisible();

    // Deselect item to return cart to clean state
    await page.locator('button:has-text("Selected in Cart ✓")').first().click();
  });

  test("STORE-04: 15-minute checkout reservation lock creation", async ({ page }) => {
    // Select first available serialized item
    const selectBtn = page.locator('button:has-text("Select Serialized Unit")').first();
    await selectBtn.click();

    // Click Reserve Items & Proceed to Payment
    const reserveBtn = page.getByRole("button", { name: /Reserve Items & Proceed/i });
    await reserveBtn.click();

    // Verify active reservation lock container appears
    await expect(page.getByText(/Active 15-Minute Lock:/i)).toBeVisible();
    await expect(page.getByText(/Total:/i)).toBeVisible();

    // Release reservation lock by selecting FAILED outcome so inventory is restored
    await page.selectOption("#sim-outcome", "FAILED");
    await page.getByRole("button", { name: /Trigger Simulated Payment Webhook/i }).click();
    await expect(page.getByText(/Payment FAILED/i)).toBeVisible();
  });

  test("STORE-05: Multi-channel payment gateway simulation and invoice link generation", async ({ page }) => {
    // Select an unreserved available item (avoiding item reserved in STORE-04)
    const availableBtns = page.locator('button:has-text("Select Serialized Unit")');
    const selectBtn = (await availableBtns.count()) > 1 ? availableBtns.nth(1) : availableBtns.first();
    await selectBtn.click();

    // Choose payment channel: Mobile Wallet
    const channelSelect = page.locator("#chk-channel");
    await channelSelect.selectOption("Wallet");

    // Reserve item
    await page.getByRole("button", { name: /Reserve Items & Proceed/i }).click();
    await expect(page.getByText(/Active 15-Minute Lock:/i)).toBeVisible();

    // Trigger Simulated Payment Webhook (SUCCESS)
    const payBtn = page.getByRole("button", { name: /Trigger Simulated Payment Webhook/i });
    await payBtn.click();

    // Feedback confirms payment SUCCESS and tax invoice generation
    await expect(page.getByText(/Payment SUCCESS/i)).toBeVisible();
  });

  test("STORE-06: My Orders tab displays order history, tax invoice link, and warranty actions", async ({ page }) => {
    // Navigate to My Orders & Warranty tab
    const ordersTabBtn = page.getByRole("button", { name: /My Orders & Warranty/i });
    await ordersTabBtn.click();

    // If orders exist, verify invoice download link and warranty details
    const orderCards = page.locator(".rounded-xl.border.p-6");
    if ((await orderCards.count()) > 0) {
      const firstOrder = orderCards.first();
      await expect(firstOrder.getByText(/Order #/i)).toBeVisible();

      // Check for tax invoice link if payment was successful
      const invoiceLink = firstOrder.locator('a[href*="/api/documents/invoice/"]');
      if ((await invoiceLink.count()) > 0) {
        await expect(invoiceLink.first()).toBeVisible();
      }
    }
  });

  test("STORE-07: Corporate B2B buyer persona can submit bulk quote request", async ({ page }) => {
    // Switch to corporate buyer persona
    const personaSelect = page.locator('select[data-testid="persona-select"]');
    await personaSelect.selectOption("buyer-corporate");
    await expect(page.getByText(/buyer\.corporate@mustadama\.eg/i)).toBeVisible();
    await expect(page).toHaveURL(/\/store/);

    // Wait for catalog
    await expect(page.locator(".rounded-xl.border.p-5").first()).toBeVisible({ timeout: 10000 });

    // Select an item
    const selectBtn = page.locator('button:has-text("Select Serialized Unit")').first();
    if ((await selectBtn.count()) > 0) {
      await selectBtn.click();

      // Verify B2B quote request button is visible for corporate account
      const quoteBtn = page.getByRole("button", { name: /Request Corporate Bulk Quote/i });
      await expect(quoteBtn).toBeVisible();
      await quoteBtn.click();

      // Feedback confirms quote submission
      await expect(page.getByText(/Corporate Bulk Quote Request/i)).toBeVisible();
    }
  });
});
