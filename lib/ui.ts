import type { OrderStatus } from "@/lib/orders/types";

// Estilos iguais aos do formulário da loja.
export const labelCls =
  "mb-2 block font-body text-[0.65rem] uppercase tracking-[0.3em] text-gold-dim";

export const inputCls =
  "w-full rounded-xl border border-gold-dim/50 bg-ink2 px-4 py-3 font-body text-sm text-gold placeholder:text-gold-dim/70 transition-colors focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";

export const btnPrimary =
  "inline-flex items-center justify-center rounded-full bg-gold px-8 py-3.5 font-body text-xs uppercase tracking-[0.3em] text-ink transition-all duration-300 hover:bg-gold-light hover:shadow-[0_0_40px_rgba(201,169,98,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50";

export const btnGhost =
  "inline-flex items-center justify-center rounded-full border border-gold-dim/50 px-6 py-3 font-body text-xs uppercase tracking-[0.3em] text-gold-dim transition-colors hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pendente: "Pendente",
  confirmada: "Confirmada",
  enviada: "Enviada",
  entregue: "Entregue",
  cancelada: "Cancelada",
};

export const STATUS_STYLE: Record<OrderStatus, string> = {
  pendente: "border-gold/60 text-gold",
  confirmada: "border-sky-400/50 text-sky-300",
  enviada: "border-violet-400/50 text-violet-300",
  entregue: "border-emerald-400/50 text-emerald-300",
  cancelada: "border-red-400/50 text-red-400",
};
