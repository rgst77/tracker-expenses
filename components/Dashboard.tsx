"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import {
  computeKpis,
  monthlySummaries,
  cumulativeBalance,
  monthlySavingsRate,
  categoryTotals,
  foldTail,
} from "@/lib/aggregate";
import { formatCurrency } from "@/lib/format";
import { StatTile } from "./charts/StatTile";
import { MonthlyBarChart } from "./charts/MonthlyBarChart";
import { BalanceLineChart } from "./charts/BalanceLineChart";
import { SavingsRateChart } from "./charts/SavingsRateChart";
import { CategoryBars } from "./charts/CategoryBars";
import { UNCATEGORIZED } from "@/lib/categorize";

export function Dashboard() {
  const transactions = useAppStore((s) => s.transactions);
  const categories = useAppStore((s) => s.categories);
  const currency = useAppStore((s) => s.currency);

  const kpis = useMemo(() => computeKpis(transactions), [transactions]);
  const monthly = useMemo(() => monthlySummaries(transactions), [transactions]);
  const balance = useMemo(() => cumulativeBalance(monthly), [monthly]);
  const rate = useMemo(() => monthlySavingsRate(monthly), [monthly]);
  const catTotals = useMemo(() => foldTail(categoryTotals(transactions)), [transactions]);

  const orderedExpenseCategories = useMemo(
    () => categories.map((c) => c.name).filter((n) => n !== "Ingresos" && n !== UNCATEGORIZED),
    [categories]
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Ingresos" value={formatCurrency(kpis.income, currency)} tone="good" />
        <StatTile label="Gastos" value={formatCurrency(kpis.expense, currency)} tone="bad" />
        <StatTile label="Balance" value={formatCurrency(kpis.balance, currency)} tone={kpis.balance >= 0 ? "good" : "bad"} />
        <StatTile label="Tasa de ahorro" value={`${kpis.savingsRate.toFixed(1)}%`} />
      </div>

      <ChartCard title="Ingresos vs gastos por mes" subtitle="Comparación mensual">
        <MonthlyBarChart data={monthly} />
      </ChartCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Balance acumulado" subtitle="Evolución del ahorro total">
          <BalanceLineChart data={balance} />
        </ChartCard>

        <ChartCard title="Tasa de ahorro" subtitle="Porcentaje ahorrado cada mes">
          <SavingsRateChart data={rate} />
        </ChartCard>
      </div>

      <ChartCard title="Gastos por categoría" subtitle="De mayor a menor">
        <CategoryBars data={catTotals} orderedExpenseCategories={orderedExpenseCategories} />
      </ChartCard>
    </div>
  );
}

export function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5 transition-shadow hover:shadow-md"
      style={{ background: "var(--surface-1)", border: "1px solid var(--gridline)", boxShadow: "0 1px 2px rgba(11,11,11,0.04)" }}
    >
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</p>
      <p className="mb-3 text-xs" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
      {children}
    </div>
  );
}
