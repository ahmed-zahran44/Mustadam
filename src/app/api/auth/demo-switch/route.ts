import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { DEMO_DEFAULT_PASSWORD, DEMO_PERSONAS } from "@/lib/auth/rbac";

/**
 * Cross-subdomain Role Simulator handoff endpoint.
 * Signs into a pre-seeded demo account on the target subdomain so Supabase
 * auth cookies are set cleanly on that origin, then redirects to the portal.
 */
export async function GET(request: NextRequest) {
  const personaId = request.nextUrl.searchParams.get("persona");
  const rawLocale = request.nextUrl.searchParams.get("locale");
  const locale = rawLocale === "ar" ? "ar" : "en";

  const host = request.headers.get("host") ?? request.nextUrl.host;
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
    (request.nextUrl.protocol.replace(":", "") || "http");
  const origin = `${proto}://${host}`;

  const persona = DEMO_PERSONAS.find((p) => p.id === personaId);
  if (!persona) {
    return NextResponse.redirect(new URL(`/${locale}`, origin));
  }

  const targetUrl = new URL(`/${locale}${persona.defaultRoute}`, origin);
  const response = NextResponse.redirect(targetUrl);

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
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  await supabase.auth.signInWithPassword({
    email: persona.email,
    password: DEMO_DEFAULT_PASSWORD,
  });

  return response;
}
