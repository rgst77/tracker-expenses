"use client";

import { useState } from "react";
import { formatCurrency, formatMonth } from "@/lib/format";
import { niceTicks } from "@/lib/chartScale";
import { useAppStore } from "@/lib/store";
import { ChartTooltip } from "./ChartTooltip";
import { labelEvery, useChartWidth } from "./useChartWidth";

interface Point {
  month: string;
  balance: number;
}

interface Props {
  data: Point[];
  /** Fixed width in px; omit to fill the container (the static export has no layout, so it passes one). */
  width?: number;
}

const HEIGHT = 280;
const PAD = { top: 16, right: 24, bottom: 32, left: 64 };

export function BalanceLineChart({ data, width: widthOverride }: Props) {
  const { ref, width } = useChartWidth(640, widthOverride);
  const currency = useAppStore((s) => s.currency);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div ref={ref}>
        <EmptyState />
      </div>
    );
  }

  const values = data.map((d) => d.balance);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const ticks = niceTicks(Math.max(Math.abs(min), Math.abs(max)));
  const axisMax = ticks[ticks.length - 1] || 1;
  const axisMin = min < 0 ? -axisMax : 0;

  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const plotWidth = Math.max(width - PAD.left - PAD.right, 40);
  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0;
  const labelStep = labelEvery(data.length > 1 ? stepX : plotWidth);

  function y(value: number) {
    return PAD.top + plotHeight - ((value - axisMin) / (axisMax - axisMin)) * plotHeight;
  }
  function x(i: number) {
    return data.length === 1 ? PAD.left + (width - PAD.left - PAD.right) / 2 : PAD.left + i * stepX;
  }

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.balance)}`).join(" ");
  const areaPath = `${linePath} L${x(data.length - 1)},${y(axisMin)} L${x(0)},${y(axisMin)} Z`;

  const displayTicks = axisMin < 0 ? [axisMin, ...ticks] : ticks;

  return (
    <div ref={ref} className="relative w-full">
      <svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} role="img" aria-label="Balance acumulado por mes">
        {displayTicks.map((t) => (
          <g key={t} pointerEvents="none">
            <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--gridline)" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="var(--text-muted)">
              {formatCurrency(t, currency)}
            </text>
          </g>
        ))}
        <line x1={PAD.left} x2={width - PAD.right} y1={y(0)} y2={y(0)} stroke="var(--baseline)" strokeWidth={1} pointerEvents="none" />

        <path d={areaPath} style={{ fill: "var(--series-1)", opacity: 0.1 }} pointerEvents="none" />
        <path d={linePath} style={{ fill: "none", stroke: "var(--series-1)", strokeWidth: 2, strokeLinejoin: "round", strokeLinecap: "round" }} pointerEvents="none" />

        {data.map((d, i) => (
          <g key={d.month}>
            <circle
              cx={x(i)}
              cy={y(d.balance)}
              r={5}
              style={{ fill: "var(--series-1)", stroke: "var(--surface-1)", strokeWidth: 2 }}
              pointerEvents="none"
            />
            <rect
              x={data.length > 1 ? x(i) - stepX / 2 : PAD.left}
              y={PAD.top}
              width={data.length > 1 ? stepX : plotWidth}
              height={plotHeight}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              tabIndex={0}
            />
            {(data.length - 1 - i) % labelStep === 0 && (
              <text x={x(i)} y={HEIGHT - PAD.bottom + 18} textAnchor="middle" fontSize={11} fill="var(--text-muted)" pointerEvents="none">
                {formatMonth(d.month)}
              </text>
            )}
          </g>
        ))}

        {hoverIdx !== null && (
          <line x1={x(hoverIdx)} x2={x(hoverIdx)} y1={PAD.top} y2={HEIGHT - PAD.bottom} stroke="var(--baseline)" strokeWidth={1} pointerEvents="none" />
        )}
      </svg>

      {hoverIdx !== null && (
        <ChartTooltip
          x={x(hoverIdx)}
          y={y(data[hoverIdx].balance) - 8}
          containerWidth={width}
          title={formatMonth(data[hoverIdx].month)}
          rows={[{ label: "Balance acumulado", value: formatCurrency(data[hoverIdx].balance, currency), colorVar: "var(--series-1)" }]}
        />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <p className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
      Sin fechas suficientes para calcular la evolución del balance.
    </p>
  );
}
