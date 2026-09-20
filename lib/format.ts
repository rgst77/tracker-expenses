const currencyFmt = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const currencyFmtPrecise = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

export function formatCurrency(n: number): string {
  return currencyFmt.format(n);
}

export function formatCurrencyPrecise(n: number): string {
  return currencyFmtPrecise.format(n);
}

const MONTH_LABELS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/** "2026-09" -> "sep 2026" */
export function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const idx = parseInt(month, 10) - 1;
  return `${MONTH_LABELS[idx] ?? month} ${year}`;
}
