import Papa from "papaparse";
import type { ColumnMapping, ParsedCsv } from "./types";

export function parseCsvText(text: string): ParsedCsv {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const headers = result.meta.fields ?? [];
  const rows = result.data.filter((row) =>
    headers.some((h) => (row[h] ?? "").trim() !== "")
  );

  return { headers, rows };
}

const DATE_HEADER_HINTS = /date|fecha|data/i;
const AMOUNT_HEADER_HINTS = /amount|importe|monto|valor|price|total/i;
const DESCRIPTION_HEADER_HINTS =
  /desc|payee|particular|concepto|detail|detalle|merchant|memo|reference/i;

const DATE_VALUE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}$/, // 2026-09-20
  /^\d{2}\/\d{2}\/\d{4}$/, // 20/09/2026
  /^\d{2}-\d{2}-\d{4}$/, // 20-09-2026
  /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,
];

function looksLikeDate(value: string): boolean {
  return DATE_VALUE_PATTERNS.some((p) => p.test(value.trim()));
}

function looksLikeAmount(value: string): boolean {
  const v = value.trim().replace(/[,$€\s]/g, "");
  if (v === "") return false;
  return /^-?\d+(\.\d+)?$/.test(v);
}

/**
 * Best-effort guess at which CSV column is which. Always returns a mapping
 * the user can override before import — banks name columns too inconsistently
 * to trust blindly.
 */
export function guessColumnMapping(parsed: ParsedCsv): ColumnMapping {
  const { headers, rows } = parsed;
  const sample = rows.slice(0, 20);

  function scoreColumn(header: string, byHeader: RegExp, byValue: (v: string) => boolean) {
    let score = byHeader.test(header) ? 5 : 0;
    const values = sample.map((r) => r[header] ?? "").filter((v) => v.trim() !== "");
    if (values.length > 0) {
      const matching = values.filter(byValue).length;
      score += (matching / values.length) * 3;
    }
    return score;
  }

  function bestColumn(byHeader: RegExp, byValue: (v: string) => boolean, exclude: Set<string>) {
    let best: string | null = null;
    let bestScore = 0;
    for (const h of headers) {
      if (exclude.has(h)) continue;
      const score = scoreColumn(h, byHeader, byValue);
      if (score > bestScore) {
        bestScore = score;
        best = h;
      }
    }
    return bestScore > 0 ? best : null;
  }

  const used = new Set<string>();

  const date = bestColumn(DATE_HEADER_HINTS, looksLikeDate, used);
  if (date) used.add(date);

  const amount = bestColumn(AMOUNT_HEADER_HINTS, looksLikeAmount, used);
  if (amount) used.add(amount);

  const description = bestColumn(DESCRIPTION_HEADER_HINTS, () => false, used);
  if (description) used.add(description);

  return { date, amount, description };
}

/** Normalizes common date formats to ISO yyyy-mm-dd. Returns "" if unparseable. */
export function normalizeDate(raw: string): string {
  const v = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  const slashOrDash = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slashOrDash) {
    const [, a, b] = slashOrDash;
    let year = slashOrDash[3];
    if (year.length === 2) year = `20${year}`;
    // Ambiguous dd/mm vs mm/dd — assume dd/mm/yyyy (most common outside the US),
    // the mapping-confirmation step lets the user fix this if it's wrong.
    const day = a.padStart(2, "0");
    const month = b.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return "";
}

export function normalizeAmount(raw: string): number {
  const cleaned = raw.trim().replace(/[$€\s]/g, "").replace(/,/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}
