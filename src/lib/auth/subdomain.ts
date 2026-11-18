/**
 * Helpers for isolating the Admin & MIS portal onto its own subdomain
 * (e.g. `admin.localhost:3000` in development, `admin.mustadama.eg` in production).
 */

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

export function getAdminSubdomainOrigin(currentUrl: URL): string {
  const configuredAdminHost = process.env.NEXT_PUBLIC_ADMIN_HOST?.trim();
  if (configuredAdminHost) {
    const protocol = currentUrl.protocol || "https:";
    return `${protocol}//${configuredAdminHost}`;
  }

  const host = currentUrl.host;
  if (isAdminSubdomain(host)) {
    return `${currentUrl.protocol}//${host}`;
  }

  return `${currentUrl.protocol}//admin.${host}`;
}

export function getCustomerDomainOrigin(currentUrl: URL): string {
  const hostname = currentUrl.hostname;
  const cleanHost = hostname.startsWith("admin.")
    ? currentUrl.host.replace(/^admin\./i, "")
    : currentUrl.host;
  return `${currentUrl.protocol}//${cleanHost}`;
}

