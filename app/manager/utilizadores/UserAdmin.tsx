"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { btnGhost, btnPrimary, inputCls, labelCls } from "@/lib/ui";

type U = { id: string; name: string; email: string; role: string; active: boolean };

export default function UserAdmin({ users, currentId }: { users: U[]; currentId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", role: "manager", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (!res || !res.ok) {
      setError(data?.error ?? "Não foi possível criar o utilizador.");
    } else {
      setOk("Utilizador criado.");
      setForm({ name: "", email: "", role: "manager", password: "" });
      router.refresh();
    }
    setBusy(false);
  }

  async function toggle(u: U) {
    setError(null);
    setOk(null);
    const res = await fetch(`/api/users/${encodeURIComponent(u.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !u.active }),
    }).catch(() => null);
    if (!res || !res.ok) {
      const data = await res?.json().catch(() => ({}));
      setError(data?.error ?? "Não foi possível atualizar o utilizador.");
    } else {
      router.refresh();
    }
  }

  return (
    <div className="mt-8 space-y-10">
      <ul className="divide-y divide-gold-dim/20 rounded-2xl border border-gold-dim/40">
        {users.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="font-body text-sm text-gold">
                {u.name}
                {u.id === currentId && <span className="ml-2 text-gold-dim">(você)</span>}
              </p>
              <p className="font-body text-xs text-gold/70">
                {u.email} · {u.role === "admin" ? "Administrador" : "Gestor"}
                {!u.active && " · Desativado"}
              </p>
            </div>
            {u.id !== currentId && (
              <button type="button" onClick={() => toggle(u)} className={`${btnGhost} !px-4 !py-2`}>
                {u.active ? "Desativar" : "Ativar"}
              </button>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={create} noValidate className="space-y-6 rounded-2xl border border-gold-dim/50 bg-ink2 p-6 sm:p-8">
        <h2 className="font-display text-2xl text-gold">Novo utilizador</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="u-name" className={labelCls}>Nome</label>
            <input id="u-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label htmlFor="u-email" className={labelCls}>Email</label>
            <input id="u-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label htmlFor="u-role" className={labelCls}>Função</label>
            <select id="u-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputCls}>
              <option value="manager">Gestor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div>
            <label htmlFor="u-pass" className={labelCls}>Palavra-passe (mín. 8)</label>
            <input id="u-pass" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} />
          </div>
        </div>
        {error && <p role="alert" className="font-body text-xs text-red-400">{error}</p>}
        {ok && <p role="status" className="font-body text-xs text-emerald-300">{ok}</p>}
        <button type="submit" disabled={busy} className={btnPrimary}>
          {busy ? "A criar..." : "Criar utilizador"}
        </button>
      </form>
    </div>
  );
}
