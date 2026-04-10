/** Maps a distance along [0, total] to a clamped percentage 0–100 (e.g. face rects on photos). */
export function pxToPercent(value: number, total: number): number {
  return total > 0 ? Math.max(0, Math.min(100, (value / total) * 100)) : 0;
}

/** Snap to half-pixel grid (layout measurements). */
export function roundToHalf(n: number): number {
  return Math.round(n * 2) / 2;
}
