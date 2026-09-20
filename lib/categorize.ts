import type { Category, CategoryRule } from "./types";

export const UNCATEGORIZED = "Sin categorizar";

export const DEFAULT_CATEGORIES: Category[] = [
  { name: "Ingresos", color: "#00B894" },
  { name: "Alimentación", color: "#0984E3" },
  { name: "Transporte", color: "#6C5CE7" },
  { name: "Vivienda", color: "#E17055" },
  { name: "Ocio", color: "#FD79A8" },
  { name: "Salud", color: "#00CEC9" },
  { name: "Compras", color: "#FDCB6E" },
  { name: "Suscripciones", color: "#636E72" },
  { name: UNCATEGORIZED, color: "#B2BEC3" },
];

// Seed rules covering common merchants, meant as a starting point the user
// extends from the UI — not an attempt at exhaustive bank-agnostic coverage.
export const DEFAULT_RULES: CategoryRule[] = [
  { id: "r1", keyword: "uber", category: "Transporte" },
  { id: "r2", keyword: "cabify", category: "Transporte" },
  { id: "r3", keyword: "renfe", category: "Transporte" },
  { id: "r4", keyword: "mercadona", category: "Alimentación" },
  { id: "r5", keyword: "carrefour", category: "Alimentación" },
  { id: "r6", keyword: "lidl", category: "Alimentación" },
  { id: "r7", keyword: "netflix", category: "Suscripciones" },
  { id: "r8", keyword: "spotify", category: "Suscripciones" },
  { id: "r9", keyword: "amazon prime", category: "Suscripciones" },
  { id: "r10", keyword: "farmacia", category: "Salud" },
  { id: "r11", keyword: "amazon", category: "Compras" },
  { id: "r12", keyword: "alquiler", category: "Vivienda" },
  { id: "r13", keyword: "rent", category: "Vivienda" },
];

/**
 * Longest matching keyword wins, so a more specific rule (e.g. "amazon prime")
 * takes priority over a broader one (e.g. "amazon") when both match.
 */
export function categorize(
  description: string,
  amount: number,
  rules: CategoryRule[]
): string {
  if (amount > 0) return "Ingresos";

  const lower = description.toLowerCase();
  let best: CategoryRule | null = null;
  for (const rule of rules) {
    if (!rule.keyword.trim()) continue;
    if (lower.includes(rule.keyword.toLowerCase())) {
      if (!best || rule.keyword.length > best.keyword.length) {
        best = rule;
      }
    }
  }
  return best?.category ?? UNCATEGORIZED;
}
