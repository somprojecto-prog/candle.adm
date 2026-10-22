import bcrypt from "bcryptjs";
import { prisma } from "./db";

/** Valida email + palavra-passe. Devolve o utilizador ou null. */
export async function authenticate(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user || !user.active) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}
