import webpush from "web-push";
import { prisma } from "@/lib/db";
import type { Order } from "@/lib/orders/types";

let configured = false;

function configure(): boolean {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) {
    console.warn("PUSH: faltam NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY ou VAPID_SUBJECT.");
    return false;
  }
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

const money = (n: number) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "USD" }).format(n);

/** Envia o aviso de nova encomenda a todos os aparelhos registados. Nunca lança erro. */
export async function notifyNewOrder(order: Order): Promise<void> {
  try {
    if (!configure()) return;
    const subs = await prisma.pushSubscription.findMany();
    if (subs.length === 0) return;

    const payload = JSON.stringify({
      title: "CTRL + SHIFT + CANDLE",
      body: `Nova encomenda ${order.orderNumber}\n${order.customerName} · ${order.quantity} × · ${money(order.total)}`,
      tag: order.orderNumber,
      url: `/manager/${order.id}`,
    });

    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
            { TTL: 60 * 60 * 24, urgency: "high" },
          );
        } catch (e) {
          const code = (e as { statusCode?: number })?.statusCode;
          if (code === 404 || code === 410) {
            await prisma.pushSubscription.deleteMany({ where: { endpoint: s.endpoint } });
          } else {
            console.error("ERRO_PUSH (envio):", code ?? e);
          }
        }
      }),
    );
  } catch (e) {
    console.error("ERRO_PUSH:", e);
  }
}
