import { NextResponse } from "next/server";
import { authenticate } from "@/lib/users";
import { clientIp, limited } from "@/lib/rate-limit";
import { SESSION_COOKIE, cookieOptions, createSessionToken, type Role } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (limited(`login:${clientIp(req)}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Demasiadas tentativas. Tente novamente dentro de alguns minutos." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "Indique o email e a palavra-passe." }, { status: 400 });
  }

  try {
    const user = await authenticate(email, password);
    if (!user) {
      return NextResponse.json({ error: "Email ou palavra-passe incorretos." }, { status: 401 });
    }
    const token = await createSessionToken({
      uid: user.id,
      email: user.email,
      name: user.name,
      role: (user.role === "admin" ? "admin" : "manager") as Role,
    });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, token, cookieOptions);
    return res;
  } catch {
    return NextResponse.json(
      { error: "Erro no servidor. Confirme as variáveis de ambiente e a base de dados." },
      { status: 500 },
    );
  }
}
