"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES, MAX_QUANTITY, ORDER_STATUSES, type Order } from "@/lib/orders/types";
import { STATUS_LABEL, btnPrimary, inputCls, labelCls } from "@/lib/ui";

function Field({ id, label, children, className = "" }: { id: string; label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function OrderEditor({ order }: { order: Order }) {
  const router = useRouter();
  const [f, setF] = useState({
    customerName: order.customerName,
    phone: order.phone,
    street: order.address.street,
    number: order.address.number,
    complement: order.address.complement,
    city: order.address.city,
    postalCode: order.address.postalCode,
    country: order.address.country,
    quantity: String(order.quantity),
    notes: order.notes,
    status: order.status as string,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => {
    setSaved(false);
    setF((p) => ({ ...p, [k]: e.target.value }));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(order.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: f.customerName,
          phone: f.phone,
          address: {
            street: f.street,
            number: f.number,
            complement: f.complement,
            city: f.city,
            postalCode: f.postalCode,
            country: f.country,
          },
          quantity: Number(f.quantity),
          notes: f.notes,
          status: f.status,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Não foi possível guardar. Tente novamente.");
      } else {
        setSaved(true);
        router.refresh();
      }
    } catch {
      setError("Sem ligação ao servidor. Verifique a internet e tente novamente.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-8 space-y-6">
      <Field id="status" label="Estado da encomenda">
        <select id="status" value={f.status} onChange={set("status")} className={inputCls}>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="customerName" label="Nome do cliente">
          <input id="customerName" value={f.customerName} onChange={set("customerName")} className={inputCls} />
        </Field>
        <Field id="phone" label="Telefone">
          <input id="phone" inputMode="tel" value={f.phone} onChange={set("phone")} className={inputCls} />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-6">
        <Field id="street" label="Rua" className="sm:col-span-4">
          <input id="street" value={f.street} onChange={set("street")} className={inputCls} />
        </Field>
        <Field id="number" label="Número" className="sm:col-span-2">
          <input id="number" value={f.number} onChange={set("number")} className={inputCls} />
        </Field>
        <Field id="complement" label="Complemento" className="sm:col-span-3">
          <input id="complement" value={f.complement} onChange={set("complement")} className={inputCls} />
        </Field>
        <Field id="city" label="Cidade" className="sm:col-span-3">
          <input id="city" value={f.city} onChange={set("city")} className={inputCls} />
        </Field>
        <Field id="postalCode" label="Código postal" className="sm:col-span-3">
          <input id="postalCode" value={f.postalCode} onChange={set("postalCode")} className={inputCls} />
        </Field>
        <Field id="country" label="País" className="sm:col-span-3">
          <select id="country" value={f.country} onChange={set("country")} className={inputCls}>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field id="quantity" label={`Quantidade (máx. ${MAX_QUANTITY})`} className="sm:w-48">
        <input
          id="quantity"
          type="number"
          min={1}
          max={MAX_QUANTITY}
          inputMode="numeric"
          value={f.quantity}
          onChange={set("quantity")}
          className={inputCls}
        />
      </Field>

      <Field id="notes" label="Notas">
        <textarea id="notes" rows={4} value={f.notes} onChange={set("notes")} className={inputCls} />
      </Field>

      {error && (
        <p role="alert" className="font-body text-xs text-red-400">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="font-body text-xs text-emerald-300">
          Alterações guardadas.
        </p>
      )}

      <button type="submit" disabled={busy} className={btnPrimary}>
        {busy ? "A guardar..." : "Guardar alterações"}
      </button>
    </form>
  );
}
