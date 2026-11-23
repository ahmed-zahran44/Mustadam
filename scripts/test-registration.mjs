import { chromium } from "playwright";

async function testRegistration(accountType = "Individual") {
  console.log(`\n--- Testing ${accountType} Registration ---`);
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const timestamp = Date.now();
  const testEmail = `mustadam_${accountType.toLowerCase()}_${timestamp}@gmail.com`;
  const testName = accountType === "Company" ? `TechCorp ${timestamp % 1000} LLC` : `Omar Test ${timestamp % 1000}`;
  const testPhone = "+2010" + Math.floor(10000000 + Math.random() * 90000000);
  const testPassword = "MustadamaPass2026!";

  console.log(`Navigating to http://localhost:3000/en/register...`);
  await page.goto("http://localhost:3000/en/register", { waitUntil: "networkidle" });

  if (accountType === "Company") {
    console.log("Selecting Company account type...");
    // Click the company button
    const companyBtn = page.getByRole("button", { name: /Corporate Account/i });
    await companyBtn.click();
    await page.fill("#reg-tax", "123-456-789");
    await page.fill("#reg-cr", "CR-998877");
    await page.fill("#reg-addr", "Building 42, Smart Village, Cairo");
  }

  console.log("Filling form fields for:", testEmail);
  await page.fill("#reg-name", testName);
  await page.fill("#reg-email", testEmail);
  await page.fill("#reg-phone", testPhone);
  await page.fill("#reg-password", testPassword);

  console.log("Submitting form...");
  await page.click("button[type='submit']");

  console.log("Waiting for redirection to /seller...");
  try {
    await page.waitForURL("**/seller", { timeout: 15000 });
    console.log(`SUCCESS [${accountType}]: Navigated to /seller! URL: ${page.url()}`);
  } catch {
    const errorEl = await page.$(".text-rose-700");
    if (errorEl) {
      const errorText = await errorEl.innerText();
      console.error(`FAILED [${accountType}] with on-screen error:`, errorText);
    } else {
      console.error(`FAILED [${accountType}]: Did not navigate to /seller within 15s. URL:`, page.url());
    }
    await browser.close();
    process.exit(1);
  }

  await browser.close();
}

async function main() {
  await testRegistration("Individual");
  await testRegistration("Company");
  console.log("\nALL REGISTRATION TESTS PASSED CLEANLY!");
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
