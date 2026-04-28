import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { issueSttProxyToken } from "@/lib/stt/issue-token";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const consultationId = body?.consultationId as string | undefined;
    if (!consultationId) {
      return NextResponse.json(
        { error: "consultationId required" },
        { status: 400 },
      );
    }

    // Verify the consultation belongs to this doctor and is in progress
    const { data: doctor } = await supabase
      .from("larinova_doctors")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const { data: consultation } = await supabase
      .from("larinova_consultations")
      .select("id, doctor_id, status")
      .eq("id", consultationId)
      .single();
    if (!consultation || consultation.doctor_id !== doctor.id) {
      return NextResponse.json(
        { error: "Consultation not found" },
        { status: 404 },
      );
    }

    const proxyUrl = process.env.STT_PROXY_URL;
    if (!proxyUrl) {
      return NextResponse.json(
        { error: "STT proxy not configured" },
        { status: 500 },
      );
    }

    const token = await issueSttProxyToken({
      consultationId,
      userId: user.id,
      ttlSeconds: 30 * 60,
    });

    return NextResponse.json({
      token,
      wsUrl: proxyUrl,
      expiresInSeconds: 30 * 60,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to issue STT token";
    console.error("[STT_TOKEN] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
