"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

const input =
  "w-full rounded-lg border border-[#8A7440]/50 bg-[#111111] px-4 py-3 font-body text-sm text-[#C9A962] placeholder:text-[#8A7440]/70 focus:border-[#C9A962] focus:outline-none";
const label =
  "mb-2 block font-body text-[0.65rem] uppercase tracking-[0.3em] text-[#8A7440]";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);

    if (name.trim().length < 2) return setError("Indique o seu nome.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))
      return setError("Email inválido. Exemplo: nome@exemplo.pt");
    if (password.length < 8)
      return setError("A palavra-passe deve ter pelo menos 8 caracteres.");
    if (password !== confirm) return setError("As palavras-passe não coincidem.");

    setBusy(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, website }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Não foi possível enviar o pedido. Tente novamente.",
        );
        return;
      }
      setDone(true);
    } catch {
      setError("Sem ligação ao servidor. Verifique a internet e tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="mt-10 rounded-2xl border border-[#8A7440]/50 bg-[#111111] p-6">
        <p className="font-body text-[0.65rem] uppercase tracking-[0.4em] text-[#8A7440]">
          Pedido enviado
        </p>
        <p className="mt-3 font-display text-2xl text-[#C9A962]">Obrigado, {name.trim().split(" ")[0]}.</p>
        <p className="mt-3 font-body text-sm leading-relaxed text-[#C9A962]/70">
          Um administrador vai analisar o seu pedido. Depois de aprovado, poderá iniciar sessão
          com o email {email.trim().toLowerCase()}.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-full bg-[#C9A962] px-8 py-3 font-body text-xs uppercase tracking-[0.4em] text-[#0B0B0B] hover:bg-[#D9BC7C]"
        >
          Ir para o início de sessão
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-10 space-y-5">
      <div>
        <label htmlFor="name" className={label}>Nome</label>
        <input id="name" className={input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </div>
      <div>
        <label htmlFor="email" className={label}>Email</label>
        <input id="email" type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>
      <div>
        <label htmlFor="password" className={label}>Palavra-passe</label>
        <input id="password" type="password" className={input} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
      </div>
      <div>
        <label htmlFor="confirm" className={label}>Repetir palavra-passe</label>
        <input id="confirm" type="password" className={input} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
      </div>

      {/* Campo-armadilha: invisível para pessoas */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-400/60 px-4 py-3 font-body text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-[#C9A962] px-10 py-4 font-body text-xs uppercase tracking-[0.4em] text-[#0B0B0B] transition-all hover:bg-[#D9BC7C] disabled:opacity-60"
      >
        {busy ? "A enviar…" : "Pedir conta"}
      </button>
    </form>
  );
}
