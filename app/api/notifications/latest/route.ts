import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Usado pelo aviso dentro do admin: devolve a encomenda mais recente. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sem sessão iniciada." }, { status: 401 });

  const latest = await prisma.order.findFirst({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      quantity: true,
      total: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ latest });
}
