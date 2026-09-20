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

      <div className="overflow-x-auto rounded border" style={{ borderColor: "var(--gridline)" }}>
        <table className="w-full text-left text-sm">
          <thead style={{ background: "var(--background)" }}>
            <tr>
              <th className="px-3 py-2 font-medium" style={{ color: "var(--text-primary)" }}>Fecha</th>
              <th className="px-3 py-2 font-medium" style={{ color: "var(--text-primary)" }}>Descripción</th>
              <th className="px-3 py-2 font-medium" style={{ color: "var(--text-primary)" }}>Categoría</th>
              <th className="px-3 py-2 text-right font-medium" style={{ color: "var(--text-primary)" }}>Importe</th>
            </tr>
          </thead>
          <tbody>
            {visibleTransactions.map((t) => (
              <Fragment key={t.id}>
                <tr className="border-t" style={{ borderColor: "var(--gridline)" }}>
                  <td className="whitespace-nowrap px-3 py-2" style={{ color: "var(--text-muted)" }}>{t.date}</td>
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
                        className="w-full rounded border px-1 py-0.5"
                        style={{ borderColor: "var(--series-1)", background: "var(--surface-1)", color: "var(--text-primary)" }}
                      />
                    ) : (
                      <button
                        onClick={() => setEditingId(t.id)}
                        className="text-left hover:underline"
                        title="Haz clic para renombrar"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {t.description}
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={t.category}
                      onChange={(e) => handleCategoryChange(t.id, t.category, t.description, e.target.value)}
                      className="rounded border px-2 py-1 text-xs"
                      style={{ borderColor: "var(--gridline)", background: "var(--surface-1)", color: "var(--text-primary)" }}
                    >
                      {categories.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td
                    className="whitespace-nowrap px-3 py-2 text-right font-medium"
                    style={{ color: t.amount >= 0 ? "var(--success-text)" : "var(--series-8)" }}
                  >
                    {formatCurrencyPrecise(t.amount, currency)}
                  </td>
                </tr>
                {ruleSuggestion?.transactionId === t.id && (
                  <tr>
                    <td colSpan={4} className="border-t px-3 py-2" style={{ borderColor: "var(--gridline)" }}>
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
