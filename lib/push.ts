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

type Sub = { endpoint: string; p256dh: string; auth: string };

async function sendToSubs(subs: Sub[], payload: string): Promise<void> {
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
}

/** Aviso de nova encomenda a todos os aparelhos registados. Nunca lança erro. */
export async function notifyNewOrder(order: Order): Promise<void> {
  try {
    if (!configure()) return;
    const subs = await prisma.pushSubscription.findMany();
    if (subs.length === 0) return;
    await sendToSubs(
      subs,
      JSON.stringify({
        title: "CTRL + SHIFT + CANDLE",
        body: `Nova encomenda ${order.orderNumber}\n${order.customerName} · ${order.quantity} × · ${money(order.total)}`,
        tag: order.orderNumber,
        url: `/manager/${order.id}`,
      }),
    );
  } catch (e) {
    console.error("ERRO_PUSH:", e);
  }
}

/** Aviso de pedido de conta, só para os administradores. Nunca lança erro. */
export async function notifyNewRegistration(name: string, email: string): Promise<void> {
  try {
    if (!configure()) return;
    const admins = await prisma.user.findMany({
      where: { role: "admin", active: true },
      select: { id: true },
    });
    if (admins.length === 0) return;
    const subs = await prisma.pushSubscription.findMany({
      where: { userId: { in: admins.map((a) => a.id) } },
    });
    if (subs.length === 0) return;
    await sendToSubs(
      subs,
      JSON.stringify({
        title: "CTRL + SHIFT + CANDLE",
        body: `Novo pedido de conta\n${name} · ${email}`,
        tag: `registo-${email}`,
        url: "/manager/utilizadores",
      }),
    );
  } catch (e) {
    console.error("ERRO_PUSH (registo):", e);
  }
}
