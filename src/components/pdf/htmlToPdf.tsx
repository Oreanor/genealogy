import React from 'react';
import { Text, View, Image, Link } from '@react-pdf/renderer';
import { COLORS } from './styles';

interface HtmlNode {
  tag: string;
  attrs: Record<string, string>;
  children: (HtmlNode | string)[];
}

function tokenize(html: string): (HtmlNode | string)[] {
  const result: (HtmlNode | string)[] = [];
  let pos = 0;

  while (pos < html.length) {
    const tagStart = html.indexOf('<', pos);
    if (tagStart === -1) {
      const text = html.slice(pos);
      if (text) result.push(decodeEntities(text));
      break;
    }
    if (tagStart > pos) {
      const text = html.slice(pos, tagStart);
      if (text) result.push(decodeEntities(text));
    }

    if (html.startsWith('</', tagStart)) {
      const closeEnd = html.indexOf('>', tagStart);
      pos = closeEnd === -1 ? html.length : closeEnd + 1;
      continue;
    }

    const selfClosing = /^<(\w+)([^>]*?)\s*\/?>/.exec(html.slice(tagStart));
    if (!selfClosing) {
      pos = tagStart + 1;
      continue;
    }

    const tagName = selfClosing[1]!.toLowerCase();
    const attrsStr = selfClosing[2] ?? '';
    const attrs = parseAttrs(attrsStr);
    const isSelfClose = selfClosing[0].endsWith('/>') || ['br', 'hr', 'img'].includes(tagName);
    pos = tagStart + selfClosing[0].length;

    if (isSelfClose) {
      result.push({ tag: tagName, attrs, children: [] });
    } else {
      const closeTag = `</${tagName}>`;
      const closeIdx = findMatchingClose(html, pos, tagName);
      const inner = html.slice(pos, closeIdx);
      pos = closeIdx + closeTag.length;
      const children = tokenize(inner);
      result.push({ tag: tagName, attrs, children });
    }
  }

  return result;
}

function findMatchingClose(html: string, startPos: number, tagName: string): number {
  let depth = 1;
  const pos = startPos;
  const openRe = new RegExp(`<${tagName}[\\s>/]`, 'gi');
  const closeRe = new RegExp(`</${tagName}>`, 'gi');
  openRe.lastIndex = pos;
  closeRe.lastIndex = pos;

  while (depth > 0) {
    const openMatch = openRe.exec(html);
    const closeMatch = closeRe.exec(html);
    if (!closeMatch) return html.length;
    if (openMatch && openMatch.index < closeMatch.index) {
      depth++;
      openRe.lastIndex = openMatch.index + openMatch[0].length;
      closeRe.lastIndex = closeMatch.index;
    } else {
      depth--;
      if (depth === 0) return closeMatch.index;
      openRe.lastIndex = openMatch ? openMatch.index : closeMatch.index + closeMatch[0].length;
      closeRe.lastIndex = closeMatch.index + closeMatch[0].length;
    }
  }
  return html.length;
}

function parseAttrs(s: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /(\w[\w-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    attrs[m[1]!] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return attrs;
}

function decodeEntities(s: string): string {
  return s
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&mdash;', '—')
    .replaceAll('&ndash;', '–');
}

let keyCounter = 0;
function nextKey(): string {
  return `hp-${++keyCounter}`;
}

function renderNodes(nodes: (HtmlNode | string)[], baseSize: number): React.ReactNode[] {
  return nodes.map((node) => {
    if (typeof node === 'string') {
      return node;
    }
    return renderNode(node, baseSize);
  });
}

function renderNode(node: HtmlNode, baseSize: number): React.ReactNode {
  const key = nextKey();
  const children = renderNodes(node.children, baseSize);

  switch (node.tag) {
    case 'p':
      return (
        <Text key={key} style={{ fontSize: baseSize, lineHeight: 1.5, marginBottom: 6 }}>
          {children}
        </Text>
      );
    case 'br':
      return <Text key={key}>{'\n'}</Text>;
    case 'hr':
      return (
        <View key={key} style={{ borderBottomWidth: 0.5, borderBottomColor: COLORS.border, marginVertical: 8 }} />
      );
    case 'strong':
    case 'b':
      return (
        <Text key={key} style={{ fontWeight: 700 }}>
          {children}
        </Text>
      );
    case 'em':
    case 'i':
      return (
        <Text key={key} style={{ fontStyle: 'italic' }}>
          {children}
        </Text>
      );
    case 'u':
      return (
        <Text key={key} style={{ textDecoration: 'underline' }}>
          {children}
        </Text>
      );
    case 'a':
      return (
        <Link key={key} src={node.attrs.href ?? ''} style={{ color: COLORS.accent, textDecoration: 'underline' }}>
          {children}
        </Link>
      );
    case 'h1':
      return (
        <Text key={key} style={{ fontSize: baseSize * 1.6, fontWeight: 700, marginBottom: 8, marginTop: 12 }}>
          {children}
        </Text>
      );
    case 'h2':
      return (
        <Text key={key} style={{ fontSize: baseSize * 1.3, fontWeight: 700, marginBottom: 6, marginTop: 10 }}>
          {children}
        </Text>
      );
    case 'h3':
      return (
        <Text key={key} style={{ fontSize: baseSize * 1.15, fontWeight: 500, marginBottom: 4, marginTop: 8 }}>
          {children}
        </Text>
      );
    case 'ul':
      return (
        <View key={key} style={{ marginBottom: 6, paddingLeft: 12 }}>
          {children}
        </View>
      );
    case 'ol':
      return (
        <View key={key} style={{ marginBottom: 6, paddingLeft: 12 }}>
          {node.children
            .filter((c): c is HtmlNode => typeof c !== 'string' && c.tag === 'li')
            .map((li, idx) => (
              <Text key={nextKey()} style={{ fontSize: baseSize, lineHeight: 1.5, marginBottom: 2 }}>
                {`${idx + 1}. `}
                {renderNodes(li.children, baseSize)}
              </Text>
            ))}
        </View>
      );
    case 'li':
      return (
        <Text key={key} style={{ fontSize: baseSize, lineHeight: 1.5, marginBottom: 2 }}>
          {'• '}
          {children}
        </Text>
      );
    case 'blockquote':
      return (
        <View key={key} style={{ borderLeftWidth: 2, borderLeftColor: COLORS.accent, paddingLeft: 8, marginVertical: 6 }}>
          <Text style={{ fontSize: baseSize, fontStyle: 'italic', lineHeight: 1.5, color: COLORS.inkMuted }}>
            {children}
          </Text>
        </View>
      );
    case 'div':
      return (
        <View key={key} style={{ marginVertical: 6 }}>
          {children}
        </View>
      );
    case 'table':
      return (
        <View
          key={key}
          style={{
            marginVertical: 8,
            borderWidth: 0.5,
            borderColor: COLORS.border,
          }}
        >
          {children}
        </View>
      );
    case 'thead':
    case 'tbody':
      return (
        <View key={key} wrap={false}>
          {children}
        </View>
      );
    case 'tr':
      return (
        <View
          key={key}
          wrap={false}
          style={{
            flexDirection: 'row',
            borderBottomWidth: 0.3,
            borderBottomColor: COLORS.border,
          }}
        >
          {children}
        </View>
      );
    case 'th':
    case 'td':
      return (
        <View
          key={key}
          style={{
            flexGrow: 1,
            flexBasis: 0,
            paddingHorizontal: 4,
            paddingVertical: 3,
            minWidth: 36,
          }}
        >
          <Text
            style={{
              fontSize: baseSize * (node.tag === 'th' ? 0.92 : 0.88),
              fontWeight: node.tag === 'th' ? 700 : 400,
              lineHeight: 1.35,
              color: node.tag === 'th' ? COLORS.ink : COLORS.ink,
            }}
          >
            {children}
          </Text>
        </View>
      );
    case 'img': {
      const src = node.attrs.src;
      if (!src) return null;
      return (
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image key={key} src={src} style={{ maxWidth: '100%', maxHeight: 300, marginVertical: 6, objectFit: 'contain' }} />
      );
    }
    case 'span':
    case 'section':
    case 'article':
    default:
      return (
        <Text key={key}>
          {children}
        </Text>
      );
  }
}

/** Convert an HTML string (from TipTap richText) to react-pdf elements. */
export function htmlToPdfElements(html: string, fontSize = 10): React.ReactNode[] {
  if (!html?.trim()) return [];
  keyCounter = 0;
  const nodes = tokenize(html);
  return renderNodes(nodes, fontSize);
}
