import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("larinova_discovery_surveys")
    .select("*")
    .order("created_at", { ascending: false });

  if (!rows || rows.length === 0) {
    return new NextResponse("no rows\n", {
      status: 200,
      headers: { "content-type": "text/csv" },
    });
  }

  const cols = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv =
    cols.join(",") +
    "\n" +
    rows
      .map((r: Record<string, unknown>) =>
        cols.map((c) => escape(r[c])).join(","),
      )
      .join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="surveys-${Date.now()}.csv"`,
    },
  });
}
