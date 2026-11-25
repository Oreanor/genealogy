import { describe, expect, it } from 'vitest';
import appData from '@/data/data.json';
import { sanitizeRichHtml } from './sanitizeHtml';

function toDom(html: string): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = html;
  return el;
}

/** Every element/attribute in the sanitized output, as `tag[attr=value]` strings. */
function describeDom(html: string): string[] {
  return [...toDom(html).querySelectorAll('*')].map(
    (el) => `${el.tagName.toLowerCase()}${[...el.attributes].map((a) => `[${a.name}=${a.value}]`).join('')}`
  );
}

describe('sanitizeRichHtml', () => {
  it('keeps the formatting TipTap produces', () => {
    const html =
      '<h2>Title</h2><p>Some <strong>bold</strong>, <em>italic</em> and <s>struck</s> text<br></p>' +
      '<ul><li><p>one</p></li></ul><p><span style="color:#ff0000">red</span></p>' +
      '<p><a href="/en?section=persons">link</a></p><img src="/photos/a.jpg" alt="A">';
    expect(describeDom(sanitizeRichHtml(html))).toEqual(describeDom(html));
  });

  it('keeps tables with classes and width styles', () => {
    const html =
      '<table class="w-full border-(--ink-muted)/35 text-[0.62rem]"><colgroup><col style="width:10%"></colgroup>' +
      '<tbody><tr class="border-b"><td class="px-1" colspan="2">x</td></tr></tbody></table>';
    expect(describeDom(sanitizeRichHtml(html))).toEqual(describeDom(html));
  });

  it('drops scripts, event handlers and unknown tags', () => {
    const out = sanitizeRichHtml(
      '<p onclick="alert(1)">a</p><script>alert(2)</script><iframe src="https://x"></iframe>' +
        '<img src="/a.jpg" onerror="alert(3)"><svg><script>alert(4)</script></svg><form><input></form>'
    );
    expect(out).not.toMatch(/onclick|onerror|script|iframe|svg|form|input|alert/i);
    expect(out).toContain('<p>a</p>');
    expect(out).toContain('<img src="/a.jpg">');
  });

  it('removes dangerous and protocol-relative URLs, including entity-encoded ones', () => {
    const cases = [
      '<a href="javascript:alert(1)">x</a>',
      '<a href="JaVaScRiPt:alert(1)">x</a>',
      '<a href="&#106;avascript:alert(1)">x</a>',
      '<a href="java&#x09;script:alert(1)">x</a>',
      '<a href="data:text/html,x">x</a>',
      '<a href="//evil.example">x</a>',
      '<a href="/\\evil.example">x</a>',
      '<a href="/&#47;evil.example">x</a>',
      '<a href="/&sol;evil.example">x</a>',
      '<img src="//evil.example/a.png">',
    ];
    for (const html of cases) {
      const el = toDom(sanitizeRichHtml(html)).firstElementChild!;
      expect(el.getAttribute('href') ?? el.getAttribute('src'), html).toBeNull();
    }
  });

  it('forces rel=noopener on target=_blank links', () => {
    expect(sanitizeRichHtml('<a href="https://example.com" target="_blank" rel="opener">x</a>')).toBe(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">x</a>'
    );
  });

  it('filters style declarations', () => {
    expect(sanitizeRichHtml('<span style="color:red;background:url(javascript:x);position:fixed">x</span>')).toBe(
      '<span style="color:red">x</span>'
    );
    expect(sanitizeRichHtml('<span style="position:fixed">x</span>')).toBe('<span>x</span>');
  });

  it('cannot be tricked into producing markup from dropped pieces', () => {
    for (const html of [
      '<<script>x</script>img src=x onerror=alert(1)>',
      '<img src="/a.jpg" onerror=alert(1) /',
      '<a href="/ok"title="t" onclick="alert(1)">x</a>',
      '<p>1 < 2 > 0</p>',
      '<!-- <img src=x onerror=alert(1)> -->ok',
    ]) {
      const out = sanitizeRichHtml(html);
      const attrs = [...toDom(out).querySelectorAll('*')].flatMap((el) => [...el.attributes].map((a) => a.name));
      expect(attrs.filter((a) => a.startsWith('on')), html).toEqual([]);
      expect(sanitizeRichHtml(out), html).toBe(out);
    }
  });

  it('handles empty input', () => {
    expect(sanitizeRichHtml('')).toBe('');
    expect(sanitizeRichHtml(undefined)).toBe('');
  });

  it('renders every bundled history entry unchanged', () => {
    for (const entry of (appData as { history: { title: string; richText: string }[] }).history) {
      const clean = sanitizeRichHtml(entry.richText);
      expect(describeDom(clean), entry.title).toEqual(describeDom(entry.richText));
      expect(toDom(clean).textContent, entry.title).toBe(toDom(entry.richText).textContent);
    }
  });
});
