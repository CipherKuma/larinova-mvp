import { SignJWT } from "jose";

const ISSUER = "larinova-app";
const AUDIENCE = "stt-proxy";

export type SttPurpose = "consultation" | "onboarding";

export async function issueSttProxyToken(opts: {
  purpose: SttPurpose;
  userId: string;
  consultationId?: string;
  ttlSeconds?: number;
}) {
  const secret = process.env.STT_PROXY_SECRET;
  if (!secret) throw new Error("STT_PROXY_SECRET not configured");
  const ttl = opts.ttlSeconds ?? 30 * 60;

  const claims: Record<string, unknown> = {
    purpose: opts.purpose,
    userId: opts.userId,
  };
  if (opts.consultationId) claims.consultationId = opts.consultationId;

  const token = await new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(new TextEncoder().encode(secret));

  return token;
}
