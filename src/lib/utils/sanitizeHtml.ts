import { isSafeRichTextHref } from './string';

/**
 * Allowlist sanitizer for rich-text HTML (history entries, `html` content blocks).
 *
 * Works the same on the server and in the browser (no DOM needed). It does not try to "clean" the
 * input in place: every allowed tag is rebuilt from scratch with only allowed, validated and
 * re-escaped attributes, every other tag is dropped (its text is kept), and every stray `<` / `>`
 * in text is escaped. So nothing that was not explicitly rebuilt can reach the output as markup.
 * Markup it cannot tokenize safely degrades to visible text rather than being passed through.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'hr', 'div', 'span',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'del', 'sub', 'sup', 'small', 'mark',
  'code', 'pre', 'blockquote',
  'ul', 'ol', 'li',
  'a', 'img', 'figure', 'figcaption',
  'table', 'caption', 'colgroup', 'col', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
]);

const VOID_TAGS = new Set(['br', 'hr', 'img', 'col']);

const GLOBAL_ATTRS = new Set(['class', 'title', 'style']);

const TAG_ATTRS: Record<string, ReadonlySet<string>> = {
  a: new Set(['href', 'target']),
  img: new Set(['src', 'alt', 'width', 'height']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan', 'scope']),
  ol: new Set(['start']),
  col: new Set(['span']),
  colgroup: new Set(['span']),
};

const NUMERIC_ATTRS = new Set(['width', 'height', 'colspan', 'rowspan', 'start', 'span']);

const STYLE_PROPS = new Set([
  'color', 'background-color', 'text-align', 'vertical-align',
  'width', 'font-weight', 'font-style', 'text-decoration',
]);
const STYLE_VALUE_RE = /^(#[0-9a-f]{3,8}|rgba?\(\s*[\d.\s,%]+\)|-?\d+(\.\d+)?(px|em|rem|%)?|[a-z-]+)$/i;

/** Elements whose content is never meant to be shown as text. */
const DROP_WITH_CONTENT_RE =
  /<(script|style|iframe|object|embed|noscript|template|textarea|title|svg|math)\b[\s\S]*?<\/\1\s*>/gi;
const COMMENT_RE = /<!--[\s\S]*?(?:-->|$)/g;
const TAG_RE =
  /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/g;
const ATTR_RE = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  colon: ':', tab: '\t', newline: '\n', sol: '/', bsol: '\\',
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);?/gi, (match, body: string) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match;
  });
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeText(text: string): string {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function sanitizeStyle(value: string): string {
  return value
    .split(';')
    .map((decl) => {
      const i = decl.indexOf(':');
      if (i < 0) return null;
      const prop = decl.slice(0, i).trim().toLowerCase();
      const val = decl.slice(i + 1).trim();
      return STYLE_PROPS.has(prop) && STYLE_VALUE_RE.test(val) ? `${prop}:${val}` : null;
    })
    .filter((d): d is string => d !== null)
    .join(';');
}

/** Returns the cleaned attribute value, or null to drop the attribute. */
function sanitizeAttr(name: string, value: string): string | null {
  if (name === 'href' || name === 'src') return isSafeRichTextHref(value) ? value : null;
  if (name === 'style') return sanitizeStyle(value) || null;
  if (name === 'target') return value === '_blank' ? value : null;
  if (name === 'scope') return /^(row|col|rowgroup|colgroup)$/.test(value) ? value : null;
  if (NUMERIC_ATTRS.has(name)) return /^\d{1,4}$/.test(value) ? value : null;
  // class / title / alt: plain text, made safe by escaping.
  return value;
}

function rebuildOpeningTag(tag: string, rawAttrs: string): string {
  const allowed = TAG_ATTRS[tag];
  const attrs = new Map<string, string>();
  for (const m of rawAttrs.matchAll(ATTR_RE)) {
    const name = m[1]!.toLowerCase();
    if (attrs.has(name)) continue; // browsers keep the first duplicate
    if (!GLOBAL_ATTRS.has(name) && !allowed?.has(name)) continue;
    const value = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '');
    const clean = sanitizeAttr(name, value);
    if (clean !== null) attrs.set(name, clean);
  }
  if (tag === 'a' && attrs.get('target') === '_blank') attrs.set('rel', 'noopener noreferrer');
  let out = `<${tag}`;
  for (const [name, value] of attrs) out += ` ${name}="${escapeAttr(value)}"`;
  return `${out}>`;
}

export function sanitizeRichHtml(html: string | null | undefined): string {
  if (!html) return '';
  const input = html.replace(COMMENT_RE, '').replace(DROP_WITH_CONTENT_RE, '');
  let out = '';
  let last = 0;
  for (const m of input.matchAll(TAG_RE)) {
    out += escapeText(input.slice(last, m.index));
    last = m.index! + m[0].length;
    const [, closing, rawName, rawAttrs = ''] = m;
    const tag = rawName!.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) continue;
    if (closing) {
      if (!VOID_TAGS.has(tag)) out += `</${tag}>`;
    } else {
      out += rebuildOpeningTag(tag, rawAttrs);
    }
  }
  return out + escapeText(input.slice(last));
}
