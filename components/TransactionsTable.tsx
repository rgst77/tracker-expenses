"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";

const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

export function TransactionsTable() {
  const transactions = useAppStore((s) => s.transactions);
  const categories = useAppStore((s) => s.categories);
  const setTransactionCategory = useAppStore((s) => s.setTransactionCategory);
  const renameTransaction = useAppStore((s) => s.renameTransaction);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-50 dark:bg-zinc-900">
          <tr>
            <th className="px-3 py-2 font-medium">Fecha</th>
            <th className="px-3 py-2 font-medium">Descripción</th>
            <th className="px-3 py-2 font-medium">Categoría</th>
            <th className="px-3 py-2 text-right font-medium">Importe</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} className="border-t border-zinc-100 dark:border-zinc-800">
              <td className="whitespace-nowrap px-3 py-2 text-zinc-500">{t.date}</td>
              <td className="px-3 py-2">
                {editingId === t.id ? (
                  <input
                    autoFocus
                    defaultValue={t.description}
                    onBlur={(e) => {
                      renameTransaction(t.id, e.target.value);
                      setEditingId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="w-full rounded border border-blue-400 px-1 py-0.5"
                  />
                ) : (
                  <button
                    onClick={() => setEditingId(t.id)}
                    className="text-left hover:underline"
                    title="Haz clic para renombrar"
                  >
                    {t.description}
                  </button>
                )}
              </td>
              <td className="px-3 py-2">
                <select
                  value={t.category}
                  onChange={(e) => setTransactionCategory(t.id, e.target.value)}
                  className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                >
                  {categories.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </td>
              <td
                className={`whitespace-nowrap px-3 py-2 text-right font-medium ${
                  t.amount >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {currency.format(t.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
