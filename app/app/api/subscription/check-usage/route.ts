import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAIUsage } from "@/lib/subscription";
import { AIFeature } from "@/types/billing";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: doctor } = await supabase
      .from("larinova_doctors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const { feature } = (await req.json()) as { feature: AIFeature };

    if (
      !feature ||
      !["summary", "medical_codes", "helena_chat"].includes(feature)
    ) {
      return NextResponse.json({ error: "Invalid feature" }, { status: 400 });
    }

    const usage = await checkAIUsage(doctor.id, feature);
    return NextResponse.json(usage);
  } catch {
    return NextResponse.json(
      { error: "Failed to check usage" },
      { status: 500 },
    );
  }
}
