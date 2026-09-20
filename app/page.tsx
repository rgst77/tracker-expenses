"use client";

import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ColumnMappingStep } from "@/components/ColumnMappingStep";
import { TransactionsTable } from "@/components/TransactionsTable";
import { Dashboard } from "@/components/Dashboard";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CategoryManager } from "@/components/CategoryManager";
import { guessColumnMapping, normalizeAmount, normalizeDate, parseCsvText } from "@/lib/csv";
import { categorize } from "@/lib/categorize";
import { exportTransactionsToExcel } from "@/lib/exportExcel";
import { exportDashboardHtml } from "@/lib/exportHtml";
import { useAppStore } from "@/lib/store";
import type { ColumnMapping, ParsedCsv, Transaction } from "@/lib/types";

type Step = "upload" | "mapping" | "review";

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [initialMapping, setInitialMapping] = useState<ColumnMapping | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);

  const transactions = useAppStore((s) => s.transactions);
  const categories = useAppStore((s) => s.categories);
  const currency = useAppStore((s) => s.currency);
  const rules = useAppStore((s) => s.rules);
  const appendTransactions = useAppStore((s) => s.appendTransactions);
  const reset = useAppStore((s) => s.reset);
  const setCurrency = useAppStore((s) => s.setCurrency);

  function handleFileText(text: string) {
    const csv = parseCsvText(text);
    setParsed(csv);
    setInitialMapping(guessColumnMapping(csv));
    setStep("mapping");
  }

  function handleConfirmMapping(mapping: ColumnMapping, currency: string) {
    if (!parsed || !mapping.date || !mapping.description || !mapping.amount) return;

    const imported: Transaction[] = parsed.rows.map((row, i) => {
      const description = (row[mapping.description!] ?? "").trim();
      const amount = normalizeAmount(row[mapping.amount!] ?? "0");
      return {
        id: `${Date.now()}-${i}`,
        date: normalizeDate(row[mapping.date!] ?? ""),
        description,
        originalDescription: description,
        amount,
        category: categorize(description, amount, rules),
      };
    });

    if (transactions.length === 0) setCurrency(currency);
    const { added, skipped } = appendTransactions(imported);
    setImportSummary(
      skipped > 0
        ? `${added} transacciones añadidas (${skipped} ya existían y se omitieron).`
        : `${added} transacciones añadidas.`
    );
    setParsed(null);
    setStep("review");
  }

  async function handleExportExcel() {
    setExporting(true);
    try {
      await exportTransactionsToExcel(transactions, currency);
    } finally {
      setExporting(false);
    }
  }

  function handleExportHtml() {
    exportDashboardHtml(transactions, categories, currency);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="flex items-center gap-3">
        <Logo />
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Expenses Tracker
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Sube un CSV de movimientos bancarios y consulta tu situación financiera al instante.
          </p>
        </div>
        <ThemeToggle />
      </header>

      {step === "upload" && (
        <div className="flex flex-col gap-4">
          {transactions.length > 0 && (
            <div
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
              style={{ borderColor: "var(--gridline)", background: "var(--surface-1)" }}
            >
              <span style={{ color: "var(--text-secondary)" }}>
                Ya tienes {transactions.length} transacciones cargadas (en {currency}). El nuevo archivo se
                añadirá a esas, no las borra.
              </span>
              <button onClick={() => setStep("review")} className="font-medium text-blue-600 hover:underline">
                Volver sin subir nada
              </button>
            </div>
          )}
          <FileUpload onFileText={handleFileText} />
        </div>
      )}

      {step === "mapping" && parsed && initialMapping && (
        <ColumnMappingStep
          parsed={parsed}
          initialMapping={initialMapping}
          existingCount={transactions.length}
          existingCurrency={currency}
          onConfirm={handleConfirmMapping}
          onCancel={() => setStep(transactions.length > 0 ? "review" : "upload")}
        />
      )}

      {step === "review" && (
        <div className="flex flex-col gap-6">
          {importSummary && (
            <div
              className="rounded border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"
              role="status"
            >
              {importSummary}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {transactions.length} transacciones importadas
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowCategoryManager((v) => !v)}
                className="rounded border px-3 py-1.5 text-sm font-medium"
                style={{ borderColor: "var(--gridline)", color: "var(--text-primary)" }}
              >
                {showCategoryManager ? "Ocultar categorías" : "Gestionar categorías"}
              </button>
              <button
                onClick={handleExportExcel}
                disabled={exporting}
                className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {exporting ? "Generando…" : "Descargar Excel"}
              </button>
              <button
                onClick={handleExportHtml}
                className="rounded border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600"
              >
                Descargar HTML
              </button>
              <button
                onClick={() => {
                  setImportSummary(null);
                  setStep("upload");
                }}
                className="px-2 py-1.5 text-sm text-blue-600 hover:underline"
              >
                Añadir más datos
              </button>
              <button
                onClick={() => {
                  if (!window.confirm("Esto borra todas las transacciones cargadas. ¿Continuar?")) return;
                  reset();
                  setImportSummary(null);
                  setStep("upload");
                }}
                className="px-2 py-1.5 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                Empezar de cero
              </button>
            </div>
          </div>
          {showCategoryManager && <CategoryManager />}
          <Dashboard />
          <TransactionsTable />
        </div>
      )}
    </div>
  );
}
