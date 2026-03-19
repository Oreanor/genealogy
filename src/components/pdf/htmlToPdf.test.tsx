import React from 'react';
import { describe, it, expect } from 'vitest';
import { Text, View, Image, Link } from '@react-pdf/renderer';
import { htmlToPdfElements } from './htmlToPdf';

function collectStrings(node: unknown, out: string[] = []) {
  if (node == null || typeof node === 'boolean') return out;
  if (typeof node === 'string' || typeof node === 'number') {
    out.push(String(node));
    return out;
  }
  if (Array.isArray(node)) {
    for (const n of node) collectStrings(n, out);
    return out;
  }
  if (React.isValidElement(node)) {
    collectStrings((node as { props?: { children?: unknown } }).props?.children, out);
  }
  return out;
}

function collectElementsByType(node: unknown, type: unknown, out: unknown[] = []) {
  if (node == null || typeof node === 'boolean') return out;
  if (Array.isArray(node)) {
    for (const n of node) collectElementsByType(n, type, out);
    return out;
  }
  if (React.isValidElement(node)) {
    if ((node as { type: unknown }).type === type) out.push(node);
    collectElementsByType((node as { props?: { children?: unknown } }).props?.children, type, out);
  }
  return out;
}

describe('htmlToPdfElements', () => {
  it('returns empty array for empty / whitespace html', () => {
    expect(htmlToPdfElements('')).toEqual([]);
    expect(htmlToPdfElements('   ')).toEqual([]);
  });

  it('renders supported tags and decodes entities', () => {
    const html = [
      '<p>Tom &amp; Jerry&nbsp; &lt;test&gt; &mdash; &ndash; &quot;Q&quot; and &#39;S&#39;</p>',
      '<br>',
      '<hr/>',
      '<strong>Bold</strong>',
      '<em>Italic</em>',
      '<u>Under</u>',
      '<a href="https://example.com">LinkText</a>',
      '<h1>H1</h1>',
      '<h2>H2</h2>',
      '<h3>H3</h3>',
      '<ul><li>One</li><li>Two</li></ul>',
      '<ol><li>Alpha</li></ol>',
      '<blockquote>Quote</blockquote>',
      '<img src="img.jpg" alt="alt" />',
    ].join('');

    const nodes = htmlToPdfElements(html, 10);
    expect(nodes.length).toBeGreaterThan(0);

    const strings = collectStrings(nodes);
    const joined = strings.join(' ');
    expect(joined).toContain('Tom & Jerry');
    expect(joined).toContain('<test>');
    expect(joined).toContain('—');
    expect(joined).toContain('–');
    expect(joined).toContain('"Q"');
    expect(joined).toContain("'S'");
    expect(strings).toContain('Bold');
    expect(strings).toContain('Italic');
    expect(strings).toContain('Under');
    expect(strings).toContain('LinkText');
    expect(strings).toContain('H1');
    expect(strings).toContain('H2');
    expect(strings).toContain('H3');
    expect(strings).toContain('One');
    expect(strings).toContain('Two');
    expect(strings).toContain('Alpha');
    expect(strings).toContain('Quote');
    expect(strings.some((s) => s.includes('\n'))).toBe(true);

    expect(collectElementsByType(nodes, Text).length).toBeGreaterThan(0);
    expect(collectElementsByType(nodes, View).length).toBeGreaterThan(0);
    const images = collectElementsByType(nodes, Image);
    expect(images.length).toBeGreaterThan(0);
    const firstImage = images[0] as { props?: { src?: string } } | undefined;
    expect(firstImage?.props?.src).toBe('img.jpg');

    const links = collectElementsByType(nodes, Link);
    expect(links.length).toBeGreaterThan(0);
    const firstLink = links[0] as { props?: { src?: string } } | undefined;
    expect(firstLink?.props?.src).toBe('https://example.com');
  });

  it('does not crash on malformed html with missing closing tags', () => {
    const nodes = htmlToPdfElements('<div><p>Hi</p>');
    expect(nodes.length).toBeGreaterThan(0);
  });
});

