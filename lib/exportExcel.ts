import type { Transaction } from "./types";

const HEADER_FILL = "FF2A78D6"; // series-1 blue, ARGB
const HEADER_FONT = "FFFFFFFF";

// "$" alone is ambiguous across USD/NZD/AUD/MXN/ARS, so only unambiguous
// symbols get one — everything else falls back to the plain ISO code.
const UNAMBIGUOUS_SYMBOL: Record<string, string> = { EUR: "€", GBP: "£" };

function excelAmountFormat(currency: string): string {
  const label = UNAMBIGUOUS_SYMBOL[currency] ?? currency;
  return `#,##0.00 "${label}";[Red]-#,##0.00 "${label}"`;
}

/**
 * Single "Transactions" sheet, deliberately plain — no Rules/Categories/
 * Dashboard tabs. The point is a clean table the user can pivot-table
 * themselves, not a pre-built report to maintain in two places.
 */
export async function exportTransactionsToExcel(transactions: Transaction[], currency: string = "EUR"): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Panel de Gastos";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Transactions", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Date", key: "date", width: 14 },
    { header: "Description", key: "description", width: 36 },
    { header: "Category", key: "category", width: 20 },
    { header: "Amount", key: "amount", width: 14 },
  ];

  const header = sheet.getRow(1);
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    cell.font = { bold: true, color: { argb: HEADER_FONT } };
    cell.alignment = { vertical: "middle" };
  });

  for (const t of transactions) {
    sheet.addRow({
      date: t.date || null,
      description: t.description,
      category: t.category,
      amount: t.amount,
    });
  }

  const amountCol = sheet.getColumn("amount");
  amountCol.numFmt = excelAmountFormat(currency);
  const dateCol = sheet.getColumn("date");
  dateCol.numFmt = "yyyy-mm-dd";

  sheet.autoFilter = { from: "A1", to: "D1" };

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `transacciones_${todayStamp()}.xlsx`
  );
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
