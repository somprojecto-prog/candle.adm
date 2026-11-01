import Stripe from "stripe";
import type { Order } from "@/lib/orders/types";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY em falta.");
  if (!client) client = new Stripe(key);
  return client;
}

/**
 * Cria a página de pagamento do Stripe (cartões, Apple Pay, Google Pay e os
 * outros métodos ativos no painel do Stripe) e devolve o endereço para onde
 * enviar o cliente.
 */
export async function createCheckout(order: Order): Promise<{ id: string; url: string }> {
  const origin = (process.env.STORE_ORIGIN ?? "").replace(/\/+$/, "");
  if (!origin) throw new Error("STORE_ORIGIN em falta.");
  if (!(order.unitPrice > 0)) throw new Error("ORDER_UNIT_PRICE em falta ou inválido.");

  const orderRef = encodeURIComponent(order.orderNumber);
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: order.quantity,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(order.unitPrice * 100),
          product_data: { name: "Deep Work Candle" },
        },
      },
    ],
    customer_email: order.email,
    client_reference_id: order.orderNumber,
    metadata: { orderId: order.id, orderNumber: order.orderNumber },
    payment_intent_data: {
      description: `Encomenda ${order.orderNumber}`,
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
    },
    success_url: `${origin}/encomenda?pago=${orderRef}`,
    cancel_url: `${origin}/encomenda?cancelado=${orderRef}`,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
  });

  if (!session.url) throw new Error("O Stripe não devolveu o endereço de pagamento.");
  return { id: session.id, url: session.url };
}
