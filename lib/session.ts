import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "candle_session";
export type Role = "admin" | "manager";
export type Session = { uid: string; email: string; name: string; role: Role };

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error("AUTH_SECRET em falta ou com menos de 32 caracteres.");
  }
  return new TextEncoder().encode(s);
}

export async function createSessionToken(s: Session): Promise<string> {
  return new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret());
}

export async function verifySessionToken(token?: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      uid: String(payload.uid),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role === "admin" ? "admin" : "manager",
    };
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 12,
};
