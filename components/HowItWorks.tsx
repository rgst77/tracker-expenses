const STEPS = [
  {
    title: "Sube tu CSV",
    text: "Cualquier banco, cualquier moneda. Nada sale de tu navegador.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0 4 4m-4-4-4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    ),
  },
  {
    title: "Revisa y categoriza",
    text: "Los gráficos se actualizan al instante con cada cambio.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V9m6 8V5M3 17V13m0 4h18" />
    ),
  },
  {
    title: "Descarga tu informe",
    text: "Excel para tus propias tablas, o un HTML con el dashboard completo.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    ),
  },
];

export function HowItWorks() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {STEPS.map((step, i) => (
        <div
          key={step.title}
          className="flex flex-col gap-2 rounded-xl p-4"
          style={{ background: "var(--surface-1)", border: "1px solid var(--gridline)" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold"
              style={{ background: "var(--series-1)", color: "white" }}
            >
              {i + 1}
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
              {step.icon}
            </svg>
          </div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {step.title}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {step.text}
          </p>
        </div>
      ))}
    </div>
  );
}
