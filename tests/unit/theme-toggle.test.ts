import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Light / Dark theme support", () => {
  it("configures class-based dark mode in globals.css", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    expect(css).toContain("@custom-variant dark");
    expect(css).toContain("html.dark");
  });

  it("injects pre-hydration theme initialization script in LocaleLayout", () => {
    const layout = readFileSync("src/app/[locale]/layout.tsx", "utf8");
    expect(layout).toContain("mustadama-theme");
    expect(layout).toContain("classList.toggle");
  });

  it("renders ThemeToggle inside SiteHeader", () => {
    const header = readFileSync("src/components/layout/site-header.tsx", "utf8");
    expect(header).toContain("ThemeToggle");
  });

  it("implements ThemeToggle with data-testid and localStorage persistence", () => {
    const toggle = readFileSync("src/components/layout/theme-toggle.tsx", "utf8");
    expect(toggle).toContain('data-testid="theme-toggle"');
    expect(toggle).toContain("mustadama-theme");
    expect(toggle).toContain("useSyncExternalStore");
  });
});

