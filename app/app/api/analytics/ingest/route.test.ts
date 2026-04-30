import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUser = vi.fn();
const mockInsert = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mockGetUser },
  }),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({
      insert: mockInsert,
    }),
  }),
}));

function req(body: unknown) {
  return new Request("http://localhost/api/analytics/ingest", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "127.0.0.1",
      "user-agent": "vitest",
    },
    body: JSON.stringify(body),
  });
}

function validBody() {
  return {
    session_id: "session-1",
    anonymous_id: "anon-1",
    events: [
      {
        event_type: "pageview",
        path: "/in/sign-in",
        raw_path: "/in/sign-in",
      },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
  process.env.ANALYTICS_IP_SECRET = "test-secret";
  mockGetUser.mockResolvedValue({ data: { user: null } });
});

describe("POST /api/analytics/ingest", () => {
  it("returns 204 when the analytics insert succeeds", async () => {
    mockInsert.mockResolvedValue({ error: null });
    const { POST } = await import("./route");

    const res = await POST(req(validBody()));

    expect(res.status).toBe(204);
  });

  it("fails open when the analytics table is missing", async () => {
    mockInsert.mockResolvedValue({
      error: {
        message:
          "Could not find the table 'public.larinova_events' in the schema cache",
      },
    });
    const { POST } = await import("./route");

    const res = await POST(req(validBody()));

    expect(res.status).toBe(204);
  });

  it("still returns 500 for unexpected insert failures", async () => {
    mockInsert.mockResolvedValue({
      error: {
        message: "permission denied for table larinova_events",
      },
    });
    const { POST } = await import("./route");

    const res = await POST(req(validBody()));

    expect(res.status).toBe(500);
  });
});
