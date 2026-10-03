import type { Transaction } from "./types";

// Inverse of exportExcel.ts's UNAMBIGUOUS_SYMBOL map.
const SYMBOL_TO_CURRENCY: Record<string, string> = { "€": "EUR", "£": "GBP" };

/** The amount column's numFmt embeds the currency as a quoted literal (see exportExcel.ts) — read it back from there. */
function currencyFromNumFmt(numFmt: string | undefined): string | null {
  const match = numFmt?.match(/"([^"]+)"/);
  if (!match) return null;
  const label = match[1];
  return SYMBOL_TO_CURRENCY[label] ?? label; // anything else was already stored as its own ISO code
}

export interface ExcelRestoreResult {
  transactions: Transaction[];
  currency: string | null;
}

/**
 * Reads back a workbook this app exported (see exportExcel.ts) so a
 * previous download can serve as the user's own persistent archive across
 * sessions — we keep no server-side storage, so the file they already have
 * on disk is the continuity mechanism.
 */
export async function importTransactionsFromExcel(file: File): Promise<ExcelRestoreResult> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  const sheet = workbook.getWorksheet("Transactions");
  if (!sheet) {
    throw new Error('No se encontró una pestaña "Transactions" — ¿es un Excel exportado desde esta app?');
  }

  const headerRow = sheet.getRow(1).values as unknown[];
  const colIndex = (name: string) => headerRow.findIndex((h) => String(h ?? "").trim() === name);
  const dateCol = colIndex("Date");
  const descCol = colIndex("Description");
  const categoryCol = colIndex("Category");
  const amountCol = colIndex("Amount");

  if (dateCol < 0 || descCol < 0 || categoryCol < 0 || amountCol < 0) {
    throw new Error("El Excel no tiene las columnas esperadas (Date, Description, Category, Amount).");
  }

  const currency = currencyFromNumFmt(sheet.getColumn(amountCol).numFmt);

  const transactions: Transaction[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // header
    const description = String(row.getCell(descCol).value ?? "").trim();
    if (!description) return;

    transactions.push({
      id: crypto.randomUUID(),
      date: cellToIsoDate(row.getCell(dateCol).value),
      description,
      originalDescription: description,
      amount: Number(row.getCell(amountCol).value ?? 0),
      category: String(row.getCell(categoryCol).value ?? "").trim(),
    });
  });

  return { transactions, currency };
}

function cellToIsoDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  return "";
}
