import { NextResponse } from "next/server";
import { lookupKki } from "@/lib/integrations/kki";

export async function POST(req: Request) {
  try {
    const { registrationNumber } = await req.json();
    const result = await lookupKki(registrationNumber);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "KKI lookup failed" },
      { status: 400 },
    );
  }
}
