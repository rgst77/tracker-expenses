import Papa from "papaparse";
import type { ColumnMapping, ParsedCsv, ParseWarning } from "./types";

function runPapaParse(text: string, quoteChar: string) {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    quoteChar,
  });
  const headers = result.meta.fields ?? [];
  const rows = result.data.filter((row) =>
    headers.some((h) => (row[h] ?? "").trim() !== "")
  );
  return { headers, rows, errors: result.errors };
}

const SWALLOWING_ERROR_CODES = new Set(["MissingQuotes", "TooFewFields"]);

export function parseCsvText(text: string): ParsedCsv {
  const strict = runPapaParse(text, '"');
  const hasSwallowedRows = strict.errors.some((e) => SWALLOWING_ERROR_CODES.has(e.code));

  // A quote left unclosed in one field can swallow every row after it into
  // a single field. Bank exports rarely rely on real CSV quoting (their
  // fields don't contain literal commas), so when strict parsing looks
  // broken, retry treating '"' as an ordinary character and keep whichever
  // result actually recovered more rows.
  if (hasSwallowedRows) {
    const lenient = runPapaParse(text, "\0");
    if (lenient.rows.length > strict.rows.length) {
      return {
        headers: lenient.headers,
        rows: lenient.rows,
        warnings:
          strict.errors.length > 0
            ? [
                {
                  row: 0,
                  message: `detectamos comillas (") sueltas en el archivo — las tratamos como texto normal para no perder filas; revisa que las descripciones se vean bien`,
                },
              ]
            : [],
      };
    }
  }

  const warnings: ParseWarning[] = strict.errors.map((e) => ({
    row: e.row !== undefined ? e.row + 2 : 0, // +1 for the header row, +1 for 1-indexing
    message:
      e.code === "MissingQuotes"
        ? "comilla (\") sin cerrar en un campo — probablemente se comieron las filas siguientes"
        : e.message,
  }));

  return { headers: strict.headers, rows: strict.rows, warnings };
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
