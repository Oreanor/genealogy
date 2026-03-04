import { describe, it, expect } from 'vitest';
import type { ImageConfig } from '@/lib/types/spread';
import { hasPageContent } from './pageContent';

describe('hasPageContent', () => {
  it('returns true when blocks exist and non-empty', () => {
    expect(
      hasPageContent({
        blocks: [{ type: 'paragraph', content: [{ type: 'text', value: 'x' }] }],
      })
    ).toBe(true);
  });

  it('returns false when blocks is empty array', () => {
    expect(hasPageContent({ blocks: [] })).toBe(false);
  });

  it('returns false when blocks is undefined', () => {
    expect(hasPageContent({})).toBe(false);
  });

  it('returns true when image.src exists', () => {
    expect(hasPageContent({ image: { src: '/photo.jpg' } })).toBe(true);
  });

  it('returns false when image has no src', () => {
    expect(hasPageContent({ image: { src: '' } })).toBe(false);
    expect(hasPageContent({ image: {} as ImageConfig })).toBe(false);
  });

  it('returns true when both blocks and image present', () => {
    expect(
      hasPageContent({
        blocks: [{ type: 'paragraph', content: [] }],
        image: { src: '/x.jpg' },
      })
    ).toBe(true);
  });
});
