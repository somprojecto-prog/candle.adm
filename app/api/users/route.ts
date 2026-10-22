import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/users";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().trim().min(2, "Indique o nome."),
  email: z.string().trim().toLowerCase().email("Email inválido."),
  role: z.enum(["admin", "manager"]),
  password: z
    .string()
    .min(8, "A palavra-passe deve ter pelo menos 8 caracteres.")
    .max(72, "A palavra-passe é demasiado longa."),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        passwordHash: await hashPassword(parsed.data.password),
      },
      select: { id: true, name: true, email: true, role: true, active: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Já existe um utilizador com esse email." }, { status: 409 });
    }
    return NextResponse.json({ error: "Não foi possível criar o utilizador." }, { status: 500 });
  }
}
