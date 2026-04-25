import { SupabaseClient } from "@supabase/supabase-js";

export type RedeemResult =
  | { ok: true; period_end: string; already_redeemed: boolean }
  | {
      ok: false;
      error: "invalid_or_used_code" | "unauthenticated" | "unknown";
    };

export async function redeemInviteCode(
  supabase: SupabaseClient,
  code: string,
): Promise<RedeemResult> {
  const { data, error } = await supabase.rpc("redeem_invite_code", {
    p_code: code,
  });

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("invalid_or_used_code")) {
      return { ok: false, error: "invalid_or_used_code" };
    }
    if (msg.includes("unauthenticated")) {
      return { ok: false, error: "unauthenticated" };
    }
    return { ok: false, error: "unknown" };
  }

  return {
    ok: true,
    period_end: data?.period_end ?? "",
    already_redeemed: Boolean(data?.already_redeemed),
  };
}
