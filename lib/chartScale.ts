/** Picks a "nice" round step (1/2/5 × 10^n) for an axis max, targeting ~4-5 ticks. */
export function niceTicks(maxValue: number, targetCount = 4): number[] {
  if (maxValue <= 0) return [0];
  const rawStep = maxValue / targetCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  const step = (normalized < 1.5 ? 1 : normalized < 3 ? 2 : normalized < 7 ? 5 : 10) * magnitude;

  const ticks: number[] = [];
  for (let v = 0; v <= maxValue + step; v += step) {
    ticks.push(Math.round(v * 100) / 100);
    if (ticks.length > 8) break;
  }
  return ticks;
}
