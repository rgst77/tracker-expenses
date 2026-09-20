import type { Transaction } from "./types";

/** Same date + description + amount is treated as the same bank row, likely from overlapping export ranges. */
function dedupeKey(t: Transaction): string {
  return `${t.date}|${t.description}|${t.amount}`;
}

export function mergeTransactions(
  existing: Transaction[],
  incoming: Transaction[]
): { merged: Transaction[]; added: number; skipped: number } {
  const seen = new Set(existing.map(dedupeKey));
  const toAdd: Transaction[] = [];

  for (const t of incoming) {
    const key = dedupeKey(t);
    if (seen.has(key)) continue;
    seen.add(key);
    toAdd.push(t);
  }

  return { merged: [...existing, ...toAdd], added: toAdd.length, skipped: incoming.length - toAdd.length };
}
