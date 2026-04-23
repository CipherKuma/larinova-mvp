import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
  const headersList = await headers();

  // Vercel provides this automatically
  const country =
    headersList.get("x-vercel-ip-country") ||
    // Cloudflare
    headersList.get("cf-ipcountry") ||
    null;

  return NextResponse.json({ country: country ?? "default" });
}
