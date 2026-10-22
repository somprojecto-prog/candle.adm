"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, inputCls, labelCls } from "@/lib/ui";

export default function SetupForm({ needsCode }: { needsCode: boolean }) {
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "", code: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (f.password !== f.confirm) {
      setError("As palavras-passe não coincidem.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.name,
          email: f.email,
          password: f.password,
          code: f.code,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Não foi possível criar a conta. Tente novamente.");
        setBusy(false);
        return;
      }
      router.replace("/manager");
      router.refresh();
    } catch {
      setError("Sem ligação ao servidor. Verifique a internet e tente novamente.");
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="mt-10 space-y-6 rounded-2xl border border-gold-dim/50 bg-ink2 p-6 sm:p-8"
    >
      <div>
        <label htmlFor="name" className={labelCls}>
          Nome
        </label>
        <input id="name" autoComplete="name" value={f.name} onChange={set("name")} className={inputCls} />
      </div>
      <div>
        <label htmlFor="email" className={labelCls}>
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          value={f.email}
          onChange={set("email")}
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor="password" className={labelCls}>
          Palavra-passe (mín. 10 caracteres)
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={f.password}
          onChange={set("password")}
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor="confirm" className={labelCls}>
          Repetir palavra-passe
        </label>
        <input
          id="confirm"
          type="password"
          autoComplete="new-password"
          value={f.confirm}
          onChange={set("confirm")}
          className={inputCls}
        />
      </div>
      {needsCode && (
        <div>
          <label htmlFor="code" className={labelCls}>
            Código de configuração
          </label>
          <input id="code" value={f.code} onChange={set("code")} className={inputCls} />
        </div>
      )}
      {error && (
        <p role="alert" className="font-body text-xs text-red-400">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
        {busy ? "A criar..." : "Criar conta de administrador"}
      </button>
    </form>
  );
}
