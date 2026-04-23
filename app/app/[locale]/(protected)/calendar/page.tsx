import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CalendarPage } from "@/components/calendar/CalendarPage";

export default async function CalendarRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: doctor } = await supabase
    .from("larinova_doctors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!doctor) redirect("/sign-in");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return <CalendarPage appUrl={appUrl} />;
}
