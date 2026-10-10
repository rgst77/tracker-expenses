"use client";

import { useMemo, useState } from "react";
import type { ColumnMapping, ParsedCsv } from "@/lib/types";
import { CURRENCY_OPTIONS } from "@/lib/format";
import {
  detectDateOrder,
  detectDecimalSeparator,
  normalizeAmount,
  normalizeDate,
  type DateOrder,
  type DecimalSeparator,
} from "@/lib/csv";

interface Props {
  parsed: ParsedCsv;
  initialMapping: ColumnMapping;
  existingCount: number;
  existingCurrency: string;
  onConfirm: (mapping: ColumnMapping, currency: string, dateOrder: DateOrder, decimal: DecimalSeparator) => void;
  onCancel: () => void;
}

const FIELD_LABELS: { key: keyof ColumnMapping; label: string }[] = [
  { key: "date", label: "Fecha" },
  { key: "description", label: "Descripción" },
  { key: "amount", label: "Importe" },
];

const selectStyle = { borderColor: "var(--gridline)", background: "var(--surface-1)", color: "var(--text-primary)" };

function banner(hue: string) {
  return {
    border: `1px solid ${hue}`,
    background: `color-mix(in srgb, ${hue} 10%, var(--surface-1))`,
    color: "var(--text-primary)",
  };
}

export function ColumnMappingStep({
  parsed,
  initialMapping,
  existingCount,
  existingCurrency,
  onConfirm,
  onCancel,
}: Props) {
  const [mapping, setMapping] = useState(initialMapping);
  const [currency, setCurrency] = useState(existingCount > 0 ? existingCurrency : "EUR");
  const [chosenOrder, setChosenOrder] = useState<DateOrder | null>(null);
  const [chosenDecimal, setChosenDecimal] = useState<DecimalSeparator | null>(null);
  const previewRows = parsed.rows.slice(0, 5);

  const dateValues = useMemo(
    () => (mapping.date ? parsed.rows.map((r) => r[mapping.date!] ?? "") : []),
    [parsed.rows, mapping.date]
  );
  const dateGuess = useMemo(() => detectDateOrder(dateValues), [dateValues]);
  const hasSlashDates = dateValues.some((v) => /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(v.trim()));
  const dateOrder = chosenOrder ?? dateGuess.order;
  const sampleDate = dateValues.find((v) => /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(v.trim()));

  const amountValues = useMemo(
    () => (mapping.amount ? parsed.rows.map((r) => r[mapping.amount!] ?? "") : []),
    [parsed.rows, mapping.amount]
  );
  const decimal = chosenDecimal ?? detectDecimalSeparator(amountValues);
  const sampleAmount = amountValues.find((v) => /\d/.test(v));

  const isComplete = mapping.date && mapping.description && mapping.amount;
  const currencyMismatch = existingCount > 0 && currency !== existingCurrency;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Confirma qué columna es cuál
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Detectamos {parsed.rows.length} filas. Revisa que la detección automática sea correcta.
        </p>
        {existingCount > 0 && (
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Se añadirá a las {existingCount} transacciones que ya tienes cargadas (las filas idénticas a una
            ya existente se omiten automáticamente).
          </p>
        )}
      </div>

      {parsed.warnings.length > 0 && parsed.warnings[0].row === 0 && (
        <div className="rounded p-3 text-sm" style={banner("var(--series-1)")}>
          {parsed.warnings[0].message}.
        </div>
      )}

      {parsed.warnings.length > 0 && parsed.warnings[0].row !== 0 && (
        <div className="rounded p-3 text-sm" style={banner("var(--series-2)")}>
          <p className="font-medium">
            El archivo puede tener menos filas de las que debería — encontramos {parsed.warnings.length}{" "}
            {parsed.warnings.length === 1 ? "problema" : "problemas"} al leerlo:
          </p>
          <ul className="mt-1 list-disc pl-5">
            {parsed.warnings.map((w, i) => (
              <li key={i}>
                Fila {w.row}: {w.message}
              </li>
            ))}
          </ul>
          <p className="mt-1">
            Revisa esa fila en tu CSV original (ábrelo con un editor de texto) y vuelve a subirlo si faltan
            transacciones.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {FIELD_LABELS.map(({ key, label }) => (
          <label key={key} className="flex flex-col gap-1 text-sm">
            <span className="font-medium" style={{ color: "var(--text-primary)" }}>{label}</span>
            <select
              className="rounded border px-2 py-1.5"
              style={selectStyle}
              value={mapping[key] ?? ""}
              onChange={(e) =>
                setMapping((m) => ({ ...m, [key]: e.target.value || null }))
              }
            >
              <option value="">— sin asignar —</option>
              {parsed.headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium" style={{ color: "var(--text-primary)" }}>Moneda</span>
          <select
            className="rounded border px-2 py-1.5"
            style={selectStyle}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        {mapping.amount && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium" style={{ color: "var(--text-primary)" }}>Formato de importes</span>
            <select
              className="rounded border px-2 py-1.5"
              style={selectStyle}
              value={decimal}
              onChange={(e) => setChosenDecimal(e.target.value as DecimalSeparator)}
            >
              <option value=",">1.234,56 (coma decimal)</option>
              <option value=".">1,234.56 (punto decimal)</option>
            </select>
            {sampleAmount && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {sampleAmount} → {normalizeAmount(sampleAmount, decimal)}
              </span>
            )}
          </label>
        )}
        {hasSlashDates && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium" style={{ color: "var(--text-primary)" }}>Formato de fecha</span>
            <select
              className="rounded border px-2 py-1.5"
              style={selectStyle}
              value={dateOrder}
              onChange={(e) => setChosenOrder(e.target.value as DateOrder)}
            >
              <option value="dmy">Día / Mes / Año</option>
              <option value="mdy">Mes / Día / Año</option>
            </select>
            {sampleDate && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {sampleDate} → {normalizeDate(sampleDate, dateOrder) || "no válida"}
              </span>
            )}
          </label>
        )}
      </div>

      {hasSlashDates && dateGuess.ambiguous && chosenOrder === null && (
        <div className="rounded p-3 text-sm" style={banner("var(--series-2)")}>
          No podemos saber si tus fechas son día/mes o mes/día (ninguna tiene un número mayor que 12).
          Comprueba el formato de fecha de arriba: el ejemplo muestra cómo se leerá la primera.
        </div>
      )}

      {currencyMismatch && (
        <div className="rounded p-3 text-sm" style={banner("var(--series-8)")}>
          Tus datos ya cargados están en {existingCurrency}, pero elegiste {currency}. Los importes no se
          convierten entre monedas — si continúas se sumarían como si fueran la misma unidad. Cambia la
          moneda a {existingCurrency} para añadir estas transacciones, o empieza de cero si es un archivo en
          otra divisa.
        </div>
      )}

      <div className="overflow-x-auto rounded border" style={{ borderColor: "var(--gridline)" }}>
        <table className="w-full text-left text-sm">
          <thead style={{ background: "var(--background)" }}>
            <tr>
              {parsed.headers.map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-2 font-medium" style={{ color: "var(--text-primary)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, i) => (
              <tr key={i} className="border-t" style={{ borderColor: "var(--gridline)" }}>
                {parsed.headers.map((h) => (
                  <td key={h} className="whitespace-nowrap px-3 py-2" style={{ color: "var(--text-secondary)" }}>
                    {row[h]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="rounded border px-4 py-2 text-sm"
          style={{ borderColor: "var(--gridline)", color: "var(--text-primary)" }}
        >
          Cancelar
        </button>
        <button
          disabled={!isComplete || currencyMismatch}
          onClick={() => onConfirm(mapping, currency, dateOrder, decimal)}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {existingCount > 0 ? "Añadir" : "Importar"} {parsed.rows.length} transacciones
        </button>
      </div>
    </div>
  );
}
