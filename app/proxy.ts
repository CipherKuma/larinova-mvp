import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

// Create next-intl middleware
const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  // Root path — geo redirect to /in or /id
  if (request.nextUrl.pathname === "/") {
    const country =
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      null;
    const targetLocale = country === "ID" ? "id" : "in";
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${targetLocale}`;
    const response = NextResponse.redirect(redirectUrl, 307);
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

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
      .select("onboarding_completed, locale")
      .eq("user_id", user.id)
      .single();

    const redirectUrl = request.nextUrl.clone();

    // If there's an error fetching doctor data or doctor doesn't exist, go to onboarding
    if (doctorError || !doctorData) {
      redirectUrl.pathname = `/${locale}/onboarding`;
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
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|sw\\.js|workbox-.*\\.js|fallback.*\\.js|offline$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|ogg|wav|mp3)$|api|test|book).*)",
  ],
};
