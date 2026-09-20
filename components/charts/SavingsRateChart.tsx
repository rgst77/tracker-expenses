"use client";

import { useState } from "react";
import { formatMonth } from "@/lib/format";
import { ChartTooltip } from "./ChartTooltip";

interface Point {
  month: string;
  rate: number;
}

interface Props {
  data: Point[];
  targetRate?: number;
}

const HEIGHT = 280;
const PAD = { top: 16, right: 24, bottom: 32, left: 48 };

export function SavingsRateChart({ data, targetRate = 20 }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (data.length === 0) return <EmptyState />;

  const values = data.map((d) => d.rate);
  const axisMax = Math.max(targetRate, ...values, 10) * 1.2;
  const axisMin = Math.min(0, ...values);

  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const stepX = data.length > 1 ? 80 : 0;
  const width = PAD.left + PAD.right + Math.max(stepX * (data.length - 1), 120);

  function y(value: number) {
    return PAD.top + plotHeight - ((value - axisMin) / (axisMax - axisMin)) * plotHeight;
  }
  function x(i: number) {
    return data.length === 1 ? PAD.left + (width - PAD.left - PAD.right) / 2 : PAD.left + i * stepX;
  }

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.rate)}`).join(" ");
  const areaPath = `${linePath} L${x(data.length - 1)},${y(axisMin)} L${x(0)},${y(axisMin)} Z`;

  return (
    <div className="relative overflow-x-auto">
      <svg width={width} height={HEIGHT} role="img" aria-label="Tasa de ahorro mensual">
        <g pointerEvents="none">
          <line x1={PAD.left} x2={width - PAD.right} y1={y(0)} y2={y(0)} stroke="var(--baseline)" strokeWidth={1} />
          <text x={PAD.left - 8} y={y(0)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="var(--text-muted)">
            0%
          </text>
          <line
            x1={PAD.left}
            x2={width - PAD.right}
            y1={y(targetRate)}
            y2={y(targetRate)}
            stroke="var(--text-muted)"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          <text x={width - PAD.right} y={y(targetRate) - 6} textAnchor="end" fontSize={11} fill="var(--text-muted)">
            objetivo {targetRate}%
          </text>
        </g>

        <path d={areaPath} style={{ fill: "var(--series-6)", opacity: 0.1 }} pointerEvents="none" />
        <path
          d={linePath}
          style={{ fill: "none", stroke: "var(--series-6)", strokeWidth: 2, strokeLinejoin: "round", strokeLinecap: "round" }}
          pointerEvents="none"
        />

        {data.map((d, i) => (
          <g key={d.month}>
            <circle cx={x(i)} cy={y(d.rate)} r={5} style={{ fill: "var(--series-6)", stroke: "var(--surface-1)", strokeWidth: 2 }} pointerEvents="none" />
            <rect
              x={x(i) - stepX / 2}
              y={PAD.top}
              width={stepX || width}
              height={plotHeight}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              tabIndex={0}
            />
            <text x={x(i)} y={HEIGHT - PAD.bottom + 18} textAnchor="middle" fontSize={11} fill="var(--text-muted)" pointerEvents="none">
              {formatMonth(d.month)}
            </text>
          </g>
        ))}

        {hoverIdx !== null && (
          <line x1={x(hoverIdx)} x2={x(hoverIdx)} y1={PAD.top} y2={HEIGHT - PAD.bottom} stroke="var(--baseline)" strokeWidth={1} pointerEvents="none" />
        )}
      </svg>

      {hoverIdx !== null && (
        <ChartTooltip
          x={x(hoverIdx)}
          y={y(data[hoverIdx].rate) - 8}
          containerWidth={width}
          title={formatMonth(data[hoverIdx].month)}
          rows={[{ label: "Tasa de ahorro", value: `${data[hoverIdx].rate.toFixed(1)}%`, colorVar: "var(--series-6)" }]}
        />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <p className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
      Sin fechas suficientes para calcular la tasa de ahorro.
    </p>
  );
}
