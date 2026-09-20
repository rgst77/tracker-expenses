"use client";

import { Fragment, useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { formatCurrencyPrecise } from "@/lib/format";
import { UNCATEGORIZED } from "@/lib/categorize";

/** First word (or first two, if the first is a short stopword-like fragment) as a starting guess — editable before saving. */
function suggestKeyword(description: string): string {
  const words = description.trim().split(/\s+/);
  const first = words[0] ?? "";
  const guess = first.length < 4 && words[1] ? `${first} ${words[1]}` : first;
  return guess.toLowerCase().replace(/[^a-z0-9 ]/g, "");
}

export function TransactionsTable() {
  const transactions = useAppStore((s) => s.transactions);
  const categories = useAppStore((s) => s.categories);
  const currency = useAppStore((s) => s.currency);
  const setTransactionCategory = useAppStore((s) => s.setTransactionCategory);
  const renameTransaction = useAppStore((s) => s.renameTransaction);
  const addRule = useAppStore((s) => s.addRule);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [onlyUncategorized, setOnlyUncategorized] = useState(false);
  const [ruleSuggestion, setRuleSuggestion] = useState<{
    transactionId: string;
    keyword: string;
    category: string;
  } | null>(null);

  const uncategorizedCount = useMemo(
    () => transactions.filter((t) => t.category === UNCATEGORIZED).length,
    [transactions]
  );

  const visibleTransactions = onlyUncategorized
    ? transactions.filter((t) => t.category === UNCATEGORIZED)
    : transactions;

  function handleCategoryChange(transactionId: string, previousCategory: string, description: string, newCategory: string) {
    setTransactionCategory(transactionId, newCategory);
    if (previousCategory === UNCATEGORIZED && newCategory !== UNCATEGORIZED) {
      setRuleSuggestion({ transactionId, keyword: suggestKeyword(description), category: newCategory });
    } else if (ruleSuggestion?.transactionId === transactionId) {
      setRuleSuggestion(null);
    }
  }

  function confirmRuleSuggestion() {
    if (!ruleSuggestion || !ruleSuggestion.keyword.trim()) return;
    addRule(ruleSuggestion.keyword.trim(), ruleSuggestion.category);
    setRuleSuggestion(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
        <input
          type="checkbox"
          checked={onlyUncategorized}
          onChange={(e) => setOnlyUncategorized(e.target.checked)}
        />
        Mostrar solo sin categorizar ({uncategorizedCount})
      </label>

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
            {visibleTransactions.map((t) => (
              <Fragment key={t.id}>
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
                      onChange={(e) => handleCategoryChange(t.id, t.category, t.description, e.target.value)}
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
                    {formatCurrencyPrecise(t.amount, currency)}
                  </td>
                </tr>
                {ruleSuggestion?.transactionId === t.id && (
                  <tr>
                    <td colSpan={4} className="border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">
                      <div
                        className="flex flex-wrap items-center gap-2 rounded p-2 text-xs"
                        style={{ background: "var(--surface-1)", border: "1px solid var(--gridline)" }}
                      >
                        <span style={{ color: "var(--text-secondary)" }}>
                          ¿Recordar para futuras subidas? Si la descripción contiene
                        </span>
                        <input
                          value={ruleSuggestion.keyword}
                          onChange={(e) => setRuleSuggestion({ ...ruleSuggestion, keyword: e.target.value })}
                          className="rounded border px-1.5 py-0.5"
                          style={{ borderColor: "var(--gridline)" }}
                        />
                        <span style={{ color: "var(--text-secondary)" }}>
                          → <strong>{ruleSuggestion.category}</strong>
                        </span>
                        <button
                          onClick={confirmRuleSuggestion}
                          className="rounded bg-blue-600 px-2 py-1 font-medium text-white"
                        >
                          Guardar regla
                        </button>
                        <button
                          onClick={() => setRuleSuggestion(null)}
                          style={{ color: "var(--text-muted)" }}
                        >
                          Ignorar
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
