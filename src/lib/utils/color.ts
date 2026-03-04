function parseHex(hex: string): { r: number; g: number; b: number } {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

/** Контрастный цвет текста: тёмный для светлого фона, светлый для тёмного */
export function contrastColor(hex: string): string {
  const { r, g, b } = parseHex(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/** Затемняет цвет, смешивая с чёрным. amount 0..1 — доля чёрного */
export function darkenColor(hex: string, amount: number): string {
  const { r, g, b } = parseHex(hex);
  const f = 1 - Math.max(0, Math.min(1, amount));
  const toHex = (n: number) =>
    Math.round(n * f)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Осветляет цвет, смешивая с белым. amount 0..1 — доля белого */
export function lightenColor(hex: string, amount: number): string {
  const { r, g, b } = parseHex(hex);
  const f = Math.max(0, Math.min(1, amount));
  const toHex = (n: number) =>
    Math.round(n * (1 - f) + 255 * f)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Hex в rgba(...) для границ и overlay с прозрачностью */
export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}
