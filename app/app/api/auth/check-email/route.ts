import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Check if a doctor profile exists with this email
    const { data: doctor } = await supabase
      .from("larinova_doctors")
      .select("id, onboarding_completed")
      .eq("email", email)
      .single();

    return NextResponse.json({
      exists: !!doctor,
      onboardingCompleted: doctor?.onboarding_completed ?? false,
    });
  } catch {
    return NextResponse.json({ exists: false, onboardingCompleted: false });
  }
}
