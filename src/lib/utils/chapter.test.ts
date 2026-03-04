import { describe, it, expect } from 'vitest';
import { getChapterBySlug } from './chapter';

describe('getChapterBySlug', () => {
  it('returns chapter for valid slug', () => {
    expect(getChapterBySlug('semejnoe-drevo')).toEqual({
      id: 'semejnoe-drevo',
      title: 'Семейное древо',
    });
    expect(getChapterBySlug('persony')).toEqual({ id: 'persony', title: 'Персоны' });
  });

  it('returns null for unknown slug', () => {
    expect(getChapterBySlug('unknown')).toBeNull();
    expect(getChapterBySlug('')).toBeNull();
  });
});
