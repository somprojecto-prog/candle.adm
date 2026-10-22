import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { describeServerError } from "@/lib/errors";
import { clientIp, limited } from "@/lib/rate-limit";
import { SESSION_COOKIE, cookieOptions, createSessionToken } from "@/lib/session";
import { hashPassword } from "@/lib/users";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(2, "Indique o seu nome."),
  email: z.string().trim().toLowerCase().email("Email inválido."),
  password: z
    .string()
    .min(10, "A palavra-passe deve ter pelo menos 10 caracteres.")
    .max(72, "A palavra-passe é demasiado longa."),
  code: z.string().optional(),
});

/** Cria a PRIMEIRA conta (administrador). Só funciona enquanto não existir nenhum utilizador. */
export async function POST(req: Request) {
  if (limited(`setup:${clientIp(req)}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Demasiadas tentativas. Tente novamente dentro de alguns minutos." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const required = process.env.SETUP_CODE;
  if (required && parsed.data.code !== required) {
    return NextResponse.json({ error: "Código de configuração incorreto." }, { status: 403 });
  }

  try {
    if ((await prisma.user.count()) > 0) {
      return NextResponse.json(
        { error: "A conta de administrador já foi criada. Entre em /login." },
        { status: 403 },
      );
    }
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: "admin",
        passwordHash: await hashPassword(parsed.data.password),
      },
    });
    const token = await createSessionToken({
      uid: user.id,
      email: user.email,
      name: user.name,
      role: "admin",
    });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, token, cookieOptions);
    return res;
  } catch (e) {
    console.error("ERRO_PAINEL (setup):", e);
    return NextResponse.json({ error: describeServerError(e) }, { status: 500 });
  }
}
