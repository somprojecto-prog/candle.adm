import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendTestToUser } from "@/lib/push";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Envia uma notificação de teste aos aparelhos de quem tem sessão iniciada. */
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sem sessão iniciada." }, { status: 401 });
  return NextResponse.json(await sendTestToUser(session.uid));
}
