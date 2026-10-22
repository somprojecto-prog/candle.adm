import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/manager") ? next : "/manager";

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
        <LoginForm next={safeNext} />
      </div>
    </main>
  );
}
