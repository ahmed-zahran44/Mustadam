import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("UI Sanitization & Academic Label Scrubbing (Requirement R2)", () => {
  const portalFiles = [
    "src/components/seller/seller-portal-client.tsx",
    "src/components/partner/partner-portal-client.tsx",
    "src/components/store/storefront-client.tsx",
    "src/components/admin/admin-portal-client.tsx",
  ];

  it.each(portalFiles)(
    "ensures %s has no exposed FR or NFR requirement codes in rendered text",
    (filePath) => {
      const content = readFileSync(filePath, "utf8");
      // Remove comments to check only code and JSX text
      const codeWithoutComments = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
      expect(codeWithoutComments).not.toMatch(/(FR|NFR)-\d+/);
    },
  );

  it("ensures document routes have no requirement codes in generated HTML output", () => {
    const invoiceRoute = readFileSync(
      "src/app/api/documents/invoice/[id]/route.ts",
      "utf8",
    );
    const certRoute = readFileSync(
      "src/app/api/documents/certificate/[id]/route.ts",
      "utf8",
    );

    // Check the HTML template literals
    const invoiceHtmlMatch = invoiceRoute.match(/const html = `([\s\S]*?)`;/);
    expect(invoiceHtmlMatch).toBeTruthy();
    expect(invoiceHtmlMatch![1]).not.toMatch(/(FR|NFR)-\d+/);

    const certHtmlMatch = certRoute.match(/const html = `([\s\S]*?)`;/);
    expect(certHtmlMatch).toBeTruthy();
    expect(certHtmlMatch![1]).not.toMatch(/(FR|NFR)-\d+/);
  });

  it("ensures domain server actions do not return requirement codes in user error strings", () => {
    const sellerActions = readFileSync("src/lib/domain/seller-actions.ts", "utf8");
    const storeActions = readFileSync("src/lib/domain/store-actions.ts", "utf8");

    // Extract all error: "..." strings
    const errorMatches = [
      ...(sellerActions.match(/error:\s*"[^"]+"/g) ?? []),
      ...(storeActions.match(/error:\s*"[^"]+"/g) ?? []),
    ];

    expect(errorMatches.length).toBeGreaterThan(0);
    for (const err of errorMatches) {
      expect(err).not.toMatch(/(FR|NFR)-\d+/);
    }
  });

  it("ensures localization files have 0 requirement codes and 0 academic thesis tags", () => {
    const en = readFileSync("messages/en.json", "utf8");
    const ar = readFileSync("messages/ar.json", "utf8");

    expect(en).not.toMatch(/(FR|NFR)-\d+/);
    expect(ar).not.toMatch(/(FR|NFR)-\d+/);

    expect(en.toLowerCase()).not.toContain("graduation demo");
    expect(ar).not.toContain("مشروع التخرج");
    expect(en).not.toMatch(/\bSRS\s*\d/i);
    expect(ar).not.toMatch(/\bSRS\s*\d/i);
  });
});
