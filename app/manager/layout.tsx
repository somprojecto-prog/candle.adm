import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSession } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export const dynamic = "force-dynamic";

export default async function ManagerLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

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
    </div>
  );
}
