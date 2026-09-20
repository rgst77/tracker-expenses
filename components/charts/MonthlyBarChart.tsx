"use client";

import { useState } from "react";
import type { MonthlySummary } from "@/lib/aggregate";
import { formatCurrency, formatMonth } from "@/lib/format";
import { niceTicks } from "@/lib/chartScale";
import { ChartTooltip } from "./ChartTooltip";

interface Props {
  data: MonthlySummary[];
}

const HEIGHT = 280;
const PAD = { top: 16, right: 16, bottom: 32, left: 56 };
const BAR_MAX_WIDTH = 24;
const BAR_GAP = 2;

export function MonthlyBarChart({ data }: Props) {
  const [hover, setHover] = useState<{ x: number; y: number; month: string; series: "Ingresos" | "Gastos"; value: number } | null>(null);

  if (data.length === 0) {
    return <EmptyState />;
  }

  const maxValue = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  const ticks = niceTicks(maxValue);
  const axisMax = ticks[ticks.length - 1];

  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const groupWidth = 72;
  const width = PAD.left + PAD.right + data.length * groupWidth;

  function y(value: number) {
    return PAD.top + plotHeight - (value / axisMax) * plotHeight;
  }

  return (
    <div className="relative overflow-x-auto">
      <svg width={width} height={HEIGHT} role="img" aria-label="Ingresos y gastos por mes">
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--gridline)"
              strokeWidth={1}
            />
            <text x={PAD.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="var(--text-muted)">
              {formatCurrency(t)}
            </text>
          </g>
        ))}
        <line
          x1={PAD.left}
          x2={width - PAD.right}
          y1={y(0)}
          y2={y(0)}
          stroke="var(--baseline)"
          strokeWidth={1}
        />

        {data.map((d, i) => {
          const groupX = PAD.left + i * groupWidth;
          const barW = Math.min(BAR_MAX_WIDTH, groupWidth / 2 - BAR_GAP);
          const incomeX = groupX + groupWidth / 2 - barW - BAR_GAP / 2;
          const expenseX = groupX + groupWidth / 2 + BAR_GAP / 2;

          return (
            <g key={d.month}>
              <Bar
                x={incomeX}
                width={barW}
                top={y(d.income)}
                base={y(0)}
                colorVar="var(--series-1)"
                dimmed={hover !== null && !(hover.month === d.month && hover.series === "Ingresos")}
                onEnter={() =>
                  setHover({ x: incomeX + barW / 2, y: y(d.income), month: d.month, series: "Ingresos", value: d.income })
                }
                onLeave={() => setHover(null)}
              />
              <Bar
                x={expenseX}
                width={barW}
                top={y(d.expense)}
                base={y(0)}
                colorVar="var(--series-8)"
                dimmed={hover !== null && !(hover.month === d.month && hover.series === "Gastos")}
                onEnter={() =>
                  setHover({ x: expenseX + barW / 2, y: y(d.expense), month: d.month, series: "Gastos", value: d.expense })
                }
                onLeave={() => setHover(null)}
              />
              <text
                x={groupX + groupWidth / 2}
                y={HEIGHT - PAD.bottom + 18}
                textAnchor="middle"
                fontSize={11}
                fill="var(--text-muted)"
              >
                {formatMonth(d.month)}
              </text>
            </g>
          );
        })}
      </svg>

      <Legend />

      {hover && (
        <ChartTooltip
          x={hover.x}
          y={hover.y}
          containerWidth={width}
          title={formatMonth(hover.month)}
          rows={[
            {
              label: hover.series,
              value: formatCurrency(hover.value),
              colorVar: hover.series === "Ingresos" ? "var(--series-1)" : "var(--series-8)",
            },
          ]}
        />
      )}
    </div>
  );
}

function Bar({
  x,
  width,
  top,
  base,
  colorVar,
  dimmed,
  onEnter,
  onLeave,
}: {
  x: number;
  width: number;
  top: number;
  base: number;
  colorVar: string;
  dimmed: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const h = Math.max(0, base - top);
  const r = Math.min(4, h);
  return (
    <path
      d={roundedTopRect(x, top, width, h, r)}
      style={{ fill: colorVar, opacity: dimmed ? 0.45 : 1, transition: "opacity 120ms" }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      tabIndex={0}
    />
  );
}

function roundedTopRect(x: number, y: number, w: number, h: number, r: number): string {
  if (h <= 0) return "";
  return `M${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h} Z`;
}

function Legend() {
  return (
    <div className="mt-2 flex gap-4 text-xs" style={{ color: "var(--text-secondary)" }}>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--series-1)" }} />
        Ingresos
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--series-8)" }} />
        Gastos
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <p className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
      Sin fechas suficientes para agrupar por mes.
    </p>
  );
}
