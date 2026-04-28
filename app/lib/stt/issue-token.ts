import { SignJWT } from "jose";

const ISSUER = "larinova-app";
const AUDIENCE = "stt-proxy";

export async function issueSttProxyToken(opts: {
  consultationId: string;
  userId: string;
  ttlSeconds?: number;
}) {
  const secret = process.env.STT_PROXY_SECRET;
  if (!secret) throw new Error("STT_PROXY_SECRET not configured");
  const ttl = opts.ttlSeconds ?? 30 * 60;

  const token = await new SignJWT({
    consultationId: opts.consultationId,
    userId: opts.userId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(new TextEncoder().encode(secret));

  return token;
}
