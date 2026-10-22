import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/users";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  active: z.boolean().optional(),
  role: z.enum(["admin", "manager"]).optional(),
  password: z.string().min(8, "A palavra-passe deve ter pelo menos 8 caracteres.").max(72).optional(),
});

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  if (id === session.uid && (parsed.data.active === false || parsed.data.role === "manager")) {
    return NextResponse.json(
      { error: "Não pode desativar nem despromover a sua própria conta." },
      { status: 400 },
    );
  }

  const data: { active?: boolean; role?: string; passwordHash?: string } = {};
  if (parsed.data.active !== undefined) data.active = parsed.data.active;
  if (parsed.data.role) data.role = parsed.data.role;
  if (parsed.data.password) data.passwordHash = await hashPassword(parsed.data.password);

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, active: true },
    });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
  }
}
