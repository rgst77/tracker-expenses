interface Props {
  label: string;
  value: string;
  tone?: "default" | "good" | "bad";
}

export function StatTile({ label, value, tone = "default" }: Props) {
  const valueColor =
    tone === "good" ? "var(--success-text)" : tone === "bad" ? "var(--series-8)" : "var(--text-primary)";

  return (
    <div
      className="rounded-lg p-4"
      style={{ background: "var(--surface-1)", border: "1px solid var(--gridline)" }}
    >
      <p
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold" style={{ color: valueColor }}>
        {value}
      </p>
    </div>
  );
}
