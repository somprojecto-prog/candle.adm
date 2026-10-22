/** Só os sites listados em STORE_ORIGIN (separados por vírgula) podem enviar encomendas. */
export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  const allowed = (process.env.STORE_ORIGIN ?? "")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
  const headers: Record<string, string> = { Vary: "Origin" };
  if (origin && allowed.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Access-Control-Max-Age"] = "86400";
  }
  return headers;
}
