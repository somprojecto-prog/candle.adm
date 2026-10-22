import { z } from "zod";
import { COUNTRIES, MAX_QUANTITY, ORDER_STATUSES } from "./types";

const cleanPhone = (v: string) => v.replace(/[\s.-]/g, "");

function phoneOk(country: string, phone: string): boolean {
  if (country === "Portugal") return /^(\+351|00351)?[29]\d{8}$/.test(phone);
  if (country === "Angola") return /^(\+244|00244)?9\d{8}$/.test(phone);
  return false;
}

const address = z.object({
  street: z.string().trim().min(1, "Indique a rua."),
  number: z.string().trim().min(1, "Indique o número."),
  complement: z.string().trim().default(""),
  city: z.string().trim().min(1, "Indique a cidade."),
  postalCode: z.string().trim().default(""),
  country: z.enum(COUNTRIES),
});

const base = z.object({
  customerName: z.string().trim().min(3, "O nome deve ter pelo menos 3 caracteres."),
  phone: z.string().transform(cleanPhone),
  address,
  quantity: z
    .number()
    .int("A quantidade deve ser um número inteiro.")
    .min(1, "A quantidade mínima é 1.")
    .max(MAX_QUANTITY, `A quantidade máxima por encomenda é ${MAX_QUANTITY}.`),
  notes: z.string().trim().max(500, "As notas não podem ter mais de 500 caracteres.").default(""),
});

type Checked = { phone: string; address: { country: string; postalCode: string } };

function crossChecks(d: Checked, ctx: z.RefinementCtx) {
  if (!phoneOk(d.address.country, d.phone)) {
    ctx.addIssue({ code: "custom", path: ["phone"], message: "Telefone inválido para o país escolhido." });
  }
  const cp = d.address.postalCode;
  if (d.address.country === "Portugal") {
    if (!/^\d{4}-\d{3}$/.test(cp)) {
      ctx.addIssue({ code: "custom", path: ["address", "postalCode"], message: "Código postal inválido. Formato: 0000-000." });
    }
  } else if (cp.length > 12) {
    ctx.addIssue({ code: "custom", path: ["address", "postalCode"], message: "Código postal demasiado longo." });
  }
}

export const createOrderSchema = base
  .extend({ email: z.string().trim().toLowerCase().email("Email inválido.") })
  .superRefine(crossChecks);

export const updateOrderSchema = base
  .extend({ status: z.enum(ORDER_STATUSES) })
  .superRefine(crossChecks);

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

/** Primeira mensagem de erro, em português, para devolver ao cliente. */
export function firstError(error: z.ZodError): string {
  const issue = error.issues[0];
  return issue?.message && !/^Invalid|^Required|^Expected/i.test(issue.message)
    ? issue.message
    : "Dados inválidos. Verifique os campos e tente novamente.";
}
