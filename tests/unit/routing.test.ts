import { describe, expect, it } from "vitest";
import { isRtl, routing } from "@/i18n/routing";

describe("locale routing (ADR-005)", () => {
  it("supports exactly English and Arabic, English default", () => {
    expect([...routing.locales]).toEqual(["en", "ar"]);
    expect(routing.defaultLocale).toBe("en");
  });

  it("marks only Arabic as RTL", () => {
    expect(isRtl("ar")).toBe(true);
    expect(isRtl("en")).toBe(false);
  });
});

