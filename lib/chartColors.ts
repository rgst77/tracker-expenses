// Categorical palette from the validated dataviz reference — 8 slots, fixed
// order (never cycled), CVD-checked with scripts/validate_palette.js.
export const SERIES_VAR = (slot: number) => `var(--series-${slot})`;

export const MUTED_VAR = "var(--muted)";

/**
 * Assigns chart colors by fixed position in the category list, never by name
 * lookup or randomly — this is what keeps the palette CVD-safe. "Ingresos"
 * and "Sin categorizar" are excluded (handled separately as income / muted).
 */
export function categoryColorVar(categoryName: string, orderedExpenseCategories: string[]): string {
  const idx = orderedExpenseCategories.indexOf(categoryName);
  if (idx === -1 || idx >= 8) return MUTED_VAR;
  return SERIES_VAR(idx + 1);
}
