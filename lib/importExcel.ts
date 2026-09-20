import type { Transaction } from "./types";

/**
 * Reads back a workbook this app exported (see exportExcel.ts) so a
 * previous download can serve as the user's own persistent archive across
 * sessions — we keep no server-side storage, so the file they already have
 * on disk is the continuity mechanism.
 */
export async function importTransactionsFromExcel(file: File): Promise<Transaction[]> {
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

  return transactions;
}

function cellToIsoDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  return "";
}
