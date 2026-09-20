interface Props {
  label: string;
  value: string;
  tone?: "default" | "good" | "bad";
}

export function StatTile({ label, value, tone = "default" }: Props) {
  const valueColor =
    tone === "good" ? "var(--success-text)" : tone === "bad" ? "var(--series-8)" : "var(--text-primary)";
  const accent = tone === "good" ? "var(--success-text)" : tone === "bad" ? "var(--series-8)" : "var(--series-1)";

  return (
    <div
      className="rounded-xl p-4 transition-shadow hover:shadow-md"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--gridline)",
        borderTop: `3px solid ${accent}`,
        boxShadow: "0 1px 2px rgba(11,11,11,0.04)",
      }}
    >
      <p
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums" style={{ color: valueColor }}>
        {value}
      </p>
    </div>
  );
}
