import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// DIAGNÓSTICO TEMPORÁRIO: apagar depois de resolver o problema.
// Só devolve sim/não e códigos de erro, nunca valores secretos.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function infoErro(e: unknown) {
  const err = e as { name?: string; code?: string };
  return { tipo: err?.name ?? "Erro", codigo: err?.code ?? null };
}

async function contar(prisma: PrismaClient, tabela: "Order" | "User") {
  try {
    const rows = await prisma.$queryRawUnsafe<{ n: number }[]>(
      `select count(*)::int as n from "${tabela}"`,
    );
    return { existe: true, linhas: rows[0]?.n ?? 0 };
  } catch (e) {
    return { existe: false, erro: infoErro(e) };
  }
}

export async function GET() {
  const env = process.env;
  const origin = env.STORE_ORIGIN ?? "";
  const dbUrl = env.DATABASE_URL ?? "";

  const variaveis = {
    DATABASE_URL_definida: dbUrl.length > 0,
    DATABASE_URL_tem_pgbouncer: dbUrl.includes("pgbouncer=true"),
    DATABASE_URL_porta_6543: dbUrl.includes(":6543"),
    DIRECT_URL_definida: (env.DIRECT_URL ?? "").length > 0,
    AUTH_SECRET_com_32_ou_mais: (env.AUTH_SECRET ?? "").length >= 32,
    STORE_ORIGIN: origin || null,
    STORE_ORIGIN_termina_com_barra: origin.endsWith("/"),
    STORE_ORIGIN_comeca_com_https: origin.startsWith("https://"),
    ORDER_UNIT_PRICE_definida: (env.ORDER_UNIT_PRICE ?? "").length > 0,
    CURRENCY_definida: (env.CURRENCY ?? "").length > 0,
    TIMEZONE_definida: (env.TIMEZONE ?? "").length > 0,
  };

  const prisma = new PrismaClient();
  try {
    let ligacao: { ok: boolean; erro?: ReturnType<typeof infoErro> } = {
      ok: true,
    };
    try {
      await prisma.$queryRaw`select 1`;
    } catch (e) {
      ligacao = { ok: false, erro: infoErro(e) };
    }

    const tabelas = ligacao.ok
      ? { Order: await contar(prisma, "Order"), User: await contar(prisma, "User") }
      : null;

    return NextResponse.json(
      { variaveis, ligacao_base_de_dados: ligacao, tabelas },
      { headers: { "Cache-Control": "no-store" } },
    );
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
