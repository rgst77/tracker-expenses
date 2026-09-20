interface Row {
  label: string;
  value: string;
  colorVar?: string;
}

interface Props {
  x: number;
  y: number;
  title: string;
  rows: Row[];
  /** Chart's own pixel width, so the tooltip clamps instead of clipping past the edge. */
  containerWidth?: number;
}

const HALF_WIDTH = 92; // half of the rendered box (min-width 140 + padding), plus a buffer
const MIN_Y = 56; // roughly one row's worth of box height, so "above the point" never clips the container top

// Positioned absolutely inside a `relative` chart container. Values lead,
// labels follow — see dataviz skill: interaction.md.
export function ChartTooltip({ x, y, title, rows, containerWidth }: Props) {
  const clampedX = containerWidth
    ? Math.min(Math.max(x, HALF_WIDTH), containerWidth - HALF_WIDTH)
    : x;
  const clampedY = Math.max(y, MIN_Y);

  return (
    <div
      className="pointer-events-none absolute z-10 min-w-[140px] rounded-md px-3 py-2 text-xs shadow-lg"
      style={{
        left: clampedX,
        top: clampedY,
        transform: "translate(-50%, -110%)",
        background: "var(--surface-1)",
        border: "1px solid var(--gridline)",
        color: "var(--text-primary)",
      }}
    >
      <p className="mb-1 font-medium" style={{ color: "var(--text-secondary)" }}>
        {title}
      </p>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2">
          {r.colorVar && (
            <span
              className="inline-block h-0.5 w-3 shrink-0"
              style={{ background: r.colorVar }}
            />
          )}
          <span className="flex-1" style={{ color: "var(--text-secondary)" }}>
            {r.label}
          </span>
          <span className="font-semibold tabular-nums">{r.value}</span>
        </div>
      ))}
    </div>
  );
}
