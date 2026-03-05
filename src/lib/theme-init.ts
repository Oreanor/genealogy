/**
 * Sync init of theme from localStorage.
 * Runs before React to avoid flash of default theme on reload.
 */
const PALETTE = [
  '#ffffff', '#e5e7eb', '#9ca3af', '#374151',
  '#fef9c3', '#fbbf24', '#f97316', '#ef4444',
  '#ecfdf5', '#22c55e', '#0ea5e9', '#3b82f6',
  '#f5f3ff', '#8b5cf6', '#a16207', '#1f2937',
];
const DEFAULT_PAPER = '#ffffff';
const KEY = 'genealogy-paper-color';

function parseHex(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function contrastColor(hex: string) {
  const { r, g, b } = parseHex(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

function darkenColor(hex: string, amount: number) {
  const { r, g, b } = parseHex(hex);
  const f = 1 - Math.max(0, Math.min(1, amount));
  const toHex = (n: number) => Math.round(n * f).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function lightenColor(hex: string, amount: number) {
  const { r, g, b } = parseHex(hex);
  const f = Math.max(0, Math.min(1, amount));
  const toHex = (n: number) =>
    Math.round(n * (1 - f) + 255 * f).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgba(hex: string, alpha: number) {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

export function initThemeFromStorage() {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(KEY);
    const paper = stored && PALETTE.includes(stored) ? stored : DEFAULT_PAPER;
    const ink = contrastColor(paper);
    const paperLight = lightenColor(paper, 0.7);
    const bookBg = darkenColor(paper, 0.25);
    const accent = darkenColor(paper, 0.5);
    const accentHover = darkenColor(paper, 0.6);
    const isDark = ink === '#ffffff';
    const root = document.documentElement.style;
    root.setProperty('--paper', paper);
    root.setProperty('--paper-light', paperLight);
    root.setProperty('--book-bg', bookBg);
    root.setProperty('--accent', accent);
    root.setProperty('--accent-hover', accentHover);
    root.setProperty('--ink', ink);
    root.setProperty('--link', ink);
    root.setProperty('--link-hover', isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)');
    root.setProperty('--ink-muted', isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)');
    root.setProperty('--nav-btn-ink', contrastColor(accent));
    root.setProperty('--tree-plaque-fill', paperLight);
    root.setProperty('--border', hexToRgba(accentHover, 0.4));
    root.setProperty('--border-subtle', hexToRgba(accent, 0.2));
    root.setProperty('--surface', paperLight);
    root.setProperty('--hotspot-stroke', hexToRgba(accent, 0.5));
    root.setProperty('--hotspot-fill', hexToRgba(accent, 0.15));
    root.setProperty('--hotspot-fill-hover', hexToRgba(accent, 0.3));
  } catch {
    // ignore
  }
}
