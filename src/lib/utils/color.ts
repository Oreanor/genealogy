function parseHex(hex: string): { r: number; g: number; b: number } {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

/** Contrasting text color: dark on light background, light on dark */
export function contrastColor(hex: string): string {
  const { r, g, b } = parseHex(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/** Darken color by mixing with black. amount 0..1 = fraction of black */
export function darkenColor(hex: string, amount: number): string {
  const { r, g, b } = parseHex(hex);
  const f = 1 - Math.max(0, Math.min(1, amount));
  const toHex = (n: number) =>
    Math.round(n * f)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Lighten color by mixing with white. amount 0..1 = fraction of white */
export function lightenColor(hex: string, amount: number): string {
  const { r, g, b } = parseHex(hex);
  const f = Math.max(0, Math.min(1, amount));
  const toHex = (n: number) =>
    Math.round(n * (1 - f) + 255 * f)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Hex to rgba(...) for borders and overlay with transparency */
export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

/** Hex → HSL (h 0–360, s 0–1, l 0–1) */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let { r, g, b } = parseHex(hex);
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
    }
  }
  return { h: h * 360, s, l };
}

/** HSL (h 0–360, s 0–1, l 0–1) → Hex */
export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360 / 360;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r: number;
  let g: number;
  let b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (n: number) =>
    Math.round(Math.max(0, Math.min(1, n)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
