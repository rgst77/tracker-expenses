"use client";

import { useState } from "react";
import type { ColumnMapping, ParsedCsv } from "@/lib/types";
import { CURRENCY_OPTIONS } from "@/lib/format";

interface Props {
  parsed: ParsedCsv;
  initialMapping: ColumnMapping;
  existingCount: number;
  existingCurrency: string;
  onConfirm: (mapping: ColumnMapping, currency: string) => void;
  onCancel: () => void;
}

const FIELD_LABELS: { key: keyof ColumnMapping; label: string }[] = [
  { key: "date", label: "Fecha" },
  { key: "description", label: "Descripción" },
  { key: "amount", label: "Importe" },
];

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
  const previewRows = parsed.rows.slice(0, 5);

  const isComplete = mapping.date && mapping.description && mapping.amount;
  const currencyMismatch = existingCount > 0 && currency !== existingCurrency;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold">Confirma qué columna es cuál</h2>
        <p className="text-sm text-zinc-500">
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
        <div className="rounded border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-200">
          {parsed.warnings[0].message}.
        </div>
      )}

      {parsed.warnings.length > 0 && parsed.warnings[0].row !== 0 && (
        <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
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
            <span className="font-medium">{label}</span>
            <select
              className="rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
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
          <span className="font-medium">Moneda</span>
          <select
            className="rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
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
      </div>

      {currencyMismatch && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-200">
          Tus datos ya cargados están en {existingCurrency}, pero elegiste {currency}. Los importes no se
          convierten entre monedas — si continúas se sumarían como si fueran la misma unidad. Cambia la
          moneda a {existingCurrency} para añadir estas transacciones, o empieza de cero si es un archivo en
          otra divisa.
        </div>
      )}

      <div className="overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              {parsed.headers.map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, i) => (
              <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
                {parsed.headers.map((h) => (
                  <td key={h} className="whitespace-nowrap px-3 py-2 text-zinc-600 dark:text-zinc-400">
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
          className="rounded border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
        >
          Cancelar
        </button>
        <button
          disabled={!isComplete || currencyMismatch}
          onClick={() => onConfirm(mapping, currency)}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {existingCount > 0 ? "Añadir" : "Importar"} {parsed.rows.length} transacciones
        </button>
      </div>
    </div>
  );
}
