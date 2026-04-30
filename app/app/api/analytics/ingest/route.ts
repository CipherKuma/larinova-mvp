import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isMissingAnalyticsStoreError } from "@/lib/analytics/errors";

const EventSchema = z.object({
  event_type: z.enum(["pageview", "click", "milestone"]),
  path: z.string().max(256).optional(),
  raw_path: z.string().max(512).optional(),
  element: z.string().max(120).optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
});

const BodySchema = z.object({
  session_id: z.string().min(1).max(64),
  anonymous_id: z.string().min(1).max(64),
  events: z.array(EventSchema).min(1).max(100),
});

const RATE_BUCKET = new Map<string, { count: number; windowStart: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 60;

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const b = RATE_BUCKET.get(ip);
  if (!b || now - b.windowStart > RATE_WINDOW_MS) {
    RATE_BUCKET.set(ip, { count: 1, windowStart: now });
    return false;
  }
  b.count += 1;
  return b.count > RATE_LIMIT;
}

function hashIp(ip: string): string {
  const secret = process.env.ANALYTICS_IP_SECRET ?? "no-secret-set";
  return crypto
    .createHash("sha256")
    .update(ip + ":" + secret)
    .digest("hex")
    .slice(0, 32);
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimit(ip)) return new NextResponse(null, { status: 429 });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  // Resolve user_id if authenticated (best-effort)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ua = req.headers.get("user-agent")?.slice(0, 500) ?? null;
  const ip_hash = hashIp(ip);

  const rows = body.events.map((e) => ({
    session_id: body.session_id,
    anonymous_id: body.anonymous_id,
    user_id: user?.id ?? null,
    event_type: e.event_type,
    path: e.path ?? null,
    raw_path: e.raw_path ?? null,
    element: e.element ?? null,
    properties: e.properties ?? {},
    user_agent: ua,
    ip_hash,
    locale: e.path?.match(/^\/(in|id)/)?.[1] ?? null,
  }));

  const sb = adminClient();
  const { error } = await sb.from("larinova_events").insert(rows);
  if (error) {
    if (isMissingAnalyticsStoreError(error)) {
      return new NextResponse(null, { status: 204 });
    }
    console.error("[analytics/ingest] insert failed:", error.message);
    return new NextResponse(null, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
