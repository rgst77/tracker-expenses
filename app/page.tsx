"use client";

import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ColumnMappingStep } from "@/components/ColumnMappingStep";
import { TransactionsTable } from "@/components/TransactionsTable";
import { Dashboard } from "@/components/Dashboard";
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

  const transactions = useAppStore((s) => s.transactions);
  const categories = useAppStore((s) => s.categories);
  const rules = useAppStore((s) => s.rules);
  const loadTransactions = useAppStore((s) => s.loadTransactions);
  const reset = useAppStore((s) => s.reset);

  function handleFileText(text: string) {
    const csv = parseCsvText(text);
    setParsed(csv);
    setInitialMapping(guessColumnMapping(csv));
    setStep("mapping");
  }

  function handleConfirmMapping(mapping: ColumnMapping) {
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

    loadTransactions(imported);
    setStep("review");
  }

  async function handleExportExcel() {
    setExporting(true);
    try {
      await exportTransactionsToExcel(transactions);
    } finally {
      setExporting(false);
    }
  }

  function handleExportHtml() {
    exportDashboardHtml(transactions, categories);
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <header>
        <h1 className="text-2xl font-bold">Panel de Gastos</h1>
        <p className="text-sm text-zinc-500">
          Sube un CSV de movimientos bancarios y consulta tu situación financiera al instante.
        </p>
      </header>

      {step === "upload" && <FileUpload onFileText={handleFileText} />}

      {step === "mapping" && parsed && initialMapping && (
        <ColumnMappingStep
          parsed={parsed}
          initialMapping={initialMapping}
          onConfirm={handleConfirmMapping}
          onCancel={() => setStep("upload")}
        />
      )}

      {step === "review" && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">{transactions.length} transacciones importadas</p>
            <div className="flex items-center gap-4">
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
                  reset();
                  setParsed(null);
                  setStep("upload");
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                Subir otro archivo
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
