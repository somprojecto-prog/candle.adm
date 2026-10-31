import type { Metadata } from "next";
import Link from "next/link";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = { title: "Criar conta | CTRL + SHIFT + CANDLE" };

export default function RegistoPage() {
  return (
    <main className="min-h-screen bg-[#0B0B0B] px-5 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-md">
        <p className="font-display text-xl tracking-[0.1em] text-[#C9A962]">CTRL + SHIFT + CANDLE</p>
        <h1 className="mt-8 font-display text-4xl text-[#C9A962]">Criar conta</h1>
        <p className="mt-3 font-body text-sm leading-relaxed text-[#C9A962]/70">
          Preencha os dados. A conta só fica activa depois de aprovada por um administrador.
        </p>
        <RegisterForm />
        <p className="mt-8 font-body text-xs text-[#8A7440]">
          Já tem conta?{" "}
          <Link href="/login" className="text-[#C9A962] underline underline-offset-4">
            Iniciar sessão
          </Link>
        </p>
      </div>
    </main>
  );
}
