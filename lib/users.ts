import bcrypt from "bcryptjs";
import { prisma } from "./db";

/**
 * Valida email + password.
 * Se ainda não existir nenhum utilizador, o primeiro login com ADMIN_EMAIL /
 * ADMIN_PASSWORD (variáveis da Vercel) cria o administrador.
 */
export async function authenticate(email: string, password: string) {
  const e = email.trim().toLowerCase();
  let user = await prisma.user.findUnique({ where: { email: e } });

  if (!user) {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (
      adminEmail &&
      adminPassword &&
      e === adminEmail &&
      password === adminPassword &&
      (await prisma.user.count()) === 0
    ) {
      user = await prisma.user.create({
        data: {
          email: e,
          name: "Administrador",
          passwordHash: await bcrypt.hash(password, 12),
          role: "admin",
        },
      });
    }
  }

  if (!user || !user.active) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}
