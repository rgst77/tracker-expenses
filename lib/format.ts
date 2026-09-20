// Common currencies a bank CSV might be in. Free-text entry covers anything
// else — this only changes how numbers are LABELED, never converts values.
export const CURRENCY_OPTIONS = [
  { code: "EUR", label: "EUR — Euro" },
  { code: "USD", label: "USD — Dólar estadounidense" },
  { code: "GBP", label: "GBP — Libra esterlina" },
  { code: "NZD", label: "NZD — Dólar neozelandés" },
  { code: "AUD", label: "AUD — Dólar australiano" },
  { code: "MXN", label: "MXN — Peso mexicano" },
  { code: "ARS", label: "ARS — Peso argentino" },
  { code: "CHF", label: "CHF — Franco suizo" },
];

// Picks a locale that formats each currency the way its own users expect
// (symbol placement, thousands/decimal separators) instead of forcing es-ES
// everywhere.
const LOCALE_BY_CURRENCY: Record<string, string> = {
  EUR: "es-ES",
  USD: "en-US",
  GBP: "en-GB",
  NZD: "en-NZ",
  AUD: "en-AU",
  MXN: "es-MX",
  ARS: "es-AR",
  CHF: "de-CH",
};

function localeFor(currency: string): string {
  return LOCALE_BY_CURRENCY[currency] ?? "es-ES";
}

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string, maximumFractionDigits?: number): Intl.NumberFormat {
  const key = `${currency}:${maximumFractionDigits ?? "default"}`;
  let fmt = formatterCache.get(key);
  if (!fmt) {
    try {
      fmt = new Intl.NumberFormat(localeFor(currency), {
        style: "currency",
        currency,
        ...(maximumFractionDigits !== undefined ? { maximumFractionDigits } : {}),
      });
    } catch {
      // An unrecognized ISO code (free-text entry) falls back to plain numbers + the code.
      fmt = new Intl.NumberFormat(localeFor(currency), {
        maximumFractionDigits: maximumFractionDigits ?? 2,
      });
    }
    formatterCache.set(key, fmt);
  }
  return fmt;
}

export function formatCurrency(n: number, currency: string = "EUR"): string {
  return getFormatter(currency, 0).format(n);
}

export function formatCurrencyPrecise(n: number, currency: string = "EUR"): string {
  return getFormatter(currency).format(n);
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
