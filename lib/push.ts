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

type Sub = { endpoint: string; p256dh: string; auth: string; userAgent?: string };
export type SendResult = { ok: boolean; status?: number };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function sendToSubs(subs: Sub[], payload: string): Promise<SendResult[]> {
  return Promise.all(
    subs.map(async (s): Promise<SendResult> => {
      const who = (s.userAgent ?? "").slice(0, 60) || new URL(s.endpoint).host;
      let code: number | undefined;
      // Até 3 tentativas para falhas passageiras (rede, 5xx, 429).
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
            { TTL: 60 * 60 * 24, urgency: "high" },
          );
          console.log(`PUSH ok (${who}) tentativa ${attempt}`);
          return { ok: true };
        } catch (e) {
          code = (e as { statusCode?: number })?.statusCode;
          if (code === 404 || code === 410) {
            console.warn(`PUSH registo expirado, removido (${who}) código ${code}`);
            await prisma.pushSubscription.deleteMany({ where: { endpoint: s.endpoint } });
            return { ok: false, status: code };
          }
          console.error(`PUSH falhou (${who}) tentativa ${attempt} código`, code ?? e);
          if (code === 401 || code === 403) break; // chaves erradas: repetir não ajuda
          if (attempt < 3) await sleep(500 * attempt);
        }
      }
      return { ok: false, status: code };
    }),
  );
}

/** Envia uma notificação de teste aos aparelhos do utilizador e diz o que aconteceu. */
export async function sendTestToUser(userId: string) {
  try {
    if (!configure()) return { configured: false, devices: 0, results: [] as SendResult[] };
    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    const results = await sendToSubs(
      subs,
      JSON.stringify({
        title: "CTRL + SHIFT + CANDLE",
        body: "Teste de notificação\nSe vê isto, está tudo a funcionar.",
        tag: "teste",
        icon: "/icon-order.png",
        badge: "/badge-order.png",
        url: "/manager",
      }),
    );
    return { configured: true, devices: subs.length, results };
  } catch (e) {
    console.error("ERRO_PUSH (teste):", e);
    return { configured: false, devices: 0, results: [] as SendResult[] };
  }
}

/** Aviso de nova encomenda a todos os aparelhos registados. Nunca lança erro. */
export async function notifyNewOrder(order: Order): Promise<void> {
  try {
    if (!configure()) return;
    const subs = await prisma.pushSubscription.findMany();
    console.log(`PUSH encomenda ${order.orderNumber}: ${subs.length} aparelho(s) registado(s)`);
    if (subs.length === 0) return;
    const results = await sendToSubs(
      subs,
      JSON.stringify({
        title: "CTRL + SHIFT + CANDLE",
        body: `Nova encomenda ${order.orderNumber}\n${order.customerName} · ${order.quantity} × · ${money(order.total)}`,
        tag: order.orderNumber,
        icon: "/icon-order.png",
        badge: "/badge-order.png",
        url: `/manager/${order.id}`,
      }),
    );
    console.log(`PUSH encomenda ${order.orderNumber}: resultado`, JSON.stringify(results));
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
        icon: "/icon-user.png",
        badge: "/badge-user.png",
        url: "/manager/utilizadores",
      }),
    );
  } catch (e) {
    console.error("ERRO_PUSH (registo):", e);
  }
}
