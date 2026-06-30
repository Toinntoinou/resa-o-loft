import crypto from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "loft_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 jours

function secret(): string {
  return process.env.SESSION_SECRET || "dev-secret-non-securise";
}

function sign(data: string): string {
  return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}

/** Crée un jeton de session signé (role.expiration.signature). */
export function createToken(): string {
  const exp = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `admin.${exp}`;
  return `${payload}.${sign(payload)}`;
}

/** Vérifie l'intégrité et la fraîcheur d'un jeton. */
export function verifyToken(token?: string | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [role, expStr, sig] = parts;
  const payload = `${role}.${expStr}`;
  const expected = sign(payload);
  if (sig.length !== expected.length) return false;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return false;
    }
  } catch {
    return false;
  }
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  return role === "admin";
}

/** Lecture de session (utilisable dans les Server Components et Route Handlers). */
export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(ADMIN_COOKIE)?.value);
}

/** Compare le mot de passe fourni à ADMIN_PASSWORD (temps constant). */
export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Options du cookie de session (à appliquer sur la réponse). */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}
