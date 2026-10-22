import Link from "next/link";
import { redirect } from "next/navigation";
import { needsSetup } from "@/lib/setup";
import SetupForm from "./SetupForm";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  let open: boolean | null = null;
  try {
    open = await needsSetup();
  } catch (e) {
    console.error("ERRO_PAINEL (configurar):", e);
  }
  if (open === false) redirect("/login");

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <p className="text-center font-body text-[0.65rem] uppercase tracking-[0.5em] text-gold-dim">
          CTRL + SHIFT + CANDLE
        </p>
        <h1 className="mt-3 text-center font-display text-4xl text-gold sm:text-5xl">
          Primeira conta
        </h1>
        {open === null ? (
          <div className="mt-10 rounded-2xl border border-gold-dim/50 bg-ink2 p-6 sm:p-8">
            <p role="alert" className="font-body text-sm leading-relaxed text-red-400">
              Não foi possível ligar à base de dados. Confirme DATABASE_URL e DIRECT_URL na
              Vercel e que o código supabase.sql foi executado no Supabase. Depois faça
              Redeploy e recarregue esta página.
            </p>
            <Link
              href="/configurar"
              className="mt-6 inline-block font-body text-xs uppercase tracking-[0.3em] text-gold-dim hover:text-gold"
            >
              Tentar de novo
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-4 text-center font-body text-sm leading-relaxed text-gold/70">
              Crie a conta de administrador. Depois adiciona gestores no painel.
            </p>
            <SetupForm needsCode={Boolean(process.env.SETUP_CODE)} />
          </>
        )}
      </div>
    </main>
  );
}
