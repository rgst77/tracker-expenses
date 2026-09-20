import { create } from "zustand";
import { DEFAULT_CATEGORIES, DEFAULT_RULES, UNCATEGORIZED } from "./categorize";
import type { Category, CategoryRule, Transaction } from "./types";

interface AppState {
  transactions: Transaction[];
  categories: Category[];
  rules: CategoryRule[];
  currency: string;

  loadTransactions: (transactions: Transaction[]) => void;
  reset: () => void;
  setCurrency: (currency: string) => void;

  renameTransaction: (id: string, description: string) => void;
  setTransactionCategory: (id: string, category: string) => void;

  addCategory: (name: string) => void;
  renameCategory: (oldName: string, newName: string) => void;
  removeCategory: (name: string) => void;

  addRule: (keyword: string, category: string) => void;
  removeRule: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  rules: DEFAULT_RULES,
  currency: "EUR",

  loadTransactions: (transactions) => set({ transactions }),
  reset: () => set({ transactions: [] }),
  setCurrency: (currency) => set({ currency }),

  renameTransaction: (id, description) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, description } : t
      ),
    })),

  setTransactionCategory: (id, category) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, category } : t
      ),
    })),

  addCategory: (name) =>
    set((state) =>
      !name.trim() || state.categories.some((c) => c.name === name)
        ? state
        : { categories: [...state.categories, { name }] }
    ),

  renameCategory: (oldName, newName) =>
    set((state) => {
      const trimmed = newName.trim();
      if (!trimmed || oldName === trimmed || state.categories.some((c) => c.name === trimmed)) {
        return state;
      }
      return {
        categories: state.categories.map((c) => (c.name === oldName ? { name: trimmed } : c)),
        transactions: state.transactions.map((t) =>
          t.category === oldName ? { ...t, category: trimmed } : t
        ),
        rules: state.rules.map((r) => (r.category === oldName ? { ...r, category: trimmed } : r)),
      };
    }),

  removeCategory: (name) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.name !== name),
      transactions: state.transactions.map((t) =>
        t.category === name ? { ...t, category: UNCATEGORIZED } : t
      ),
      rules: state.rules.filter((r) => r.category !== name),
    })),

  addRule: (keyword, category) =>
    set((state) => ({
      rules: [
        ...state.rules,
        { id: crypto.randomUUID(), keyword, category },
      ],
    })),

  removeRule: (id) =>
    set((state) => ({ rules: state.rules.filter((r) => r.id !== id) })),
}));
