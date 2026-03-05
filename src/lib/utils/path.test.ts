import { describe, it, expect } from 'vitest';
import { getPathSegments } from './path';

describe('getPathSegments', () => {
  it('splits path into non-empty segments', () => {
    expect(getPathSegments('/ru/chapter/history')).toEqual(['ru', 'chapter', 'history']);
  });

  it('returns empty array for root path', () => {
    expect(getPathSegments('/')).toEqual([]);
  });

  it('handles single segment', () => {
    expect(getPathSegments('/ru')).toEqual(['ru']);
  });

  it('filters out empty segments', () => {
    expect(getPathSegments('//a//b//')).toEqual(['a', 'b']);
  });
});
