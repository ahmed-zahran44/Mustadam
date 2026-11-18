import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  extractHostname,
  getAdminSubdomainOrigin,
  getCustomerDomainOrigin,
  isAdminSubdomain,
} from "@/lib/auth/subdomain";

describe("Admin & MIS subdomain isolation and authorization gate", () => {
  it("detects admin subdomains across dev and production hosts", () => {
    expect(isAdminSubdomain("admin.localhost:3000")).toBe(true);
    expect(isAdminSubdomain("admin.mustadama.eg")).toBe(true);
    expect(isAdminSubdomain("localhost:3000")).toBe(false);
    expect(isAdminSubdomain("mustadama.eg")).toBe(false);
    expect(isAdminSubdomain("")).toBe(false);
    expect(extractHostname("ADMIN.LOCALHOST:3000")).toBe("admin.localhost");
  });

  it("computes admin and customer subdomain origins cleanly", () => {
    expect(getAdminSubdomainOrigin(new URL("http://localhost:3000/en"))).toBe(
      "http://admin.localhost:3000",
    );
    expect(getAdminSubdomainOrigin(new URL("https://mustadama.eg/en"))).toBe(
      "https://admin.mustadama.eg",
    );
    expect(getCustomerDomainOrigin(new URL("http://admin.localhost:3000/en/admin"))).toBe(
      "http://localhost:3000",
    );
  });

  it("enforces subdomain isolation and Admin role gate in src/proxy.ts", () => {
    const proxyCode = readFileSync("src/proxy.ts", "utf8");
    expect(proxyCode).toContain("isAdminSubdomain");
    expect(proxyCode).toContain("/admin/login");
    expect(proxyCode).toContain('role !== "Admin"');
    expect(proxyCode).toContain('deniedUrl.searchParams.set("denied", "admin")');
  });

  it("does not expose Admin & MIS navigation in customer SiteHeader or HomePage", () => {
    const headerCode = readFileSync("src/components/layout/site-header.tsx", "utf8");
    const homeCode = readFileSync("src/app/[locale]/page.tsx", "utf8");
    expect(headerCode).toContain("CUSTOMER_NAV");
    expect(headerCode).not.toMatch(/CUSTOMER_NAV\s*=\s*\[[^\]]*\/admin/);
    expect(homeCode).not.toContain('href="/admin"');
  });
});
