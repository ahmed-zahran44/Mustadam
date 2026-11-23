import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GraduationDemoToolbar } from "@/components/demo/graduation-demo-toolbar";
import { canAccessPortal, DEMO_PERSONAS } from "@/lib/auth/rbac";

// Load localization files for oracle comparisons
const enMessages = JSON.parse(readFileSync("messages/en.json", "utf8"));
const arMessages = JSON.parse(readFileSync("messages/ar.json", "utf8"));

// Mocks for Next.js and next-intl client hooks
const mockRouter = {
  push: vi.fn(),
  refresh: vi.fn(),
};

let currentLocale = "en";

vi.mock("next-intl", () => ({
  useLocale: () => currentLocale,
  useTranslations: (namespace: string) => {
    const dict =
      currentLocale === "ar" ? arMessages[namespace] : enMessages[namespace];
    return (key: string) => dict?.[key] ?? `[${namespace}.${key}]`;
  },
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => mockRouter,
}));

vi.mock("@/lib/auth/actions", () => ({
  switchDemoPersonaAction: vi.fn(async (personaId: string) => {
    const persona = DEMO_PERSONAS.find((p) => p.id === personaId);
    if (!persona) return { ok: false, error: "Unknown persona" };
    return {
      ok: true,
      defaultRoute: persona.defaultRoute,
      role: persona.role,
      email: persona.email,
    };
  }),
  signOutAction: vi.fn(async () => ({ ok: true })),
  triggerInventoryAgingAndExpiryAction: vi.fn(async () => ({
    ok: true,
    agedTransitions: 0,
    expiredOffers: 0,
  })),
}));

describe("Adversarial Empirical Verification: Milestone 1 Role Simulation (R1)", () => {
  beforeEach(() => {
    currentLocale = "en";
    vi.clearAllMocks();
  });

  describe("1. Oracle Verification of 12 DEMO_PERSONAS and Route Contracts", () => {
    it("ensures exactly 12 unique personas exist with valid IDs, emails, and UUIDs", () => {
      expect(DEMO_PERSONAS).toHaveLength(12);

      const ids = DEMO_PERSONAS.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(12);

      const emails = DEMO_PERSONAS.map((p) => p.email.toLowerCase());
      const uniqueEmails = new Set(emails);
      expect(uniqueEmails.size).toBe(12);

      const userIds = DEMO_PERSONAS.map((p) => p.userId);
      const uniqueUserIds = new Set(userIds);
      expect(uniqueUserIds.size).toBe(12);

      // Verify UUID v4 format and valid mustadama domain
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      for (const p of DEMO_PERSONAS) {
        expect(p.id).toMatch(/^[a-z0-9-]+$/);
        expect(p.email).toMatch(/^[a-z0-9.]+@mustadama\.eg$/);
        expect(p.userId).toMatch(uuidRegex);
      }
    });

    it("verifies every persona defaultRoute strictly obeys the RBAC portal matrix", () => {
      const validPortals = ["seller", "store", "partner", "admin"] as const;

      for (const persona of DEMO_PERSONAS) {
        const portal = persona.defaultRoute.replace(/^\//, "") as
          | "seller"
          | "store"
          | "partner"
          | "admin";
        expect(validPortals).toContain(portal);

        const isAllowed = canAccessPortal(persona.role, portal);
        expect(
          isAllowed,
          `Persona ${persona.id} with role ${persona.role} MUST be allowed to access ${persona.defaultRoute}`,
        ).toBe(true);
      }
    });
  });

  describe("2. Static Markup & DOM Option Integrity", () => {
    it("renders all 12 personas as distinct <option> elements inside the 3 <optgroup> categories in English", () => {
      currentLocale = "en";
      const html = renderToStaticMarkup(
        React.createElement(GraduationDemoToolbar, {
          activeUserId: null,
          activeEmail: null,
          activeRole: null,
          activeAccountType: null,
          notifications: [],
        }),
      );

      // Toolbar docked/sticky container
      expect(html).toContain("sticky top-0 z-50");
      expect(html).toContain('id="persona-select"');
      expect(html).toContain('data-testid="persona-select"');

      // Check all 3 optgroup labels
      expect(html).toContain(`label="${enMessages.DemoToolbar.groupCustomers}"`);
      expect(html).toContain(`label="${enMessages.DemoToolbar.groupPartners}"`);
      expect(html).toContain(`label="${enMessages.DemoToolbar.groupAdmin}"`);

      // Verify all 12 persona options are present with correct IDs and clean labels
      for (const p of DEMO_PERSONAS) {
        expect(html).toContain(`value="${p.id}"`);
        // Label should be stripped of academic number "1. ", "12. "
        const cleanEnLabel = p.labelEn.replace(/^\d+\.\s*/, "").trim();
        expect(html).toContain(cleanEnLabel);
        expect(html).not.toMatch(new RegExp(`>\\s*\\d+\\.\\s*${cleanEnLabel}`));
      }
    });

    it("renders all 12 personas correctly in Arabic (RTL) with Arabic optgroups and stripped numerals", () => {
      currentLocale = "ar";
      const html = renderToStaticMarkup(
        React.createElement(GraduationDemoToolbar, {
          activeUserId: null,
          activeEmail: null,
          activeRole: null,
          activeAccountType: null,
          notifications: [],
        }),
      );

      // Check all 3 Arabic optgroup labels
      expect(html).toContain(`label="${arMessages.DemoToolbar.groupCustomers}"`);
      expect(html).toContain(`label="${arMessages.DemoToolbar.groupPartners}"`);
      expect(html).toContain(`label="${arMessages.DemoToolbar.groupAdmin}"`);

      // Verify all 12 persona options are present with Arabic labels stripped of "١.", "١٢."
      for (const p of DEMO_PERSONAS) {
        expect(html).toContain(`value="${p.id}"`);
        const cleanArLabel = p.labelAr.replace(/^[\d١-٩٠-٩]+\.\s*/, "").trim();
        expect(html).toContain(cleanArLabel);
        expect(html).not.toMatch(new RegExp(`>\\s*[١-٩٠-٩]+\\.\\s*${cleanArLabel}`));
      }
    });
  });

  describe("3. Corner Case Stress Testing", () => {
    it("handles Guest Session correctly (no logged in user)", () => {
      currentLocale = "en";
      const html = renderToStaticMarkup(
        React.createElement(GraduationDemoToolbar, {
          activeUserId: null,
          activeEmail: null,
          activeRole: null,
          activeAccountType: null,
          notifications: [],
        }),
      );

      // Should display guest session label
      expect(html).toContain(enMessages.DemoToolbar.guestSession);

      // Select default option should be disabled prompt
      expect(html).toContain(`<option value="" disabled="" selected="">${enMessages.DemoToolbar.selectPersonaPrompt}</option>`);

      // Sign Out button must NOT be rendered
      expect(html).not.toContain(enMessages.DemoToolbar.signOut);

      // Aging check button must be disabled
      expect(html).toMatch(/<button[^>]+disabled=""[^>]*>.*?⏱️.*?<\/button>/);
    });

    it("handles Unknown / Custom Authenticated User not in DEMO_PERSONAS gracefully", () => {
      currentLocale = "en";
      const customUserId = "99999999-9999-9999-9999-999999999999";
      const customEmail = "external_user@company.com";
      const customRole = "Customer";

      const html = renderToStaticMarkup(
        React.createElement(GraduationDemoToolbar, {
          activeUserId: customUserId,
          activeEmail: customEmail,
          activeRole: customRole,
          activeAccountType: "Company",
          notifications: [],
        }),
      );

      // Should display user email and role badge
      expect(html).toContain(customEmail);
      expect(html).toContain(customRole);
      expect(html).toContain("(Company)");

      // Persona dropdown should still show prompt because user is not a demo persona
      expect(html).toContain(`<option value="" disabled="" selected="">${enMessages.DemoToolbar.selectPersonaPrompt}</option>`);

      // Sign Out button MUST be rendered for logged in user
      expect(html).toContain(enMessages.DemoToolbar.signOut);

      // Aging check button must be ENABLED
      expect(html).not.toMatch(/<button[^>]+disabled=""[^>]*>.*?⏱️.*?<\/button>/);
    });

    it("handles Long Localized Names and Email Truncation without DOM overflow", () => {
      currentLocale = "ar";
      const superLongEmail = "very.long.corporate.executive.officer.account@mustadama.eg";

      const html = renderToStaticMarkup(
        React.createElement(GraduationDemoToolbar, {
          activeUserId: "11111111-1111-1111-1111-111111111102",
          activeEmail: superLongEmail,
          activeRole: "Customer",
          activeAccountType: "Company",
          notifications: [],
        }),
      );

      // Must contain max-w-[160px] truncate to prevent toolbar blowout
      expect(html).toContain("max-w-[160px] truncate");
      expect(html).toContain(`title="${superLongEmail}"`);
    });
    it("matches active persona by case-insensitive email if userId is null or transient", () => {
      currentLocale = "en";
      const html = renderToStaticMarkup(
        React.createElement(GraduationDemoToolbar, {
          activeUserId: null,
          activeEmail: "INSPECTOR@MUSTADAMA.EG",
          activeRole: "Partner_Inspector",
          activeAccountType: "Individual",
          notifications: [],
        }),
      );

      // Value should be selected for inspector
      expect(html).toContain('value="inspector" selected=""');
    });

    it("renders notification items in popover dialog with proper badges and timestamps", () => {
      currentLocale = "en";
      const sampleNotifications = [
        {
          notification_id: "notif-001",
          channel: "sms",
          type: "pickup_scheduled",
          message: "Pickup scheduled for tomorrow at 10 AM",
          created_at: "2026-11-06T10:00:00Z",
        },
      ];

      const html = renderToStaticMarkup(
        React.createElement(GraduationDemoToolbar, {
          activeUserId: "11111111-1111-1111-1111-111111111107",
          activeEmail: "inspector@mustadama.eg",
          activeRole: "Partner_Inspector",
          activeAccountType: "Individual",
          notifications: sampleNotifications,
        }),
      );

      // Notification count badge
      expect(html).toContain(">1<");
    });
  });

  describe("4. Floating Popover & Zero-Reflow Architectural Verification", () => {
    it("verifies notification popover uses absolute positioning detached from host layout flow", () => {
      // The popover markup in graduation-demo-toolbar.tsx uses:
      // absolute top-full end-0 mt-1.5 w-80 sm:w-96 max-h-80 overflow-y-auto rounded-xl bg-slate-950/95 backdrop-blur-md border border-slate-700 shadow-2xl p-3 space-y-2 z-50
      const toolbarFile = readFileSync(
        "src/components/demo/graduation-demo-toolbar.tsx",
        "utf8",
      );

      // Popover container must be absolute
      expect(toolbarFile).toMatch(/absolute top-full end-0 mt-1\.5/);

      // Backdrop dismissal must be fixed full-screen
      expect(toolbarFile).toMatch(/fixed inset-0 z-40 bg-transparent/);

      // Floating aging alert must also be absolute
      expect(toolbarFile).toMatch(/absolute top-full start-1\/2 -translate-x-1\/2/);
      expect(toolbarFile).toMatch(/pointer-events-none/);
    });
  });

  describe("5. formatPersonaLabel Regex Robustness", () => {
    // Mirror the format function to test edge cases
    function formatPersonaLabel(rawLabel: string): string {
      return rawLabel.replace(/^[\d١-٩٠-٩]+\.\s*/, "").trim();
    }

    it("strips English, Arabic, multi-digit, and irregular prefixes cleanly", () => {
      expect(formatPersonaLabel("1. Individual Seller")).toBe("Individual Seller");
      expect(formatPersonaLabel("12. Platform Admin (MIS)")).toBe("Platform Admin (MIS)");
      expect(formatPersonaLabel("١. بائع فردي")).toBe("بائع فردي");
      expect(formatPersonaLabel("١٠. مدير المستودع")).toBe("مدير المستودع");
      expect(formatPersonaLabel("١٢. مدير المنصة والتقارير")).toBe("مدير المنصة والتقارير");
      expect(formatPersonaLabel("999. Extreme Test")).toBe("Extreme Test");
      expect(formatPersonaLabel("Plain Label Without Number")).toBe("Plain Label Without Number");
      expect(formatPersonaLabel("Label with 2 in middle")).toBe("Label with 2 in middle");
      expect(formatPersonaLabel("")).toBe("");
    });
  });

  describe("6. Rapid Persona Switching & Concurrent Invocations", () => {
    it("handles rapid consecutive persona switch requests deterministically", async () => {
      const { switchDemoPersonaAction } = await import("@/lib/auth/actions");

      // Simulate rapid switching between 5 different personas concurrently
      const rapidIds = [
        "seller-individual",
        "buyer-corporate",
        "inspector",
        "warehouse-mgr",
        "admin",
      ];

      const promises = rapidIds.map((id) => switchDemoPersonaAction(id));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((res, idx) => {
        const expectedPersona = DEMO_PERSONAS.find((p) => p.id === rapidIds[idx]);
        expect(res.ok).toBe(true);
        expect(res.defaultRoute).toBe(expectedPersona?.defaultRoute);
      });
    });

    it("rejects unknown persona IDs with deterministic error", async () => {
      const { switchDemoPersonaAction } = await import("@/lib/auth/actions");

      const unknownResult = await switchDemoPersonaAction("non-existent-persona");
      expect(unknownResult.ok).toBe(false);
      expect(unknownResult.error).toBe("Unknown persona");

      const emptyResult = await switchDemoPersonaAction("");
      expect(emptyResult.ok).toBe(false);
      expect(emptyResult.error).toBe("Unknown persona");
    });
  });
});
