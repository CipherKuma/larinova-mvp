import { NextRequest, NextResponse } from "next/server";

const LOCALE_COOKIE = "larinova_locale";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function detectLocale(request: NextRequest): "in" | "id" {
  const vercelCountry = request.headers.get("x-vercel-ip-country");
  if (vercelCountry === "ID") return "id";
  if (vercelCountry && vercelCountry !== "ID") return "in";

  const cfCountry = request.headers.get("cf-ipcountry");
  if (cfCountry === "ID") return "id";
  if (cfCountry && cfCountry !== "ID") return "in";

  const acceptLang = request.headers.get("accept-language") ?? "";
  if (/\bid(-[A-Z]{2})?\b/i.test(acceptLang)) return "id";

  return "in";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  if (pathname.startsWith("/en")) {
    const newPath = pathname.replace(/^\/en/, "/in");
    const url = request.nextUrl.clone();
    url.pathname = newPath;
    return NextResponse.redirect(url, { status: 301 });
  }

  if (pathname !== "/") {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // ── Root path "/" ──────────────────────────────────────────
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale === "in" || cookieLocale === "id") {
    const url = request.nextUrl.clone();
    url.pathname = `/${cookieLocale}`;
    const response = NextResponse.redirect(url, { status: 307 });
    response.headers.set("x-pathname", `/${cookieLocale}`);
    return response;
  }

  const locale = detectLocale(request);

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}`;

  const response = NextResponse.redirect(url, { status: 307 });
  response.cookies.set(LOCALE_COOKIE, locale, {
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|ico)).*)",
  ],
};
