import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/lib/models";

const EXPIRY = "15m";

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set; cannot sign magic-link tokens.");
  }
  return new TextEncoder().encode(secret);
}

export interface MagicTokenClaims {
  sub: string; // user id
  email: string;
  role: Role;
}

/** Sign a short-lived magic-link token embedding the user's id, email, role. */
export async function signMagicToken(claims: MagicTokenClaims): Promise<string> {
  return new SignJWT({ email: claims.email, role: claims.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret());
}

/** Verify a magic-link token. Returns null when invalid or expired. */
export async function verifyMagicToken(token: string): Promise<MagicTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
      return null;
    }
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}
