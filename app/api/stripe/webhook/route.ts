import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { markOrderExpired, markOrderPaid } from "@/lib/orders/repository";
import { notifyNewOrder } from "@/lib/push";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** O Stripe chama aqui quando um pagamento é concluído ou expira. */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Webhook não configurado." }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, signature, secret);
  } catch (e) {
    console.error("STRIPE webhook: assinatura inválida", e);
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderNumber = session.metadata?.orderNumber ?? session.client_reference_id;
      if (orderNumber && session.payment_status === "paid") {
        const order = await markOrderPaid(orderNumber);
        if (order) {
          console.log(`STRIPE pago: ${orderNumber}`);
          await Promise.race([notifyNewOrder(order), new Promise((r) => setTimeout(r, 3000))]);
        }
      }
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderNumber = session.metadata?.orderNumber ?? session.client_reference_id;
      if (orderNumber) await markOrderExpired(orderNumber);
    }
  } catch (e) {
    console.error("STRIPE webhook: erro a tratar o evento", e);
    // 500 faz o Stripe tentar de novo mais tarde.
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
