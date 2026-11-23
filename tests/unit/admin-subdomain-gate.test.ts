import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  extractHostname,
  getAdminSubdomainOrigin,
  getCustomerDomainOrigin,
  getPartnerSubdomainOrigin,
  getPortalDomainKind,
  isAdminSubdomain,
  isPartnerSubdomain,
} from "@/lib/auth/subdomain";

describe("Three-Domain Commercial Portal Isolation (Customer / Partner / Admin)", () => {
  it("detects admin, partner, and customer domains across dev and production hosts", () => {
    expect(isAdminSubdomain("admin.localhost:3000")).toBe(true);
    expect(isAdminSubdomain("admin.mustadama.eg")).toBe(true);
    expect(isAdminSubdomain("partner.localhost:3000")).toBe(false);
    expect(isAdminSubdomain("localhost:3000")).toBe(false);
    expect(isAdminSubdomain("mustadama.eg")).toBe(false);
    expect(isAdminSubdomain("")).toBe(false);
    expect(extractHostname("ADMIN.LOCALHOST:3000")).toBe("admin.localhost");

    expect(isPartnerSubdomain("partner.localhost:3000")).toBe(true);
    expect(isPartnerSubdomain("partner.mustadama.eg")).toBe(true);
    expect(isPartnerSubdomain("admin.localhost:3000")).toBe(false);
    expect(isPartnerSubdomain("localhost:3000")).toBe(false);

    expect(getPortalDomainKind("admin.localhost:3000")).toBe("admin");
    expect(getPortalDomainKind("partner.localhost:3000")).toBe("partner");
    expect(getPortalDomainKind("localhost:3000")).toBe("customer");
  });

  it("computes admin, partner, and customer subdomain origins cleanly", () => {
    expect(getAdminSubdomainOrigin(new URL("http://localhost:3000/en"))).toBe(
      "http://admin.localhost:3000",
    );
    expect(
      getAdminSubdomainOrigin(new URL("http://partner.localhost:3000/en/partner")),
    ).toBe("http://admin.localhost:3000");
    expect(getAdminSubdomainOrigin(new URL("https://mustadama.eg/en"))).toBe(
      "https://admin.mustadama.eg",
    );

    expect(getPartnerSubdomainOrigin(new URL("http://localhost:3000/en"))).toBe(
      "http://partner.localhost:3000",
    );
    expect(
      getPartnerSubdomainOrigin(new URL("http://admin.localhost:3000/en/admin")),
    ).toBe("http://partner.localhost:3000");
    expect(getPartnerSubdomainOrigin(new URL("https://mustadama.eg/en"))).toBe(
      "https://partner.mustadama.eg",
    );

    expect(
      getCustomerDomainOrigin(new URL("http://admin.localhost:3000/en/admin")),
    ).toBe("http://localhost:3000");
    expect(
      getCustomerDomainOrigin(new URL("http://partner.localhost:3000/en/partner")),
    ).toBe("http://localhost:3000");
  });

  it("enforces subdomain isolation and role gates for both Admin and Partner in src/proxy.ts", () => {
    const proxyCode = readFileSync("src/proxy.ts", "utf8");
    expect(proxyCode).toContain("isAdminSubdomain");
    expect(proxyCode).toContain("isPartnerSubdomain");
    expect(proxyCode).toContain("/admin/login");
    expect(proxyCode).toContain("/partner/login");
    expect(proxyCode).toContain('role !== "Admin"');
    expect(proxyCode).toContain('deniedUrl.searchParams.set("denied", "admin")');
    expect(proxyCode).toContain('deniedUrl.searchParams.set("denied", "partner")');
  });

  it("does not expose Admin or Partner Operations navigation in customer SiteHeader, SiteFooter, or HomePage", () => {
    const headerCode = readFileSync(
      "src/components/layout/site-header.tsx",
      "utf8",
    );
    const footerCode = readFileSync(
      "src/components/layout/site-footer.tsx",
      "utf8",
    );
    const homeCode = readFileSync("src/app/[locale]/page.tsx", "utf8");

    expect(headerCode).toContain("CUSTOMER_NAV");
    expect(headerCode).not.toMatch(/CUSTOMER_NAV\s*=\s*\[[^\]]*\/admin/);
    expect(headerCode).not.toMatch(/CUSTOMER_NAV\s*=\s*\[[^\]]*\/partner/);
    expect(footerCode).not.toContain('href="/admin"');
    expect(footerCode).not.toContain('href="/partner"');
    expect(homeCode).not.toContain('href="/admin"');
    expect(homeCode).not.toContain('href="/partner"');
  });
});
