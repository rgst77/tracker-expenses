import { renderToStaticMarkup } from "react-dom/server.browser";
import { createElement } from "react";
import { MonthlyBarChart } from "@/components/charts/MonthlyBarChart";
import { BalanceLineChart } from "@/components/charts/BalanceLineChart";
import { SavingsRateChart } from "@/components/charts/SavingsRateChart";
import { CategoryBars } from "@/components/charts/CategoryBars";
import {
  computeKpis,
  monthlySummaries,
  cumulativeBalance,
  monthlySavingsRate,
  categoryTotals,
  foldTail,
} from "./aggregate";
import { formatCurrency } from "./format";
import { UNCATEGORIZED } from "./categorize";
import type { Category, Transaction } from "./types";

/**
 * Renders the same chart components used on-screen to static SVG markup and
 * wraps them in a fully self-contained HTML file (styles inlined, no
 * external requests) — works offline, no server involved. Tooltips don't
 * fire in a static export (no React runtime shipped), but every value they'd
 * show is already direct-labeled on the chart, so nothing is lost.
 */
export function exportDashboardHtml(transactions: Transaction[], categories: Category[]): void {
  const kpis = computeKpis(transactions);
  const monthly = monthlySummaries(transactions);
  const balance = cumulativeBalance(monthly);
  const rate = monthlySavingsRate(monthly);
  const catTotals = foldTail(categoryTotals(transactions));
  const orderedExpenseCategories = categories
    .map((c) => c.name)
    .filter((n) => n !== "Ingresos" && n !== UNCATEGORIZED);

  const barChartHtml = renderToStaticMarkup(createElement(MonthlyBarChart, { data: monthly }));
  const balanceChartHtml = renderToStaticMarkup(createElement(BalanceLineChart, { data: balance }));
  const rateChartHtml = renderToStaticMarkup(createElement(SavingsRateChart, { data: rate }));
  const categoryChartHtml = renderToStaticMarkup(
    createElement(CategoryBars, { data: catTotals, orderedExpenseCategories })
  );

  const html = buildDocument({
    generatedAt: new Date().toLocaleString("es-ES"),
    transactionCount: transactions.length,
    kpis,
    barChartHtml,
    balanceChartHtml,
    rateChartHtml,
    categoryChartHtml,
  });

  downloadBlob(new Blob([html], { type: "text/html" }), `panel-gastos_${todayStamp()}.html`);
}

function buildDocument(args: {
  generatedAt: string;
  transactionCount: number;
  kpis: ReturnType<typeof computeKpis>;
  barChartHtml: string;
  balanceChartHtml: string;
  rateChartHtml: string;
  categoryChartHtml: string;
}): string {
  const { generatedAt, transactionCount, kpis, barChartHtml, balanceChartHtml, rateChartHtml, categoryChartHtml } = args;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Panel de Gastos</title>
<style>${DOCUMENT_CSS}</style>
</head>
<body>
  <header class="header">
    <span class="logo-dot" aria-hidden="true"></span>
    <div>
      <h1>Panel de Gastos</h1>
      <p class="muted">${transactionCount} transacciones · generado el ${escapeHtml(generatedAt)}</p>
    </div>
  </header>

  <main class="container">
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      ${statTile("Ingresos", formatCurrency(kpis.income), "good")}
      ${statTile("Gastos", formatCurrency(kpis.expense), "bad")}
      ${statTile("Balance", formatCurrency(kpis.balance), kpis.balance >= 0 ? "good" : "bad")}
      ${statTile("Tasa de ahorro", `${kpis.savingsRate.toFixed(1)}%`, "default")}
    </div>

    ${chartCard("Ingresos vs gastos por mes", "Comparación mensual", barChartHtml)}

    <div class="grid grid-cols-1 gap-6 lg-grid-cols-2">
      ${chartCard("Balance acumulado", "Evolución del ahorro total", balanceChartHtml)}
      ${chartCard("Tasa de ahorro", "Porcentaje ahorrado cada mes", rateChartHtml)}
    </div>

    ${chartCard("Gastos por categoría", "De mayor a menor", categoryChartHtml)}
  </main>
</body>
</html>`;
}

function statTile(label: string, value: string, tone: "default" | "good" | "bad"): string {
  const color = tone === "good" ? "var(--success-text)" : tone === "bad" ? "var(--series-8)" : "var(--text-primary)";
  const accent = tone === "good" ? "var(--success-text)" : tone === "bad" ? "var(--series-8)" : "var(--series-1)";
  return `<div class="rounded-xl p-4 card" style="border-top:3px solid ${accent}">
    <p class="text-xs font-medium uppercase tracking-wide muted">${escapeHtml(label)}</p>
    <p class="mt-1 text-2xl font-semibold" style="color:${color}">${escapeHtml(value)}</p>
  </div>`;
}

function chartCard(title: string, subtitle: string, bodyHtml: string): string {
  return `<div class="rounded-xl p-5 card">
    <p class="text-sm font-semibold">${escapeHtml(title)}</p>
    <p class="mb-3 text-xs muted">${escapeHtml(subtitle)}</p>
    ${bodyHtml}
  </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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

// Minimal hand-written CSS covering only the Tailwind utility classes the
// reused chart components render, plus the page's own chrome, plus the
// validated dataviz palette tokens (see app/globals.css for the source).
const DOCUMENT_CSS = `
:root {
  --background: #f9f9f7;
  --surface-1: #fcfcfb;
  --text-primary: #0b0b0b;
  --text-secondary: #52514e;
  --text-muted: #898781;
  --gridline: #e1e0d9;
  --baseline: #c3c2b7;
  --success-text: #006300;
  --series-1: #2a78d6; --series-2: #eb6834; --series-3: #1baf7a; --series-4: #eda100;
  --series-5: #e87ba4; --series-6: #008300; --series-7: #4a3aa7; --series-8: #e34948;
  --muted: #b2beca;
}
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0d0d0d; --surface-1: #1a1a19; --text-primary: #ffffff; --text-secondary: #c3c2b7;
    --text-muted: #898781; --gridline: #2c2c2a; --baseline: #383835; --success-text: #0ca30c;
    --series-1: #3987e5; --series-2: #d95926; --series-3: #199e70; --series-4: #c98500;
    --series-5: #d55181; --series-6: #008300; --series-7: #9085e9; --series-8: #e66767; --muted: #4a4a47;
  }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--background); color: var(--text-primary); font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
.muted { color: var(--text-muted); }
.card { background: var(--surface-1); border: 1px solid var(--gridline); box-shadow: 0 1px 2px rgba(11,11,11,0.04); }
.header { display: flex; align-items: center; gap: 12px; padding: 24px 32px; border-bottom: 1px solid var(--gridline); }
.header h1 { margin: 0; font-size: 1.5rem; font-weight: 700; letter-spacing: -0.01em; }
.header p { margin: 4px 0 0; font-size: 0.85rem; }
.logo-dot { display: inline-block; width: 36px; height: 36px; flex-shrink: 0; border-radius: 0.5rem; background: linear-gradient(135deg, var(--series-1), var(--series-6)); }
.container { max-width: 1024px; margin: 0 auto; padding: 24px 16px 48px; }
.container > * + * { margin-top: 32px; }

.relative { position: relative; }
.overflow-x-auto { overflow-x: auto; }
.rounded-lg { border-radius: 0.5rem; }
.rounded-xl { border-radius: 0.75rem; }
.rounded-sm { border-radius: 0.125rem; }
.p-4 { padding: 1rem; }
.p-5 { padding: 1.25rem; }
.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
.mb-3 { margin-bottom: 0.75rem; }
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-center { text-align: center; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.uppercase { text-transform: uppercase; }
.tracking-wide { letter-spacing: 0.025em; }
.inline-block { display: inline-block; }
.py-12 { padding-top: 3rem; padding-bottom: 3rem; }

.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.gap-1\\.5 { gap: 0.375rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }
.gap-8 { gap: 2rem; }
.h-2\\.5 { height: 0.625rem; }
.w-2\\.5 { width: 0.625rem; }

.grid { display: grid; }
.grid-cols-1 { grid-template-columns: minmax(0, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.gap-6 { gap: 1.5rem; }
@media (min-width: 640px) {
  .sm\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
@media (min-width: 1024px) {
  .lg-grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
`;
