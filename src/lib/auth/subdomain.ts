/**
 * Helpers for isolating the Partner Operations and Admin & MIS portals onto dedicated subdomains:
 * - Customer domain: `localhost:3000` / `mustadama.eg`
 * - Partner subdomain: `partner.localhost:3000` / `partner.mustadama.eg`
 * - Admin subdomain: `admin.localhost:3000` / `admin.mustadama.eg`
 */

export type PortalDomainKind = "customer" | "partner" | "admin";

export function extractHostname(hostHeader: string | null | undefined): string {
  if (!hostHeader) return "";
  return hostHeader.split(":")[0].trim().toLowerCase();
}

export function isAdminSubdomain(hostHeader: string | null | undefined): boolean {
  const hostname = extractHostname(hostHeader);
  if (!hostname) return false;

  const configuredAdminHost = process.env.NEXT_PUBLIC_ADMIN_HOST?.trim().toLowerCase();
  if (configuredAdminHost && hostname === extractHostname(configuredAdminHost)) {
    return true;
  }

  return hostname.startsWith("admin.");
}

export function isPartnerSubdomain(hostHeader: string | null | undefined): boolean {
  const hostname = extractHostname(hostHeader);
  if (!hostname) return false;

  const configuredPartnerHost =
    process.env.NEXT_PUBLIC_PARTNER_HOST?.trim().toLowerCase();
  if (
    configuredPartnerHost &&
    hostname === extractHostname(configuredPartnerHost)
  ) {
    return true;
  }

  return hostname.startsWith("partner.");
}

export function getPortalDomainKind(
  hostHeader: string | null | undefined,
): PortalDomainKind {
  if (isAdminSubdomain(hostHeader)) return "admin";
  if (isPartnerSubdomain(hostHeader)) return "partner";
  return "customer";
}

function stripPortalSubdomainPrefix(host: string): string {
  return host.replace(/^(admin|partner)\./i, "");
}

export function getAdminSubdomainOrigin(currentUrl: URL): string {
  const configuredAdminHost = process.env.NEXT_PUBLIC_ADMIN_HOST?.trim();
  if (configuredAdminHost) {
    const protocol = currentUrl.protocol || "https:";
    return `${protocol}//${configuredAdminHost}`;
  }

  const baseHost = stripPortalSubdomainPrefix(currentUrl.host);
  return `${currentUrl.protocol}//admin.${baseHost}`;
}

export function getPartnerSubdomainOrigin(currentUrl: URL): string {
  const configuredPartnerHost = process.env.NEXT_PUBLIC_PARTNER_HOST?.trim();
  if (configuredPartnerHost) {
    const protocol = currentUrl.protocol || "https:";
    return `${protocol}//${configuredPartnerHost}`;
  }

  const baseHost = stripPortalSubdomainPrefix(currentUrl.host);
  return `${currentUrl.protocol}//partner.${baseHost}`;
}

export function getCustomerDomainOrigin(currentUrl: URL): string {
  const cleanHost = stripPortalSubdomainPrefix(currentUrl.host);
  return `${currentUrl.protocol}//${cleanHost}`;
}
