import { NextResponse, after } from "next/server";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { clientIp, limited } from "@/lib/rate-limit";
import { notifyNewRegistration } from "@/lib/push";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2, "Indique o seu nome.").max(80, "Nome demasiado longo."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email inválido.")
    .max(120, "Email demasiado longo."),
  password: z
    .string()
    .min(8, "A palavra-passe deve ter pelo menos 8 caracteres.")
    .max(100, "Palavra-passe demasiado longa."),
  website: z.string().optional(), // campo-armadilha para robôs
});

/** Público: cria um pedido de conta, que fica pendente até um administrador aprovar. */
export async function POST(req: Request) {
  if (limited(`register:${clientIp(req)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Demasiados pedidos. Tente novamente mais tarde." },
      { status: 429 },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }
  const { name, email, password, website } = parsed.data;

  // Robô: finge sucesso sem criar nada.
  if (website) return NextResponse.json({ ok: true }, { status: 201 });

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { name, email, passwordHash, role: "manager", active: false, pending: true },
    });
    const push = notifyNewRegistration(name, email);
    after(() => push);
    await Promise.race([push, new Promise((r) => setTimeout(r, 3000))]);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe uma conta ou um pedido com este email." },
        { status: 409 },
      );
    }
    console.error("ERRO_REGISTO:", e);
    return NextResponse.json(
      { error: "Não foi possível enviar o pedido. Tente novamente dentro de instantes." },
      { status: 500 },
    );
  }
}
