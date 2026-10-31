import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import LogoutButton from "./LogoutButton";
import OrderAlerts from "./OrderAlerts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  icons: { apple: "/icon-192.png" },
};

/** Pedidos de conta à espera de aprovação. Nunca falha a página. */
async function pendingCount(): Promise<number> {
  try {
    return await prisma.user.count({ where: { pending: true } });
  } catch {
    return 0;
  }
}

export default async function ManagerLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const pending = session.role === "admin" ? await pendingCount() : 0;

  return (
    <div className="min-h-screen">
      <header className="border-b border-gold-dim/30 bg-ink2">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-4 px-5 py-4 sm:px-8">
          <div className="flex items-baseline gap-6">
            <Link href="/manager" className="font-display text-xl text-gold">
              CTRL + SHIFT + CANDLE
            </Link>
            <nav className="flex items-center gap-5 font-body text-[0.65rem] uppercase tracking-[0.3em] text-gold-dim">
              <Link href="/manager" className="transition-colors hover:text-gold">
                Encomendas
              </Link>
              {session.role === "admin" && (
                <Link href="/manager/utilizadores" className="transition-colors hover:text-gold">
                  Utilizadores
                  {pending > 0 && (
                    <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-[0.6rem] tracking-normal text-ink">
                      {pending}
                    </span>
                  )}
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <p className="font-body text-xs text-gold/70">
              {session.name}
              <span className="ml-2 text-gold-dim">
                {session.role === "admin" ? "Administrador" : "Gestor"}
              </span>
            </p>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">{children}</main>
      <OrderAlerts />
    </div>
  );
}
