import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { dateTime, money } from "@/lib/format";
import { listOrders, statusCounts } from "@/lib/orders/repository";
import { ORDER_STATUSES } from "@/lib/orders/types";
import { STATUS_LABEL, btnPrimary, inputCls, labelCls } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const [orders, counts] = await Promise.all([listOrders({ status, q }), statusCounts()]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const filtered = Boolean(status || q);

  return (
    <div>
      <h1 className="font-display text-3xl text-gold sm:text-4xl">Encomendas</h1>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Link
          href="/manager"
          className={`rounded-2xl border p-4 transition-colors hover:border-gold ${
            !status ? "border-gold bg-ink2" : "border-gold-dim/40"
          }`}
        >
          <p className="font-display text-3xl text-gold">{total}</p>
          <p className="mt-1 font-body text-[0.65rem] uppercase tracking-[0.2em] text-gold-dim">
            Todas
          </p>
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/manager?status=${s}`}
            className={`rounded-2xl border p-4 transition-colors hover:border-gold ${
              status === s ? "border-gold bg-ink2" : "border-gold-dim/40"
            }`}
          >
            <p className="font-display text-3xl text-gold">{counts[s] ?? 0}</p>
            <p className="mt-1 font-body text-[0.65rem] uppercase tracking-[0.2em] text-gold-dim">
              {STATUS_LABEL[s]}
            </p>
          </Link>
        ))}
      </div>

      <form method="get" className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="sm:w-56">
          <label htmlFor="status" className={labelCls}>
            Estado
          </label>
          <select id="status" name="status" defaultValue={status ?? ""} className={inputCls}>
            <option value="">Todos</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="q" className={labelCls}>
            Pesquisar
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Nome, telefone, email ou número"
            className={inputCls}
          />
        </div>
        <button type="submit" className={btnPrimary}>
          Filtrar
        </button>
      </form>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-gold-dim/40">
        <table className="w-full min-w-[720px] text-left font-body text-sm">
          <thead>
            <tr className="border-b border-gold-dim/40 bg-ink2 text-[0.65rem] uppercase tracking-[0.2em] text-gold-dim">
              <th className="px-4 py-3 font-normal">Número</th>
              <th className="px-4 py-3 font-normal">Data</th>
              <th className="px-4 py-3 font-normal">Cliente</th>
              <th className="px-4 py-3 font-normal">Telefone</th>
              <th className="px-4 py-3 text-right font-normal">Qtd.</th>
              <th className="px-4 py-3 text-right font-normal">Total</th>
              <th className="px-4 py-3 font-normal">Estado</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr
                key={o.id}
                className="border-b border-gold-dim/20 transition-colors last:border-0 hover:bg-ink2"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/manager/${o.id}`}
                    className="font-display text-base text-gold underline-offset-4 hover:underline"
                  >
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gold/70">{dateTime(o.createdAt)}</td>
                <td className="px-4 py-3">{o.customerName}</td>
                <td className="px-4 py-3 text-gold/70">{o.phone}</td>
                <td className="px-4 py-3 text-right">{o.quantity}</td>
                <td className="px-4 py-3 text-right">{money(o.total)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <p className="px-4 py-12 text-center font-body text-sm text-gold/70">
            {filtered
              ? "Nenhuma encomenda corresponde a este filtro. Limpe a pesquisa ou escolha outro estado."
              : "Ainda não há encomendas. Quando um cliente encomendar na loja, aparece aqui."}
          </p>
        )}
      </div>
    </div>
  );
}
