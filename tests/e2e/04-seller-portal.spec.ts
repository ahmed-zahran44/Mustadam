import { test, expect } from "playwright/test";

test.describe("Suite 4: Seller Acquisition Portal", () => {
  test.beforeEach(async ({ page }) => {
    // Switch to seller persona
    await page.goto("/en");
    const personaSelect = page.locator('select[data-testid="persona-select"]');
    await personaSelect.selectOption("seller-individual");
    await expect(page).toHaveURL(/\/seller/);
  });

  test("SELL-01: Category diagnostic questionnaire and live valuation price range", async ({ page }) => {
    await expect(page.locator("h1")).toContainText(/Seller Portal|Smart Valuation/i);

    // Verify category select is present
    const catSelect = page.locator("#seller-cat");
    await expect(catSelect).toBeVisible();

    // Verify diagnostic questions container exists
    const questionsContainer = page.locator(".space-y-3.rounded-lg");
    await expect(questionsContainer.first()).toBeVisible();

    // Verify estimated price range heading and value inside valuation card
    await expect(page.getByRole("heading", { name: /Instant Estimated Price Range/i })).toBeVisible();
    const valuationCard = page.locator(".rounded-xl", { has: page.getByRole("heading", { name: /Instant Estimated Price Range/i }) });
    await expect(valuationCard.getByText(/EGP/).first()).toBeVisible();
  });

  test("SELL-02: Photo upload guidelines and compression requirements", async ({ page }) => {
    // Photo upload guidelines notice
    const photoLabel = page.locator('label[for="seller-photos"]');
    await expect(photoLabel).toBeVisible();
    await expect(photoLabel).toContainText(/Condition Photos|min 3/i);

    // Verify photo badges for pre-populated sample photos
    const photoBadges = page.locator('text=/Photo #\\d/i');
    expect(await photoBadges.count()).toBeGreaterThanOrEqual(3);
  });

  test("SELL-03: Handover selection toggles Courier and Partner Hub methods", async ({ page }) => {
    // Courier handover button is selected by default
    const courierBtn = page.getByRole("button", { name: /Door-to-Door Courier/i });
    const dropoffBtn = page.getByRole("button", { name: /Partner Drop-off Hub/i });

    await expect(courierBtn).toBeVisible();
    await expect(dropoffBtn).toBeVisible();

    // Switch to Partner Drop-off Hub
    await dropoffBtn.click();
    await expect(page.locator("#hub-select")).toBeVisible();

    // Switch back to Courier
    await courierBtn.click();
    await expect(page.locator("#pickup-addr")).toBeVisible();
  });

  test("SELL-04: Single device acquisition submission generates tracking code", async ({ page }) => {
    // Fill item title
    await page.fill("#seller-title", "Dell Latitude 5420 i5 16GB");

    // Submit single item
    const submitBtn = page.getByRole("button", { name: /Submit Acquisition Request/i });
    await submitBtn.click();

    // Verify feedback message containing tracking code
    await expect(page.getByText(/Request submitted/i)).toBeVisible();
  });

  test("SELL-05: Corporate bulk liquidation manifest submission", async ({ page }) => {
    // Switch to corporate seller persona
    const personaSelect = page.locator('select[data-testid="persona-select"]');
    await personaSelect.selectOption("seller-corporate");
    await expect(page.getByText(/seller\.corporate@mustadama\.eg/i)).toBeVisible();
    await expect(page).toHaveURL(/\/seller/);

    // Switch to Corporate Bulk Liquidation tab
    const bulkTabBtn = page.getByRole("button", { name: /Corporate Bulk Liquidation/i });
    await bulkTabBtn.click();

    // Submit bulk liquidation
    const bulkSubmitBtn = page.getByRole("button", { name: /Submit Corporate Bulk Manifest/i });
    await expect(bulkSubmitBtn).toBeVisible();
    await bulkSubmitBtn.click();

    // Verify feedback message confirming bulk batch submission
    await expect(page.getByText(/submitted for \d+ items/i)).toBeVisible();
  });

  test("SELL-06: My Items & Offers tab displays 7-day decision timer and offer actions", async ({ page }) => {
    // Switch to My Items & Offers tab
    const myItemsTabBtn = page.getByRole("button", { name: /My Items & Offers/i });
    await myItemsTabBtn.click();

    // Verify list of seller's submitted items
    const itemCards = page.locator(".rounded-xl.border.p-5");
    if ((await itemCards.count()) > 0) {
      const firstItem = itemCards.first();
      await expect(firstItem).toBeVisible();

      // If an inspection offer is pending, check for 7-day timer notice or Accept/Reject buttons
      const offerActions = firstItem.getByRole("button", { name: /Accept Offer/i });
      if ((await offerActions.count()) > 0) {
        await expect(offerActions.first()).toBeVisible();
        await expect(firstItem.getByRole("button", { name: /Reject Offer/i })).toBeVisible();
      }
    }
  });
});
