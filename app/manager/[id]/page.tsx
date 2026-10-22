import Link from "next/link";
import { notFound } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import { dateTime, money } from "@/lib/format";
import { getOrder } from "@/lib/orders/repository";
import OrderEditor from "./OrderEditor";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/manager"
        className="font-body text-[0.65rem] uppercase tracking-[0.4em] text-gold-dim transition-colors hover:text-gold"
      >
        Voltar às encomendas
      </Link>

      <header className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl text-gold sm:text-5xl">{order.orderNumber}</h1>
        <StatusBadge status={order.status} />
      </header>

      <dl className="mt-8 grid grid-cols-2 gap-6 rounded-2xl border border-gold-dim/40 bg-ink2 p-6 sm:grid-cols-4">
        <div>
          <dt className="font-body text-[0.65rem] uppercase tracking-[0.2em] text-gold-dim">Criada</dt>
          <dd className="mt-1 font-body text-sm">{dateTime(order.createdAt)}</dd>
        </div>
        <div>
          <dt className="font-body text-[0.65rem] uppercase tracking-[0.2em] text-gold-dim">
            Atualizada
          </dt>
          <dd className="mt-1 font-body text-sm">{dateTime(order.updatedAt)}</dd>
        </div>
        <div>
          <dt className="font-body text-[0.65rem] uppercase tracking-[0.2em] text-gold-dim">Email</dt>
          <dd className="mt-1 break-all font-body text-sm">{order.email}</dd>
        </div>
        <div>
          <dt className="font-body text-[0.65rem] uppercase tracking-[0.2em] text-gold-dim">Total</dt>
          <dd className="mt-1 font-display text-xl">{money(order.total)}</dd>
        </div>
      </dl>

      <OrderEditor order={order} />
    </div>
  );
}
