import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type Messages = Record<string, unknown>;

const flatten = (obj: Messages, prefix = ""): string[] =>
  Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "object" && v !== null
      ? flatten(v as Messages, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  );

const load = (locale: string): Messages =>
  JSON.parse(readFileSync(`messages/${locale}.json`, "utf8"));

describe("bilingual message parity (ADR-005)", () => {
  it("en.json and ar.json define exactly the same keys", () => {
    expect(flatten(load("ar")).sort()).toEqual(flatten(load("en")).sort());
  });

  it("contains no exposed requirement codes (FR- or NFR-) in en.json or ar.json", () => {
    const enRaw = readFileSync("messages/en.json", "utf8");
    const arRaw = readFileSync("messages/ar.json", "utf8");

    expect(enRaw).not.toMatch(/FR-\d+/);
    expect(enRaw).not.toMatch(/NFR-\d+/);
    expect(arRaw).not.toMatch(/FR-\d+/);
    expect(arRaw).not.toMatch(/NFR-\d+/);
  });

  it("contains no academic graduation demo labels in en.json or ar.json", () => {
    const enRaw = readFileSync("messages/en.json", "utf8");
    const arRaw = readFileSync("messages/ar.json", "utf8");

    expect(enRaw.toLowerCase()).not.toContain("graduation");
    expect(arRaw).not.toContain("التخرج");
    expect(enRaw).not.toMatch(/\bSRS\b/);
    expect(arRaw).not.toMatch(/\bSRS\b/);
  });
});

