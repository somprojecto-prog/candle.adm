import Link from "next/link";
import { needsSetup } from "@/lib/setup";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/manager") ? next : "/manager";
  const firstRun = await needsSetup().catch(() => false);

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <p className="text-center font-body text-[0.65rem] uppercase tracking-[0.5em] text-gold-dim">
          CTRL + SHIFT + CANDLE
        </p>
        <h1 className="mt-3 text-center font-display text-4xl text-gold sm:text-5xl">
          Painel de gestão
        </h1>
        <p className="mt-4 text-center font-body text-sm leading-relaxed text-gold/70">
          Acesso reservado a administradores e gestores.
        </p>
        {firstRun && (
          <p className="mt-6 text-center font-body text-sm text-gold/70">
            Ainda não existe nenhuma conta.{" "}
            <Link href="/configurar" className="text-gold underline underline-offset-4">
              Criar a conta de administrador
            </Link>
          </p>
        )}
        <LoginForm next={safeNext} />
      </div>
    </main>
  );
}
