"use client";

import { useEffect, useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ColumnMappingStep } from "@/components/ColumnMappingStep";
import { TransactionsTable } from "@/components/TransactionsTable";
import { Dashboard } from "@/components/Dashboard";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HowItWorks } from "@/components/HowItWorks";
import { CategoryManager } from "@/components/CategoryManager";
import { guessColumnMapping, normalizeAmount, normalizeDate, parseCsvText } from "@/lib/csv";
import { categorize } from "@/lib/categorize";
import { exportTransactionsToExcel } from "@/lib/exportExcel";
import { importTransactionsFromExcel } from "@/lib/importExcel";
import { exportDashboardHtml } from "@/lib/exportHtml";
import { useAppStore } from "@/lib/store";
import type { ColumnMapping, ParsedCsv, Transaction } from "@/lib/types";

type Step = "upload" | "mapping" | "review";

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [initialMapping, setInitialMapping] = useState<ColumnMapping | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(true);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const transactions = useAppStore((s) => s.transactions);
  const categories = useAppStore((s) => s.categories);
  const currency = useAppStore((s) => s.currency);
  const rules = useAppStore((s) => s.rules);
  const appendTransactions = useAppStore((s) => s.appendTransactions);
  const addCategory = useAppStore((s) => s.addCategory);
  const reset = useAppStore((s) => s.reset);
  const setCurrency = useAppStore((s) => s.setCurrency);

  // Static export + "use client" means the first paint (server and client
  // alike) always shows the empty default state — rehydrate from
  // localStorage only after mount, then jump straight to the saved data if
  // there was any, instead of making a returning user re-upload everything.
  useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration((state) => {
      if (state.transactions.length > 0) setStep("review");
    });
    useAppStore.persist.rehydrate();
    return unsub;
  }, []);

  function handleCsvFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const csv = parseCsvText(String(reader.result ?? ""));
      setParsed(csv);
      setInitialMapping(guessColumnMapping(csv));
      setStep("mapping");
    };
    reader.readAsText(file);
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

  async function handleRestoreExcel(file: File) {
    setRestoring(true);
    setRestoreError(null);
    try {
      const { transactions: restored, currency: restoredCurrency } = await importTransactionsFromExcel(file);

      if (transactions.length === 0) {
        if (restoredCurrency) setCurrency(restoredCurrency);
      } else if (restoredCurrency && restoredCurrency !== currency) {
        setRestoreError(
          `Este Excel está en ${restoredCurrency}, pero tus datos ya cargados están en ${currency}. Los importes no se convierten entre monedas — empieza de cero si quieres usar este archivo.`
        );
        return;
      }

      const knownCategories = new Set(categories.map((c) => c.name));
      for (const t of restored) {
        if (t.category && !knownCategories.has(t.category)) {
          addCategory(t.category);
          knownCategories.add(t.category);
        }
      }
      const { added, skipped } = appendTransactions(restored);
      setImportSummary(
        skipped > 0
          ? `${added} transacciones restauradas desde el Excel (${skipped} ya existían y se omitieron).`
          : `${added} transacciones restauradas desde el Excel.`
      );
      setStep("review");
    } catch (err) {
      setRestoreError(err instanceof Error ? err.message : "No se pudo leer el archivo.");
    } finally {
      setRestoring(false);
    }
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Primera vez aquí
              </p>
              <FileUpload
                accept=".csv,text/csv"
                title="Arrastra tu CSV aquí"
                hint="El movimiento bancario que descargas de tu banco"
                onFile={handleCsvFile}
              />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                ¿Ya lo has usado antes?
              </p>
              <FileUpload
                accept=".xlsx"
                title={restoring ? "Restaurando…" : "Arrastra tu Excel anterior"}
                hint="El que descargaste la última vez — juntamos tu histórico"
                disabled={restoring}
                onFile={handleRestoreExcel}
              />
            </div>
          </div>

          {transactions.length === 0 && <HowItWorks />}

          {restoreError && (
            <div
              className="rounded p-3 text-sm"
              style={{
                border: "1px solid var(--series-8)",
                background: "color-mix(in srgb, var(--series-8) 10%, var(--surface-1))",
                color: "var(--text-primary)",
              }}
            >
              {restoreError}
            </div>
          )}
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
              className="rounded p-3 text-sm"
              style={{
                border: "1px solid var(--series-6)",
                background: "color-mix(in srgb, var(--series-6) 10%, var(--surface-1))",
                color: "var(--text-primary)",
              }}
              role="status"
            >
              {importSummary}
            </div>
          )}
          <button
            onClick={() => setShowCategoryManager((v) => !v)}
            className="flex w-full items-center gap-3 rounded-xl p-4 text-left transition-shadow hover:shadow-md"
            style={{
              background: "color-mix(in srgb, var(--series-1) 8%, var(--surface-1))",
              border: "1px solid var(--series-1)",
            }}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ background: "var(--series-1)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24H4a1 1 0 0 0-1 1v5.59a2 2 0 0 0 .59 1.41l9.58 9.59a2 2 0 0 0 2.83 0l4.59-4.59a2 2 0 0 0 0-2.83Z" />
                <circle cx="7.5" cy="7.5" r="1.25" fill="white" stroke="none" />
              </svg>
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Editar categorías y gastos
              </span>
              <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
                Crea categorías, renombra gastos y enseña reglas para que se categoricen solos
              </span>
            </span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth="2"
              style={{ transform: showCategoryManager ? "rotate(180deg)" : "none", transition: "transform 150ms" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {showCategoryManager && <CategoryManager />}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {transactions.length} transacciones importadas
            </p>
            <div className="flex flex-wrap items-center gap-2">
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
          <Dashboard />
          <TransactionsTable />
        </div>
      )}
    </div>
  );
}
