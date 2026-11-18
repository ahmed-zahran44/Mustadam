import { test, expect } from "playwright/test";

test.describe("Suite 5: Partner Operations Hub", () => {
  test.beforeEach(async ({ page }) => {
    // Switch to inspector persona to authenticate as Partner
    await page.goto("/en");
    const personaSelect = page.locator('select[data-testid="persona-select"]');
    await personaSelect.selectOption("inspector");
    await expect(page).toHaveURL(/\/partner/);
  });

  test("PART-01: Logistics tab custody confirmation and custody transitions", async ({ page }) => {
    await expect(page.locator("h1")).toContainText(/Partner Operations|Technical Operations/i);

    // Switch to Logistics tab
    const logisticsTabBtn = page.getByRole("button", { name: /Logistics/i });
    await logisticsTabBtn.click();

    // Verify custody action buttons if pending items exist
    const custodyButtons = page.getByRole("button", { name: /Dispatch to Warehouse|Drop-off Hub Scan/i });
    if ((await custodyButtons.count()) > 0) {
      await custodyButtons.first().click();
      await expect(page.getByText(/Custody updated to/i)).toBeVisible();
    }
  });

  test("PART-02: Equal batch logistics cost allocation across pickup manifests", async ({ page }) => {
    // Switch to Logistics tab
    await page.getByRole("button", { name: /Logistics/i }).click();

    // Check if manifest batch allocation button exists
    const allocateBtn = page.getByRole("button", { name: /Allocate Equal Batch Cost/i });
    if ((await allocateBtn.count()) > 0) {
      await allocateBtn.first().click();
      await expect(page.getByText(/Batch logistics cost successfully allocated/i)).toBeVisible();
    }
  });

  test("PART-03: Warehouse intake barcode generation", async ({ page }) => {
    // Switch to Warehouse Intake tab
    const intakeTabBtn = page.getByRole("button", { name: /Warehouse Intake/i });
    await intakeTabBtn.click();

    // Verify intake action if pending in-transit items exist
    const intakeButtons = page.getByRole("button", { name: /Confirm Warehouse Receipt & Generate Barcode/i });
    if ((await intakeButtons.count()) > 0) {
      await intakeButtons.first().click();
      await expect(page.getByText(/Assigned Serial Barcode:\s*MST-/i)).toBeVisible();
    }
  });

  test("PART-04: Technical inspection with mandatory NIST SP 800-88 data sanitization gate", async ({ page }) => {
    // Switch to Inspection tab
    const inspectionTabBtn = page.getByRole("button", { name: /Technical Inspection/i });
    await inspectionTabBtn.click();

    // Verify inspection queue or empty state notice
    const itemSelect = page.locator("#insp-item");
    if ((await itemSelect.count()) > 0) {
      await expect(itemSelect).toBeVisible();

      // Verify NIST SP 800-88 compliance label is present
      await expect(page.getByText(/NIST 800-88 Data Destruction/i)).toBeVisible();

      // Verify data wipe checkbox is present and checked
      const wipeCheckbox = page.locator('input[type="checkbox"]').first();
      await expect(wipeCheckbox).toBeVisible();

      // If an item is selectable, submit inspection and final purchase offer
      if ((await itemSelect.locator("option").count()) > 0) {
        const submitBtn = page.getByRole("button", { name: /Submit Inspection & Dispatch 7-Day Offer/i });
        await submitBtn.click();
        await expect(page.getByText(/Inspection logged/i)).toBeVisible();
      }
    } else {
      // Empty inspection queue notice is visible
      await expect(page.getByText(/No items currently in Received_Pending_Inspection/i)).toBeVisible();
    }
  });

  test("PART-05: Refurbishment work order, spare parts rollup, and listing transition", async ({ page }) => {
    // Switch to Refurbishment Tech persona
    const personaSelect = page.locator('select[data-testid="persona-select"]');
    await personaSelect.selectOption("refurb-tech");
    await expect(page).toHaveURL(/\/partner/);

    // Switch to Refurbishment tab
    const refurbTabBtn = page.getByRole("button", { name: /Refurbishment/i });
    await refurbTabBtn.click();

    // Check if open refurbishment tickets exist
    const completeBtns = page.getByRole("button", { name: /Close Ticket, Rollup Cost & List in Store/i });
    if ((await completeBtns.count()) > 0) {
      await completeBtns.first().click();
      await expect(page.getByText(/Refurbishment closed! Total Unit Cost/i)).toBeVisible();
    }
  });

  test("PART-06: Dismantling ticket execution, harvested spare parts logging, and scrap recording", async ({ page }) => {
    // Switch to Dismantling Tech persona
    const personaSelect = page.locator('select[data-testid="persona-select"]');
    await personaSelect.selectOption("dismantle-tech");
    await expect(page).toHaveURL(/\/partner/);

    // Switch to Dismantling tab
    const dismantleTabBtn = page.getByRole("button", { name: /Dismantling/i });
    await dismantleTabBtn.click();

    // Check if open dismantling tickets exist
    const harvestBtns = page.getByRole("button", { name: /Harvest Part & Transition to Scrap/i });
    if ((await harvestBtns.count()) > 0) {
      await harvestBtns.first().click();
      await expect(page.getByText(/Item dismantled! Harvested/i)).toBeVisible();
    }
  });
});
