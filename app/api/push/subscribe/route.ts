import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const subscribeSchema = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({
    p256dh: z.string().min(10).max(500),
    auth: z.string().min(5).max(500),
  }),
});

const unsubscribeSchema = z.object({ endpoint: z.string().url().max(2000) });

/** Regista este aparelho para receber avisos de novas encomendas. */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sem sessão iniciada." }, { status: 401 });

  const parsed = subscribeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Subscrição inválida." }, { status: 400 });
  }
  const { endpoint, keys } = parsed.data;
  const userAgent = (req.headers.get("user-agent") ?? "").slice(0, 300);

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId: session.uid, userAgent },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId: session.uid, userAgent },
  });
  return NextResponse.json({ ok: true });
}

/** Remove este aparelho. */
export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sem sessão iniciada." }, { status: 401 });

  const parsed = unsubscribeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  await prisma.pushSubscription.deleteMany({
    where: { endpoint: parsed.data.endpoint, userId: session.uid },
  });
  return NextResponse.json({ ok: true });
}
