import type { Transaction } from "./types";
import { UNCATEGORIZED } from "./categorize";

export interface MonthlySummary {
  month: string; // yyyy-mm
  income: number;
  expense: number;
}

export interface CategoryTotal {
  category: string;
  total: number;
}

export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7); // "2026-09-20" -> "2026-09"
}

export function monthlySummaries(transactions: Transaction[]): MonthlySummary[] {
  const byMonth = new Map<string, { income: number; expense: number }>();

  for (const t of transactions) {
    if (!t.date) continue;
    const key = monthKey(t.date);
    const entry = byMonth.get(key) ?? { income: 0, expense: 0 };
    if (t.amount >= 0) entry.income += t.amount;
    else entry.expense += Math.abs(t.amount);
    byMonth.set(key, entry);
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, ...v }));
}

export function cumulativeBalance(summaries: MonthlySummary[]): { month: string; balance: number }[] {
  let running = 0;
  return summaries.map((s) => {
    running += s.income - s.expense;
    return { month: s.month, balance: running };
  });
}

export function categoryTotals(transactions: Transaction[]): CategoryTotal[] {
  const byCategory = new Map<string, number>();
  for (const t of transactions) {
    if (t.amount >= 0) continue;
    if (t.category === UNCATEGORIZED) continue;
    byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + Math.abs(t.amount));
  }
  return Array.from(byCategory.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export interface Kpis {
  income: number;
  expense: number;
  balance: number;
  savingsRate: number; // 0-100, 0 if no income
}

export function computeKpis(transactions: Transaction[]): Kpis {
  const income = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const balance = income - expense;
  const savingsRate = income > 0 ? (balance / income) * 100 : 0;
  return { income, expense, balance, savingsRate };
}

/** Folds everything past the token ceiling into "Otros" so a chart never seats more than 8 categorical slots. */
export function foldTail(totals: CategoryTotal[], cap = 7): CategoryTotal[] {
  if (totals.length <= cap) return totals;
  const head = totals.slice(0, cap);
  const tailSum = totals.slice(cap).reduce((s, c) => s + c.total, 0);
  return [...head, { category: "Otros", total: tailSum }];
}
