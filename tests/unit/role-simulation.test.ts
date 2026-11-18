import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEMO_PERSONAS } from "@/lib/auth/rbac";

describe("Role Simulation Dropdown & Localization (Requirement R1)", () => {
  const enMessages = JSON.parse(readFileSync("messages/en.json", "utf8"));
  const arMessages = JSON.parse(readFileSync("messages/ar.json", "utf8"));

  it("verifies DemoToolbar localized keys are identical and complete in en and ar", () => {
    const enKeys = Object.keys(enMessages.DemoToolbar).sort();
    const arKeys = Object.keys(arMessages.DemoToolbar).sort();

    expect(enKeys).toEqual(arKeys);

    const expectedKeys = [
      "agingJobSuccess",
      "badge",
      "close",
      "groupAdmin",
      "groupCustomers",
      "groupPartners",
      "guestSession",
      "inboxBtn",
      "inboxEmpty",
      "inboxTitle",
      "runAgingBtn",
      "selectPersonaPrompt",
      "signOut",
      "subtitle",
      "switching",
    ].sort();

    expect(enKeys).toEqual(expectedKeys);
  });

  it("scrubs all academic and requirement code tags from DemoToolbar in both languages", () => {
    const academicPatterns = [
      /GRADUATION DEMO TOOLBAR/i,
      /SRS/i,
      /12 SRS Personas/i,
      /8 Clean DB Roles/i,
      /SRS 6\.2/i,
    ];

    const enValues = Object.values(enMessages.DemoToolbar) as string[];
    const arValues = Object.values(arMessages.DemoToolbar) as string[];

    for (const val of [...enValues, ...arValues]) {
      for (const pattern of academicPatterns) {
        expect(val).not.toMatch(pattern);
      }
    }

    expect(enMessages.DemoToolbar.badge).toBe("Role Simulator");
    expect(arMessages.DemoToolbar.badge).toBe("محاكي الأدوار");
  });

  it("groups all 12 personas into exactly 3 clean categories: Customers (4), Partners (6), Admin (2)", () => {
    const customerIds = [
      "seller-individual",
      "seller-corporate",
      "buyer-individual",
      "buyer-corporate",
    ];
    const partnerIds = [
      "courier-hub",
      "transport-bulky",
      "inspector",
      "refurb-tech",
      "dismantle-tech",
      "warehouse-mgr",
    ];
    const adminIds = ["customer-service", "admin"];

    const allGroupedIds = [...customerIds, ...partnerIds, ...adminIds];
    expect(allGroupedIds).toHaveLength(12);

    const personaIds = DEMO_PERSONAS.map((p) => p.id);
    expect(personaIds.sort()).toEqual(allGroupedIds.sort());

    // Customer group contains both Individual and Corporate accounts
    const customers = DEMO_PERSONAS.filter((p) => customerIds.includes(p.id));
    expect(customers).toHaveLength(4);
    expect(customers.every((p) => p.role === "Customer")).toBe(true);

    // Partner group contains operational roles
    const partners = DEMO_PERSONAS.filter((p) => partnerIds.includes(p.id));
    expect(partners).toHaveLength(6);

    // Admin group contains support and governance roles
    const admins = DEMO_PERSONAS.filter((p) => adminIds.includes(p.id));
    expect(admins).toHaveLength(2);
  });
});
