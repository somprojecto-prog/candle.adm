import { z } from "zod";
import { COUNTRIES, MAX_QUANTITY, ORDER_STATUSES, PAYMENT_METHODS } from "./types";

const cleanPhone = (v: string) => v.replace(/[\s.()-]/g, "");

const US_PHONE = /^(\+?1)?[2-9]\d{9}$/;

const stateRequired = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{2}$/, "Estado inválido. Use a sigla de 2 letras, por exemplo CA.")
  .transform((s) => s.toUpperCase());

const addressBase = z.object({
  street: z.string().trim().min(1, "Indique a rua."),
  number: z.string().trim().min(1, "Indique o número."),
  complement: z.string().trim().default(""),
  city: z.string().trim().min(1, "Indique a cidade."),
  postalCode: z.string().trim().default(""),
});

const createAddress = addressBase.extend({
  state: stateRequired,
  country: z.enum(COUNTRIES),
});

// Ao editar, aceita encomendas antigas (outros países) e não obriga o estado.
const updateAddress = addressBase.extend({
  state: z.union([stateRequired, z.literal("")]).optional(),
  country: z.string().trim().min(1, "Indique o país."),
});

const base = z.object({
  customerName: z.string().trim().min(3, "O nome deve ter pelo menos 3 caracteres."),
  phone: z.string().transform(cleanPhone),
  quantity: z
    .number()
    .int("A quantidade deve ser um número inteiro.")
    .min(1, "A quantidade mínima é 1.")
    .max(MAX_QUANTITY, `A quantidade máxima por encomenda é ${MAX_QUANTITY}.`),
  notes: z.string().trim().max(500, "As notas não podem ter mais de 500 caracteres.").default(""),
});

type Checked = { phone: string; address: { country: string; postalCode: string } };

function crossChecks(d: Checked, ctx: z.RefinementCtx) {
  const us = d.address.country === "USA";
  const phoneOk = us ? US_PHONE.test(d.phone) : /^\+?\d{7,15}$/.test(d.phone);
  if (!phoneOk) {
    ctx.addIssue({
      code: "custom",
      path: ["phone"],
      message: us
        ? "Telefone inválido. Use um número dos EUA com 10 dígitos."
        : "Telefone inválido.",
    });
  }
  const cp = d.address.postalCode;
  if (us) {
    if (!/^\d{5}(-\d{4})?$/.test(cp)) {
      ctx.addIssue({
        code: "custom",
        path: ["address", "postalCode"],
        message: "ZIP code inválido. Formato: 12345.",
      });
    }
  } else if (cp.length > 12) {
    ctx.addIssue({ code: "custom", path: ["address", "postalCode"], message: "Código postal demasiado longo." });
  }
}

export const createOrderSchema = base
  .extend({
    email: z.string().trim().toLowerCase().email("Email inválido."),
    address: createAddress,
    paymentMethod: z.enum(PAYMENT_METHODS).default("entrega"),
  })
  .superRefine(crossChecks);

export const updateOrderSchema = base
  .extend({ status: z.enum(ORDER_STATUSES), address: updateAddress })
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
