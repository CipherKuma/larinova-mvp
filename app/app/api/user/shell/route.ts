import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserShellData } from "@/lib/user-shell";

export async function GET() {
  const supabase = await createClient();
  const shell = await getUserShellData(supabase);

  if (!shell) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(shell);
}
