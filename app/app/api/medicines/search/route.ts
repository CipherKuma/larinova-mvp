import { NextRequest, NextResponse } from "next/server";
import { searchIndianMedicines } from "@/lib/formulary/india";

// Legacy route — kept for backward compat with existing frontend callers.
// Prefer /api/formulary/search for new code.
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 },
    );
  }

  try {
    const results = await searchIndianMedicines(query);
    // Return in legacy format expected by existing callers
    return NextResponse.json({ medicines: results });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Search failed" },
      { status: 500 },
    );
  }
}
