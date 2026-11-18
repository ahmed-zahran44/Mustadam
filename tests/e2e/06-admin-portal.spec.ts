import { test, expect } from "playwright/test";

test.describe("Suite 6: Admin MIS & Sustainability Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate through the dedicated Admin & MIS subdomain gate
    await page.goto("http://admin.localhost:3000/en/admin/login");
    await page.locator("#admin-login-email").fill("admin@mustadama.eg");
    await page.locator("#admin-login-password").fill("Mustadama2026!");
    await page.locator('[data-testid="admin-login-submit"]').click();
    await expect(page).toHaveURL(/admin\.localhost:3000\/en\/admin$/);
  });

  test("ADMIN-01: Real-time MIS metrics and ESG sustainability indicators", async ({ page }) => {
    await expect(page.locator("h1")).toContainText(/Admin Control Center|Sustainability Dashboard/i);

    // Verify key MIS metric cards in KPIs tab
    await expect(page.getByText(/Total Circular Revenue/i)).toBeVisible();
    await expect(page.getByText(/Avg Profit Margin/i)).toBeVisible();
    await expect(page.getByText(/Seller Offer Acceptance Rate/i)).toBeVisible();

    // Verify 30-60-90 aging inventory breakdown cards
    await expect(page.getByText(/0–30 Days/i)).toBeVisible();
    await expect(page.getByText(/31–60 Days/i)).toBeVisible();
    await expect(page.getByText(/61–90 Days/i)).toBeVisible();
  });

  test("ADMIN-02: Dynamic category schema builder and questionnaire configuration", async ({ page }) => {
    // Switch to Categories & Diagnostics tab
    const catTabBtn = page.getByRole("button", { name: /Categories & Diagnostic Schemas/i });
    await catTabBtn.click();

    // Fill in category fields using placeholders and IDs
    await page.getByPlaceholder("Category Name (EN)").fill("Enterprise Storage Server");
    await page.getByPlaceholder("اسم الفئة (AR)").fill("خادم تخزين المؤسسات");
    await page.locator("#cat-base").fill("45000");

    // Submit new category
    const submitBtn = page.getByRole("button", { name: /Save Dynamic Category/i });
    await submitBtn.click();

    // Verify feedback message confirming schema publication
    await expect(page.getByText(/published successfully/i)).toBeVisible();
  });

  test("ADMIN-03: Customer segmentation campaign dispatch", async ({ page }) => {
    // Switch to Customer Segments & Campaigns tab
    const campTabBtn = page.getByRole("button", { name: /Customer Segments & Campaigns/i });
    await campTabBtn.click();

    // Dispatch targeted campaign to Startup / SME segment
    const dispatchBtn = page.getByRole("button", { name: /Dispatch Targeted Campaign/i });
    await expect(dispatchBtn).toBeVisible();
    await dispatchBtn.click();

    // Feedback confirms campaign dispatched
    await expect(page.getByText(/Targeted campaign dispatched to/i)).toBeVisible();
  });

  test("ADMIN-04: Corporate B2B quote approval workflow", async ({ page }) => {
    // Switch to Corporate B2B Quotes tab
    const quoteTabBtn = page.getByRole("button", { name: /B2B Quotes/i });
    await quoteTabBtn.click();

    // Check if pending quote approvals exist
    const approveBtns = page.getByRole("button", { name: /Approve Quote/i });
    if ((await approveBtns.count()) > 0) {
      await approveBtns.first().click();
      await expect(page.getByText(/approved with/i)).toBeVisible();
    }
  });

  test("ADMIN-05: Customer service warranty claim resolution", async ({ page }) => {
    // Switch to Customer Service Support persona
    const personaSelect = page.locator('select[data-testid="persona-select"]');
    await personaSelect.selectOption("customer-service");
    await expect(page).toHaveURL(/\/admin/);

    // Switch to Warranty Claims tab
    const warrantyTabBtn = page.getByRole("button", { name: /Warranty Claims/i });
    await warrantyTabBtn.click();

    // Check if open claims exist
    const resolveBtns = page.getByRole("button", { name: /Approve & Resolve Claim/i });
    if ((await resolveBtns.count()) > 0) {
      await resolveBtns.first().click();
      await expect(page.getByText(/Warranty claim.*marked resolved/i)).toBeVisible();
    }
  });
});
