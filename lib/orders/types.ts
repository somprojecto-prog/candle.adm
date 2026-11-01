export const ORDER_STATUSES = [
  "pendente",
  "confirmada",
  "enviada",
  "entregue",
  "cancelada",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const COUNTRIES = ["USA"] as const;
export type Country = (typeof COUNTRIES)[number];

export const PAYMENT_METHODS = ["online", "entrega"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["por_pagar", "paga", "expirada"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const MAX_QUANTITY = 10;

/** Preço unitário em dólares (USD). Define ORDER_UNIT_PRICE no .env (ex.: 49.99). */
const rawPrice = (process.env.ORDER_UNIT_PRICE ?? "0").replace(",", ".").replace(/[^0-9.]/g, "");
export const UNIT_PRICE = Number(rawPrice) || 0;

export type OrderAddress = {
  street: string;
  number: string;
  complement: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  phone: string;
  email: string;
  address: OrderAddress;
  quantity: number;
  notes: string;
  unitPrice: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};
