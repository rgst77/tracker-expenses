"use client";

import { useState } from "react";
import type { CategoryTotal } from "@/lib/aggregate";
import { formatCurrency } from "@/lib/format";
import { categoryColorVar } from "@/lib/chartColors";
import { useAppStore } from "@/lib/store";
import { ChartTooltip } from "./ChartTooltip";

interface Props {
  data: CategoryTotal[];
  orderedExpenseCategories: string[];
}

const BAR_HEIGHT = 22;
const BAR_GAP = 10;
const PAD = { top: 8, right: 100, bottom: 8, left: 128 };

export function CategoryBars({ data, orderedExpenseCategories }: Props) {
  const currency = useAppStore((s) => s.currency);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (data.length === 0) return <EmptyState />;

  const maxValue = Math.max(...data.map((d) => d.total), 1);
  const width = 560;
  const plotWidth = width - PAD.left - PAD.right;
  const height = PAD.top + PAD.bottom + data.length * (BAR_HEIGHT + BAR_GAP) - BAR_GAP;

  function barWidth(value: number) {
    return (value / maxValue) * plotWidth;
  }

  return (
    <div className="relative overflow-x-auto">
      <svg width={width} height={height} role="img" aria-label="Gastos por categoría, de mayor a menor">
        {data.map((d, i) => {
          const y = PAD.top + i * (BAR_HEIGHT + BAR_GAP);
          const w = Math.max(2, barWidth(d.total));
          const colorVar = categoryColorVar(d.category, orderedExpenseCategories);
          const dimmed = hoverIdx !== null && hoverIdx !== i;
          return (
            <g key={d.category}>
              <text x={PAD.left - 10} y={y + BAR_HEIGHT / 2} textAnchor="end" dominantBaseline="middle" fontSize={12} fill="var(--text-primary)">
                {truncate(d.category, 16)}
              </text>
              <path
                d={roundedRightRect(PAD.left, y, w, BAR_HEIGHT, 4)}
                style={{ fill: colorVar, opacity: dimmed ? 0.45 : 1, transition: "opacity 120ms" }}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                tabIndex={0}
              />
              <text x={PAD.left + w + 8} y={y + BAR_HEIGHT / 2} dominantBaseline="middle" fontSize={12} fontWeight={600} fill="var(--text-primary)">
                {formatCurrency(d.total, currency)}
              </text>
            </g>
          );
        })}
      </svg>

      {hoverIdx !== null && (
        <ChartTooltip
          x={PAD.left + barWidth(data[hoverIdx].total) / 2}
          y={PAD.top + hoverIdx * (BAR_HEIGHT + BAR_GAP)}
          containerWidth={width}
          title={data[hoverIdx].category}
          rows={[{ label: "Gasto total", value: formatCurrency(data[hoverIdx].total, currency), colorVar: categoryColorVar(data[hoverIdx].category, orderedExpenseCategories) }]}
        />
      )}
    </div>
  );
}

function roundedRightRect(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, w, h / 2);
  return `M${x},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h - rr} Q${x + w},${y + h} ${x + w - rr},${y + h} L${x},${y + h} Z`;
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function EmptyState() {
  return (
    <p className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
      Todavía no hay gastos categorizados.
    </p>
  );
}
