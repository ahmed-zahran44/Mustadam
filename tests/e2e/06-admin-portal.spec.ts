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

  test("ADMIN-01: Real-time MIS metrics, turnaround time, and ESG sustainability indicators", async ({
    page,
  }) => {
    await expect(page.locator("h1")).toContainText(
      /Admin Control Center|Sustainability Dashboard/i,
    );

    // Verify key MIS metric cards in KPIs tab
    await expect(page.getByText(/Total Circular Revenue/i)).toBeVisible();
    await expect(page.getByText(/Avg Profit Margin/i)).toBeVisible();
    await expect(page.getByText(/Seller Offer Acceptance Rate/i)).toBeVisible();
    await expect(page.getByText(/Avg Turnaround/i)).toBeVisible();

    // Verify 30-60-90 aging inventory breakdown cards
    await expect(page.getByText(/0–30 Days/i)).toBeVisible();
    await expect(page.getByText(/31–60 Days/i)).toBeVisible();
    await expect(page.getByText(/61–90 Days/i)).toBeVisible();
    await expect(page.getByText(/91\+ Days/i)).toBeVisible();

    // Verify visual charts & aging trigger
    await expect(
      page.getByText(/Serialized Item Lifecycle Distribution/i),
    ).toBeVisible();
    await expect(
      page.getByTestId("admin-run-aging-btn"),
    ).toBeVisible();
  });

  test("ADMIN-02: Dynamic category schema builder, visual editor, and edit mode", async ({
    page,
  }) => {
    // Switch to Categories & Diagnostics tab
    const catTabBtn = page.getByRole("tab", {
      name: /Categories & Diagnostic Schemas/i,
    });
    await catTabBtn.click();

    // Fill in category fields using placeholders and IDs
    await page
      .getByPlaceholder("Category Name (EN)")
      .fill("Enterprise Storage Server");
    await page
      .getByPlaceholder("اسم الفئة (AR)")
      .fill("خادم تخزين المؤسسات");
    await page.locator("#cat-base").fill("45000");

    // Verify live valuation preview is shown
    await expect(page.getByText(/Live Valuation Preview/i)).toBeVisible();

    // Submit category (creates or updates cleanly without duplicating)
    const submitBtn = page.getByRole("button", {
      name: /Save Dynamic Category/i,
    });
    await submitBtn.click();

    // Verify feedback message confirming schema publication
    await expect(page.getByText(/published successfully/i)).toBeVisible();

    // Verify existing category can be loaded into Edit mode
    const editButtons = page.getByRole("button", { name: /^Edit$/i });
    await expect(editButtons.first()).toBeVisible();
    await editButtons.first().click();
    await expect(
      page.getByRole("button", { name: /Update Dynamic Category/i }),
    ).toBeVisible();
  });

  test("ADMIN-03: Customer segmentation directory & targeted campaign dispatch", async ({
    page,
  }) => {
    // Switch to Customer Segments & Campaigns tab
    const campTabBtn = page.getByRole("tab", {
      name: /Customer Segments & Campaigns/i,
    });
    await campTabBtn.click();

    // Verify Customer Directory renders registered customers
    await expect(
      page.getByText(/Registered Customer Directory/i),
    ).toBeVisible();

    // Dispatch targeted campaign to Startup / SME segment
    const dispatchBtn = page.getByRole("button", {
      name: /Dispatch Targeted Campaign/i,
    });
    await expect(dispatchBtn).toBeVisible();
    await dispatchBtn.click();

    // Feedback confirms campaign dispatched
    await expect(
      page.getByText(/Targeted campaign dispatched to/i),
    ).toBeVisible();
  });

  test("ADMIN-04: Corporate B2B quote approval workflow", async ({ page }) => {
    // Switch to Corporate B2B Quotes tab
    const quoteTabBtn = page.getByRole("tab", { name: /B2B Quotes/i });
    await quoteTabBtn.click();

    await expect(
      page.getByText(/Corporate Bulk Quote Approval/i),
    ).toBeVisible();

    // Check if pending quote approvals exist
    const approveBtns = page.getByRole("button", { name: /Approve Quote/i });
    if ((await approveBtns.count()) > 0) {
      await approveBtns.first().click();
      await expect(page.getByText(/approved with/i)).toBeVisible();
    }
  });

  test("ADMIN-05: Customer service warranty claim & return authorization workspace", async ({
    page,
  }) => {
    // Switch to Customer Service Support persona
    const personaSelect = page.locator('select[data-testid="persona-select"]');
    await personaSelect.selectOption("customer-service");
    await expect(page).toHaveURL(/admin\.localhost:3000\/en\/admin$/);

    // Customer_Service defaults directly into the Warranty Claims & Return Authorizations tab
    await expect(
      page.getByText(/Customer Service Warranty Claims Queue/i),
    ).toBeVisible();
    await expect(
      page.getByText(/Seller Return Authorizations/i),
    ).toBeVisible();

    // Check if open claims exist
    const resolveBtns = page.getByRole("button", {
      name: /Approve & Resolve Claim/i,
    });
    if ((await resolveBtns.count()) > 0) {
      await resolveBtns.first().click();
      await expect(
        page.getByText(/Warranty claim.*marked resolved/i),
      ).toBeVisible();
    }
  });

  test("ADMIN-06: Operations governance (bulky pre-verification, inventory economics, and audit trail)", async ({
    page,
  }) => {
    const opsTabBtn = page.getByRole("tab", {
      name: /Operations & Audit Trail/i,
    });
    await opsTabBtn.click();

    await expect(
      page.getByText(/Bulky Furniture Pre-Verification Gate/i),
    ).toBeVisible();
    await expect(
      page.getByText(/Serialized Inventory & Unit Economics/i),
    ).toBeVisible();
    await expect(
      page.getByText(/Immutable Lifecycle Audit Log/i),
    ).toBeVisible();
  });
});
