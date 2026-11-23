import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { canAccessPortal } from "@/lib/auth/rbac";
import { isAdminSubdomain, isPartnerSubdomain } from "@/lib/auth/subdomain";
import type { UserRole } from "@/types/domain";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const localeMatch = pathname.match(/^\/(en|ar)(\/|$)/);
  const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;
  const host = request.headers.get("host");
  const adminHost = isAdminSubdomain(host);
  const partnerHost = isPartnerSubdomain(host);

  if (adminHost) {
    // Root on admin subdomain routes directly to /[locale]/admin (which hits the gate below).
    if (pathname === "/" || pathname === `/${locale}`) {
      return NextResponse.redirect(new URL(`/${locale}/admin`, request.url));
    }

    const isAdminLoginPath = /^\/(en|ar)\/admin\/login(\/|$)/.test(pathname);
    const role = (user?.app_metadata?.role as UserRole | undefined) ?? "Customer";

    if (isAdminLoginPath) {
      if (
        user &&
        (role === "Admin" || role === "Customer_Service") &&
        !request.nextUrl.searchParams.get("denied")
      ) {
        return NextResponse.redirect(new URL(`/${locale}/admin`, request.url));
      }
      return response;
    }

    // Strict Authentication & Authorization Gate on Admin subdomain
    if (!user) {
      const adminLoginUrl = new URL(`/${locale}/admin/login`, request.url);
      adminLoginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(adminLoginUrl);
    }

    if (role !== "Admin" && role !== "Customer_Service") {
      const deniedUrl = new URL(`/${locale}/admin/login`, request.url);
      deniedUrl.searchParams.set("denied", "admin");
      return NextResponse.redirect(deniedUrl);
    }

    // Keep admin subdomain scoped strictly to /admin routes
    if (!/^\/(en|ar)\/admin(\/|$)/.test(pathname)) {
      return NextResponse.redirect(new URL(`/${locale}/admin`, request.url));
    }

    return response;
  }

  if (partnerHost) {
    // Root on partner subdomain routes directly to /[locale]/partner (which hits the gate below).
    if (pathname === "/" || pathname === `/${locale}`) {
      return NextResponse.redirect(new URL(`/${locale}/partner`, request.url));
    }

    const isPartnerLoginPath = /^\/(en|ar)\/partner\/login(\/|$)/.test(pathname);
    const role = (user?.app_metadata?.role as UserRole | undefined) ?? "Customer";

    if (isPartnerLoginPath) {
      if (
        user &&
        canAccessPortal(role, "partner") &&
        !request.nextUrl.searchParams.get("denied")
      ) {
        return NextResponse.redirect(new URL(`/${locale}/partner`, request.url));
      }
      return response;
    }

    // Strict Authentication & Authorization Gate on Partner Operations subdomain
    if (!user) {
      const partnerLoginUrl = new URL(`/${locale}/partner/login`, request.url);
      partnerLoginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(partnerLoginUrl);
    }

    if (!canAccessPortal(role, "partner")) {
      const deniedUrl = new URL(`/${locale}/partner/login`, request.url);
      deniedUrl.searchParams.set("denied", "partner");
      return NextResponse.redirect(deniedUrl);
    }

    // Keep partner subdomain scoped strictly to /partner routes
    if (!/^\/(en|ar)\/partner(\/|$)/.test(pathname)) {
      return NextResponse.redirect(new URL(`/${locale}/partner`, request.url));
    }

    return response;
  }

  // Customer domain: block /admin and /partner routes completely so internal portals are never exposed here
  if (
    /^\/(en|ar)\/(admin|partner)(\/|$)/.test(pathname) ||
    pathname === "/admin" ||
    pathname === "/partner"
  ) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  // Match /[locale]/seller on Customer domain
  const portalMatch = pathname.match(/^\/(en|ar)\/(seller)(\/|$)/);

  if (portalMatch) {
    const portalLocale = portalMatch[1];
    const portal = portalMatch[2] as "seller";

    if (!user) {
      const loginUrl = new URL(`/${portalLocale}/login`, request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = (user.app_metadata?.role as UserRole | undefined) ?? "Customer";
    if (!canAccessPortal(role, portal)) {
      const deniedUrl = new URL(`/${portalLocale}/login`, request.url);
      deniedUrl.searchParams.set("denied", portal);
      return NextResponse.redirect(deniedUrl);
    }
  }

  return response;
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
