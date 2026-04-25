import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

// Create next-intl middleware
const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  // Root path "/" — internally rewrite to the geo-appropriate sign-in page
  // so the URL stays "/" but the content comes from the existing
  // [locale]/(auth)/sign-in page. Payment-gateway verifiers (Razorpay)
  // and SEO crawlers get a 200 with the real sign-in UI, no redirect.
  // After the user signs in / signs up, the sign-in page navigates to
  // /in/... or /id/... for the authenticated product flow.
  if (request.nextUrl.pathname === "/") {
    const country =
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      null;
    const targetLocale = country === "ID" ? "id" : "in";
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/${targetLocale}/sign-in`;
    const response = NextResponse.rewrite(rewriteUrl);
    response.cookies.set("larinova_locale", targetLocale, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });
    return response;
  }

  // Handle next-intl routing first
  const intlResponse = intlMiddleware(request);

  // If intl middleware returns a redirect, use it
  if (intlResponse.status === 307 || intlResponse.status === 308) {
    return intlResponse;
  }

  // Get locale from pathname
  const pathname = request.nextUrl.pathname;
  const pathnameLocale = pathname.split("/")[1];
  const locale = routing.locales.includes(pathnameLocale as any)
    ? pathnameLocale
    : routing.defaultLocale;

  // Use the intlResponse as base to preserve locale headers
  let supabaseResponse = intlResponse;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session if expired. If the refresh token is gone or invalid
  // (cookies cleared, token rotated, manual revoke), clear all sb-* cookies
  // silently so we don't keep retrying a dead token.
  const { data: getUserData, error: getUserError } =
    await supabase.auth.getUser();

  let user = getUserData?.user ?? null;

  if (getUserError) {
    const code = (getUserError as { code?: string }).code;
    const msg = getUserError.message?.toLowerCase() ?? "";
    const isRefreshTokenError =
      code === "refresh_token_not_found" || msg.includes("refresh token");
    if (isRefreshTokenError) {
      for (const cookie of request.cookies.getAll()) {
        if (cookie.name.startsWith("sb-")) {
          supabaseResponse.cookies.delete(cookie.name);
        }
      }
      user = null;
    }
  }

  // Define public routes
  const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
  const isPublicRoute = [
    "/sign-in",
    "/sign-up",
    "/verify-otp",
    "/auth/callback",
  ].includes(pathWithoutLocale);

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute && !pathname.includes("/api")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${locale}/sign-in`;
    return NextResponse.redirect(redirectUrl);
  }

  // Check onboarding status for authenticated users (both for auth routes and protected routes)
  if (user && !pathname.includes("/api") && !pathname.includes("/onboarding")) {
    // Check if onboarding is completed
    const { data: doctorData, error: doctorError } = await supabase
      .from("larinova_doctors")
      .select("onboarding_completed, locale, invite_code_redeemed_at")
      .eq("user_id", user.id)
      .single();

    const redirectUrl = request.nextUrl.clone();

    // If there's an error fetching doctor data or doctor doesn't exist, go to onboarding
    if (doctorError || !doctorData) {
      redirectUrl.pathname = `/${locale}/onboarding`;
      return NextResponse.redirect(redirectUrl);
    }

    // Invite-code gate: not-yet-onboarded users must redeem before reaching
    // /onboarding. Already-onboarded users are grandfathered (skip this gate).
    if (
      !doctorData.onboarding_completed &&
      !doctorData.invite_code_redeemed_at &&
      !pathname.includes("/redeem")
    ) {
      redirectUrl.pathname = `/${locale}/redeem`;
      return NextResponse.redirect(redirectUrl);
    }

    // If onboarding is not completed, redirect to onboarding
    if (!doctorData.onboarding_completed) {
      redirectUrl.pathname = `/${locale}/onboarding`;
      return NextResponse.redirect(redirectUrl);
    }

    // If trying to access auth routes but onboarding is complete, redirect to dashboard
    if (isPublicRoute) {
      const preferredLocale = doctorData.locale || locale;
      redirectUrl.pathname = `/${preferredLocale}`;
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - PWA runtime assets (manifest, service worker, workbox chunks, offline fallback)
     * - public folder (images, videos, etc.)
     * - api routes
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|sw\\.js|workbox-.*\\.js|fallback.*\\.js|serwist/|offline$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|ogg|wav|mp3)$|api|test|book).*)",
  ],
};
