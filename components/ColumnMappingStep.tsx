"use client";

import { useState } from "react";
import type { ColumnMapping, ParsedCsv } from "@/lib/types";

interface Props {
  parsed: ParsedCsv;
  initialMapping: ColumnMapping;
  onConfirm: (mapping: ColumnMapping) => void;
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
  onConfirm,
  onCancel,
}: Props) {
  const [mapping, setMapping] = useState(initialMapping);
  const previewRows = parsed.rows.slice(0, 5);

  const isComplete = mapping.date && mapping.description && mapping.amount;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold">Confirma qué columna es cuál</h2>
        <p className="text-sm text-zinc-500">
          Detectamos {parsed.rows.length} filas. Revisa que la detección automática sea correcta.
        </p>
      </div>

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
      </div>

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
          disabled={!isComplete}
          onClick={() => onConfirm(mapping)}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Importar {parsed.rows.length} transacciones
        </button>
      </div>
    </div>
  );
}
