import type { OrderStatus } from "@/lib/orders/types";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/ui";

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 font-body text-[0.65rem] uppercase tracking-[0.2em] ${
        STATUS_STYLE[status] ?? "border-gold-dim/50 text-gold-dim"
      }`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
