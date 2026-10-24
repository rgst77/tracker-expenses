"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Charts used to size themselves from their data (a fixed number of px per
 * month), so they either left half the card empty or ran past its edge and
 * hid the latest month. Measure the real container instead.
 *
 * `override` pins the width (used by the static HTML export, which has no
 * layout to measure); `fallback` is what the first paint uses before the
 * ResizeObserver reports.
 */
export function useChartWidth(fallback = 640, override?: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      setMeasured(Math.floor(entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, width: override ?? measured ?? fallback };
}

/** Show every nth axis label so neighbours stay at least ~56px apart. */
export function labelEvery(spacingPx: number): number {
  return Math.max(1, Math.ceil(56 / Math.max(spacingPx, 1)));
}
