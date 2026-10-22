export function money(n: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: process.env.CURRENCY ?? "EUR",
  }).format(n);
}

export function dateTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: process.env.TIMEZONE ?? "Europe/Lisbon",
  }).format(new Date(iso));
}
