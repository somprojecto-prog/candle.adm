import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");

  // A loja envia encomendas sem sessão (POST) e faz o pedido prévio do browser (OPTIONS).
  if (pathname === "/api/orders" && (req.method === "POST" || req.method === "OPTIONS")) {
    return NextResponse.next();
  }

  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    if (isApi) return NextResponse.json({ error: "Sem sessão iniciada." }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const adminOnly =
    pathname.startsWith("/manager/utilizadores") || pathname.startsWith("/api/users");
  if (adminOnly && session.role !== "admin") {
    if (isApi) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    return NextResponse.redirect(new URL("/manager", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/manager/:path*",
    "/api/orders",
    "/api/orders/:path*",
    "/api/users",
    "/api/users/:path*",
  ],
};
