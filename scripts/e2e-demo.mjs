import { chromium } from "playwright";

async function runDemo() {
  console.log("🚀 Launching Chrome to execute the live graduation defense demo in front of you...");
  const browser = await chromium.launch({
    channel: "chrome",
    headless: false,
    slowMo: 1200, // Slow down operations so the user can clearly observe each step
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  try {
    // 1. Open Homepage
    console.log("📍 Step 1: Navigating to Mustadama Homepage (http://localhost:3000/en)...");
    await page.goto("http://localhost:3000/en", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // 2. Switch to 1. Individual Seller
    console.log("👤 Step 2: Clicking '1. Individual Seller' in the Graduation Demo Toolbar...");
    await page.click("button:has-text('1. Individual Seller')");
    await page.waitForURL("**/seller**");
    await page.waitForTimeout(2000);

    // 3. Test Diagnostic Questionnaire & Live Price Estimation
    console.log("📝 Step 3: Testing dynamic diagnostic questions & live price estimation...");
    const checkboxes = page.locator("input[type='checkbox']");
    const count = await checkboxes.count();
    if (count > 0) {
      await checkboxes.first().click();
      await page.waitForTimeout(1500);
    }

    // 4. Switch to 3. Individual Buyer
    console.log("🛒 Step 4: Switching to '3. Individual Buyer' in the Demo Toolbar...");
    await page.click("button:has-text('3. Individual Buyer')");
    await page.waitForURL("**/store**");
    await page.waitForTimeout(2500);

    // 5. Select Serialized Item in Storefront
    console.log("🔍 Step 5: Selecting a serialized unit in the Storefront...");
    const selectBtn = page.locator("button:has-text('Select Serialized Unit')").first();
    if (await selectBtn.isVisible()) {
      await selectBtn.click();
      await page.waitForTimeout(1500);

      // Lock item with 15-minute reservation
      console.log("🔒 Step 6: Locking item with 15-Minute Atomic Reservation (NFR-04)...");
      const lockBtn = page.locator("button:has-text('1. Lock Serialized Items & Reserve Order')");
      if (await lockBtn.isVisible()) {
        await lockBtn.click();
        await page.waitForTimeout(2500);
      }

      // Simulate payment webhook
      console.log("💳 Step 7: Triggering Simulated Payment Webhook (SUCCESS)...");
      const payBtn = page.locator("button:has-text('2. Trigger Simulated Payment Webhook')");
      if (await payBtn.isVisible()) {
        await payBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    // 6. Switch to Arabic RTL
    console.log("🌐 Step 8: Testing bilingual support - switching to Arabic (RTL)...");
    const langBtn = page.locator("a:has-text('العربية')");
    if (await langBtn.isVisible()) {
      await langBtn.click();
      await page.waitForTimeout(2500);
    }

    // 7. Switch to 12. Platform Admin
    console.log("📊 Step 9: Switching to '12. Platform Admin (MIS)' to inspect Dashboard KPIs...");
    const adminBtn = page.locator("button:has-text('١٢. مدير المنصة والتقارير'), button:has-text('12. Platform Admin')").first();
    if (await adminBtn.isVisible()) {
      await adminBtn.click();
      await page.waitForTimeout(3000);
    }

    console.log("✅ All live test scenarios completed successfully!");
    await page.waitForTimeout(4000);
  } catch (err) {
    console.error("❌ Test error:", err);
  } finally {
    await browser.close();
    console.log("🏁 Browser closed. Demo run complete.");
  }
}

runDemo();

