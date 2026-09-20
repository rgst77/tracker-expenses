"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { categoryColorVar } from "@/lib/chartColors";
import { UNCATEGORIZED } from "@/lib/categorize";

const PROTECTED = new Set(["Ingresos", UNCATEGORIZED]);

export function CategoryManager() {
  const categories = useAppStore((s) => s.categories);
  const rules = useAppStore((s) => s.rules);
  const addCategory = useAppStore((s) => s.addCategory);
  const renameCategory = useAppStore((s) => s.renameCategory);
  const removeCategory = useAppStore((s) => s.removeCategory);
  const addRule = useAppStore((s) => s.addRule);
  const removeRule = useAppStore((s) => s.removeRule);

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newRuleKeyword, setNewRuleKeyword] = useState("");
  const [newRuleCategory, setNewRuleCategory] = useState(categories[0]?.name ?? "");

  const orderedExpenseCategories = categories
    .map((c) => c.name)
    .filter((n) => n !== "Ingresos" && n !== UNCATEGORIZED);

  function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    addCategory(name);
    setNewCategoryName("");
  }

  function handleAddRule() {
    const keyword = newRuleKeyword.trim();
    if (!keyword || !newRuleCategory) return;
    addRule(keyword, newRuleCategory);
    setNewRuleKeyword("");
  }

  return (
    <div
      className="flex flex-col gap-6 rounded-xl p-5"
      style={{ background: "var(--surface-1)", border: "1px solid var(--gridline)" }}
    >
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Categorías
        </p>
        <p className="mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
          Créalas, renómbralas o bórralas. Los gastos de una categoría borrada pasan a &quot;Sin categorizar&quot;.
        </p>
        <ul className="flex flex-col gap-1.5">
          {categories.map((c) => {
            const isProtected = PROTECTED.has(c.name);
            return (
              <li key={c.name} className="flex items-center gap-2 text-sm">
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: categoryColorVar(c.name, orderedExpenseCategories) }}
                />
                {editingCategory === c.name ? (
                  <input
                    autoFocus
                    defaultValue={c.name}
                    onBlur={(e) => {
                      renameCategory(c.name, e.target.value);
                      setEditingCategory(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") setEditingCategory(null);
                    }}
                    className="rounded border border-blue-400 px-1 py-0.5"
                  />
                ) : (
                  <span className="flex-1">{c.name}</span>
                )}
                {!isProtected && editingCategory !== c.name && (
                  <>
                    <button
                      onClick={() => setEditingCategory(c.name)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Renombrar
                    </button>
                    <button
                      onClick={() => removeCategory(c.name)}
                      className="text-xs"
                      style={{ color: "var(--series-8)" }}
                    >
                      Borrar
                    </button>
                  </>
                )}
                {isProtected && (
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    predefinida
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex gap-2">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
            placeholder="Nueva categoría"
            className="flex-1 rounded border px-2 py-1 text-sm"
            style={{ borderColor: "var(--gridline)" }}
          />
          <button
            onClick={handleAddCategory}
            className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white"
          >
            Añadir
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Reglas de categorización
        </p>
        <p className="mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
          Si la descripción de un gasto contiene esta palabra, se le asigna la categoría automáticamente
          en la próxima subida.
        </p>
        <ul className="flex flex-col gap-1.5">
          {rules.map((r) => (
            <li key={r.id} className="flex items-center gap-2 text-sm">
              <code
                className="rounded px-1.5 py-0.5 text-xs"
                style={{ background: "var(--background)", color: "var(--text-secondary)" }}
              >
                {r.keyword}
              </code>
              <span style={{ color: "var(--text-muted)" }}>→</span>
              <span className="flex-1">{r.category}</span>
              <button
                onClick={() => removeRule(r.id)}
                className="text-xs"
                style={{ color: "var(--series-8)" }}
              >
                Borrar
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <input
            value={newRuleKeyword}
            onChange={(e) => setNewRuleKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddRule()}
            placeholder="Palabra clave (ej. netflix)"
            className="flex-1 rounded border px-2 py-1 text-sm"
            style={{ borderColor: "var(--gridline)" }}
          />
          <select
            value={newRuleCategory}
            onChange={(e) => setNewRuleCategory(e.target.value)}
            className="rounded border px-2 py-1 text-sm"
            style={{ borderColor: "var(--gridline)" }}
          >
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddRule}
            className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white"
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
}
