export type ColumnRole = "date" | "description" | "amount" | "ignore";

export interface ParseWarning {
  row: number;
  message: string;
}

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
  warnings: ParseWarning[];
}

export interface ColumnMapping {
  date: string | null;
  description: string | null;
  amount: string | null;
}

export interface Transaction {
  id: string;
  date: string; // ISO yyyy-mm-dd, empty string if unparseable
  description: string; // editable by the user
  originalDescription: string; // as it came from the CSV, never mutated
  amount: number; // positive = income, negative = expense
  category: string;
}

export interface CategoryRule {
  id: string;
  keyword: string; // matched case-insensitively as a substring of the description
  category: string;
}

export interface Category {
  name: string;
}
