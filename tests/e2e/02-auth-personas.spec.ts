import { test, expect } from "playwright/test";

test.describe("Suite 2: Role Simulation & Authentication", () => {
  test("AUTH-01: Demo toolbar renders with single consolidated persona dropdown", async ({ page }) => {
    await page.goto("/en");

    // The single consolidated persona selector dropdown
    const personaSelect = page.locator('select[data-testid="persona-select"]');
    await expect(personaSelect).toBeVisible();

    // Verify option groups exist: Customers, Operations & Logistics, Governance & Admin
    const optgroups = personaSelect.locator("optgroup");
    expect(await optgroups.count()).toBeGreaterThanOrEqual(3);

    // Verify all 12 personas are present in the dropdown options
    const options = personaSelect.locator("option");
    expect(await options.count()).toBeGreaterThanOrEqual(12);
  });

  test("AUTH-02: Persona switching to Customer personas and automatic redirection", async ({ page }) => {
    await page.goto("/en");

    const personaSelect = page.locator('select[data-testid="persona-select"]');

    // 1. Switch to Individual Seller
    await personaSelect.selectOption("seller-individual");
    await expect(page).toHaveURL(/\/seller/);
    await expect(page.locator("h1")).toContainText(/Seller Portal|Smart Valuation/i);

    // 2. Switch to Individual Buyer
    const buyerSelect = page.locator('select[data-testid="persona-select"]');
    await buyerSelect.selectOption("buyer-individual");
    await expect(page).toHaveURL(/\/store/);
    await expect(page.locator("h1")).toContainText(/Store|Certified Pre-Owned/i);
  });

  test("AUTH-03: Partner Operations subdomain isolation, gate, and persona redirection", async ({ page }) => {
    // 1. Visiting /en/partner on customer domain redirects away
    await page.goto("/en/partner");
    await expect(page).toHaveURL(/\/en$/);

    // 2. Visiting partner.localhost:3000 unauthenticated redirects to /en/partner/login gate
    await page.goto("http://partner.localhost:3000/en/partner");
    await expect(page).toHaveURL(/partner\.localhost:3000\/en\/partner\/login/);

    // 3. Sign in with verified Partner Inspector credentials
    await page.locator("#partner-login-email").fill("inspector@mustadama.eg");
    await page.locator("#partner-login-password").fill("Mustadama2026!");
    await page.locator('[data-testid="partner-login-submit"]').click();
    await expect(page).toHaveURL(/partner\.localhost:3000\/en\/partner$/);
    await expect(page.locator("h1")).toContainText(/Partner Operations|Technical Operations/i);

    // 4. Switch to Courier on partner subdomain
    const courierSelect = page.locator('select[data-testid="persona-select"]');
    await courierSelect.selectOption("courier-hub");
    await expect(page).toHaveURL(/partner\.localhost:3000\/en\/partner$/);
  });

  test("AUTH-04: Admin & MIS subdomain authentication and authorization gate", async ({ page }) => {
    // 1. Visiting /en/admin on customer domain redirects away
    await page.goto("/en/admin");
    await expect(page).toHaveURL(/\/en$/);

    // 2. Visiting admin.localhost:3000 unauthenticated redirects to /en/admin/login gate
    await page.goto("http://admin.localhost:3000/en/admin");
    await expect(page).toHaveURL(/admin\.localhost:3000\/en\/admin\/login/);

    // 3. Sign in with verified Platform Admin credentials
    await page.locator("#admin-login-email").fill("admin@mustadama.eg");
    await page.locator("#admin-login-password").fill("Mustadama2026!");
    await page.locator('[data-testid="admin-login-submit"]').click();
    await expect(page).toHaveURL(/admin\.localhost:3000\/en\/admin$/);
    await expect(page.locator("h1")).toContainText(/Admin|Control Center|Sustainability Dashboard/i);
  });

  test("AUTH-05: Active session chip displays user role and email", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/en");

    const personaSelect = page.locator('select[data-testid="persona-select"]');
    await personaSelect.selectOption("inspector");
    await expect(page).toHaveURL(/\/partner/);

    // Verify active session indicator shows inspector info
    const toolbar = page.locator(".sticky");
    await expect(toolbar.getByText("inspector@mustadama.eg")).toBeVisible();
    await expect(toolbar.getByText(/Partner_Inspector\s*\(Individual\)/i)).toBeVisible();
  });

  test("AUTH-06: Sign out action terminates session and returns to public landing", async ({ page }) => {
    await page.goto("/en");

    const personaSelect = page.locator('select[data-testid="persona-select"]');
    await personaSelect.selectOption("seller-individual");
    await expect(page).toHaveURL(/\/seller/);

    // Click Sign Out
    const signOutBtn = page.getByRole("button", { name: /Sign Out/i });
    await signOutBtn.click();

    // Verify redirected to root landing page
    await expect(page).toHaveURL(/\/(en|ar)(\/)?$/);
  });

  test("AUTH-07: Login form authentication flow and invalid credentials handling", async ({ page }) => {
    await page.goto("/en/login");

    await expect(page.locator("h1")).toContainText(/Sign In/i);

    // Submit invalid credentials
    await page.fill("#login-email", "invalid.user@mustadama.eg");
    await page.fill("#login-password", "WrongPassword123!");
    await page.click('button[type="submit"]');

    // Error message should be displayed
    const errorBox = page.locator(".bg-rose-50");
    await expect(errorBox).toBeVisible();

    // Submit valid pre-seeded credentials
    await page.fill("#login-email", "seller.individual@mustadama.eg");
    await page.fill("#login-password", "Mustadama2026!");
    await page.click('button[type="submit"]');

    // Should redirect to store
    await expect(page).toHaveURL(/\/store/);
  });

  test("AUTH-08: Registration form toggles Individual vs Corporate account fields", async ({ page }) => {
    await page.goto("/en/register");

    await expect(page.locator("h1")).toContainText(/Create a Mustadama Account/i);

    // By default, Individual account is selected (no taxId/commercialReg)
    await expect(page.locator("#reg-tax")).not.toBeVisible();
    await expect(page.locator("#reg-cr")).not.toBeVisible();

    // Toggle to Corporate (Company) account
    await page.getByRole("button", { name: /Corporate Account/i }).click();

    // Corporate fields should now be visible
    await expect(page.locator("#reg-tax")).toBeVisible();
    await expect(page.locator("#reg-cr")).toBeVisible();
    await expect(page.locator("#reg-segment")).toBeVisible();
    await expect(page.locator("#reg-addr")).toBeVisible();

    // Toggle back to Individual
    await page.getByRole("button", { name: /Individual Account/i }).click();
    await expect(page.locator("#reg-tax")).not.toBeVisible();
  });

  test("AUTH-09: Protected portal access redirects unauthenticated users to login", async ({ page, context }) => {
    // Clear all cookies
    await context.clearCookies();

    // Try accessing protected seller portal on customer domain
    await page.goto("/en/seller");
    await expect(page).toHaveURL(/\/login/);

    // Try accessing protected admin portal on admin subdomain
    await page.goto("http://admin.localhost:3000/en/admin");
    await expect(page).toHaveURL(/admin\.localhost:3000\/en\/admin\/login/);
  });
});
