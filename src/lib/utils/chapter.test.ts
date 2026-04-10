import { describe, it, expect } from 'vitest';
import { getChapterBySlug } from './chapter';

describe('getChapterBySlug', () => {
  it('returns chapter for valid slug', () => {
    expect(getChapterBySlug('family-tree')).toEqual({ id: 'family-tree' });
    expect(getChapterBySlug('persons')).toEqual({ id: 'persons' });
  });

  it('returns null for unknown slug', () => {
    expect(getChapterBySlug('unknown')).toBeNull();
    expect(getChapterBySlug('')).toBeNull();
  });
});
