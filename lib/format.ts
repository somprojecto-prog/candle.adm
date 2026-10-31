/** Aceita só um código de moeda válido (ex.: EUR, USD). Qualquer outra coisa → EUR. */
function currencyCode(): string {
  const raw = (process.env.CURRENCY ?? "").trim().toUpperCase();
  const code = raw.match(/[A-Z]{3}/)?.[0] ?? "EUR";
  try {
    new Intl.NumberFormat("pt-PT", { style: "currency", currency: code });
    return code;
  } catch {
    return "EUR";
  }
}

export function money(n: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: currencyCode(),
  }).format(n);
}

export function dateTime(iso: string): string {
  const options: Intl.DateTimeFormatOptions = { dateStyle: "short", timeStyle: "short" };
  try {
    return new Intl.DateTimeFormat("pt-PT", {
      ...options,
      timeZone: process.env.TIMEZONE?.trim() || "Europe/Lisbon",
    }).format(new Date(iso));
  } catch {
    return new Intl.DateTimeFormat("pt-PT", options).format(new Date(iso));
  }
}
