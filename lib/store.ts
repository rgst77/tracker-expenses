import { create } from "zustand";
import { DEFAULT_CATEGORIES, DEFAULT_RULES, UNCATEGORIZED } from "./categorize";
import type { Category, CategoryRule, Transaction } from "./types";

interface AppState {
  transactions: Transaction[];
  categories: Category[];
  rules: CategoryRule[];

  loadTransactions: (transactions: Transaction[]) => void;
  reset: () => void;

  renameTransaction: (id: string, description: string) => void;
  setTransactionCategory: (id: string, category: string) => void;

  addCategory: (name: string) => void;
  removeCategory: (name: string) => void;

  addRule: (keyword: string, category: string) => void;
  removeRule: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  rules: DEFAULT_RULES,

  loadTransactions: (transactions) => set({ transactions }),
  reset: () => set({ transactions: [] }),

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
      state.categories.some((c) => c.name === name)
        ? state
        : {
            categories: [
              ...state.categories,
              { name, color: randomColor() },
            ],
          }
    ),

  removeCategory: (name) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.name !== name),
      transactions: state.transactions.map((t) =>
        t.category === name ? { ...t, category: UNCATEGORIZED } : t
      ),
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

const PALETTE = [
  "#0984E3", "#00B894", "#FDCB6E", "#E17055", "#6C5CE7",
  "#00CEC9", "#FD79A8", "#636E72", "#55EFC4", "#FAB1A0",
];

function randomColor(): string {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)];
}
