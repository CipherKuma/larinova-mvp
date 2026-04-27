import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

// Create next-intl middleware
const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  // Root path "/" — redirect (NOT rewrite) to the geo-appropriate sign-in
  // page so the proxy re-runs on the new URL and the invite-code access
  // gate fires. With a rewrite the proxy returns early and unauthed
  // visitors saw the sign-in form directly, bypassing /access entirely.
  // Razorpay / SEO crawlers follow 307 redirects fine.
  if (request.nextUrl.pathname === "/") {
    const country =
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      null;
    const targetLocale = country === "ID" ? "id" : "in";
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${targetLocale}/sign-in`;
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set("larinova_locale", targetLocale, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });
    return response;
  }

  // ADMIN — short-circuit BEFORE next-intl. Admin lives at root /admin
  // (no locale prefix); next-intl would otherwise rewrite it to
  // /in/admin and we'd lose the admin gating. Doctor sign-in / invite
  // gate / onboarding NEVER apply to admin URLs.
  const adminPathname = request.nextUrl.pathname;
  const isAdminPath =
    adminPathname === "/admin" ||
    adminPathname.startsWith("/admin/") ||
    adminPathname.startsWith("/api/admin/");
  if (isAdminPath) {
    const adminPublicPaths = ["/admin/sign-in", "/api/admin/check-email"];
    const isAdminPublic = adminPublicPaths.some(
      (p) => adminPathname === p || adminPathname.startsWith(p + "/"),
    );
    if (isAdminPublic) {
      return NextResponse.next();
    }
    // Authed-admin check needs the supabase session — set it up minimally.
    let preAuthResponse = NextResponse.next();
    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              preAuthResponse.cookies.set(name, value, options),
            );
          },
        },
      },
    );
    const {
      data: { user: adminUser },
    } = await adminSupabase.auth.getUser();
    const { isAdminEmail } = await import("@/lib/admin");
    if (!adminUser) {
      if (adminPathname.startsWith("/api/admin/")) {
        return new NextResponse(null, { status: 401 });
      }
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin/sign-in";
      redirectUrl.searchParams.set("next", adminPathname);
      return NextResponse.redirect(redirectUrl);
    }
    if (!isAdminEmail(adminUser.email)) {
      return new NextResponse(null, { status: 404 });
    }
    return preAuthResponse;
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

  // Demo routes (used to capture cinematic stills for the hero/promo videos)
  // bypass auth + onboarding entirely — they're public, hardcoded UI shells.
  if (pathname.includes("/demo/")) {
    return intlResponse;
  }

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
    "/access",
    "/sign-in",
    "/sign-up",
    "/verify-otp",
    "/auth/callback",
  ].includes(pathWithoutLocale);

  // Pre-auth invite-code gate: unauthed visitors hitting sign-in / sign-up /
  // OTP verify / auth callback MUST first prove they have a valid invite code
  // by entering it at /access. The /api/invite/validate endpoint sets a
  // larinova_invite_token httpOnly cookie which we check here.
  const requiresInviteToken = [
    "/sign-in",
    "/sign-up",
    "/verify-otp",
    "/auth/callback",
  ].includes(pathWithoutLocale);
  if (
    !user &&
    requiresInviteToken &&
    !request.cookies.get("larinova_invite_token")?.value
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${locale}/access`;
    return NextResponse.redirect(redirectUrl);
  }

  // (admin gating handled at the top of the proxy, before next-intl)

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
      .select(
        "onboarding_completed, locale, invite_code_claimed_at, invite_code_redeemed_at",
      )
      .eq("user_id", user.id)
      .single();

    const redirectUrl = request.nextUrl.clone();

    // If there's an error fetching doctor data or doctor doesn't exist, go to onboarding
    if (doctorError || !doctorData) {
      redirectUrl.pathname = `/${locale}/onboarding`;
      return NextResponse.redirect(redirectUrl);
    }

    // Invite-code gate: an authed user without a claim hasn't cleared the
    // access gate. If they still have a token cookie, they're mid-flow and
    // /api/invite/claim hasn't fired yet — let them proceed; the auth
    // callback will run claim shortly. Otherwise bounce them to /access.
    if (
      !doctorData.onboarding_completed &&
      !doctorData.invite_code_claimed_at &&
      !request.cookies.get("larinova_invite_token")?.value &&
      !pathname.includes("/access")
    ) {
      redirectUrl.pathname = `/${locale}/access`;
      return NextResponse.redirect(redirectUrl);
    }

    // If onboarding is not completed, redirect to onboarding
    if (
      !doctorData.onboarding_completed &&
      !pathname.includes("/access") &&
      !pathname.includes("/redeem")
    ) {
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
