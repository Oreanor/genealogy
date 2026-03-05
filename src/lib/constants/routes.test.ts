import { describe, it, expect } from 'vitest';
import { getRoutes } from './routes';

describe('getRoutes', () => {
  it('home includes locale', () => {
    expect(getRoutes('ru').home).toBe('/ru');
  });

  it('section builds home with section param', () => {
    expect(getRoutes('en').section('history')).toBe('/en?section=history');
  });

  it('chapter redirects to home with section', () => {
    expect(getRoutes('en').chapter('history')).toBe('/en?section=history');
    expect(getRoutes('en').chapter('family-tree')).toBe('/en');
  });

  it('chapterSpread redirects to home with section', () => {
    expect(getRoutes('de').chapterSpread('photos')).toBe('/de?section=photos');
  });

  it('person builds home with section=persons and id', () => {
    expect(getRoutes('ru').person('p001')).toBe('/ru?section=persons&id=p001');
  });

  it('admin builds /{locale}/admin', () => {
    expect(getRoutes('en').admin).toBe('/en/admin');
  });
});
