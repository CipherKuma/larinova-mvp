import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Xendit integration not yet implemented — Indonesia billing coming soon",
    },
    { status: 501 },
  );
}

export async function GET() {
  return NextResponse.json(
    { error: "Xendit integration not yet implemented" },
    { status: 501 },
  );
}
