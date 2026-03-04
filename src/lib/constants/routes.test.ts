import { describe, it, expect } from 'vitest';
import { getRoutes } from './routes';

describe('getRoutes', () => {
  it('home includes locale', () => {
    expect(getRoutes('ru').home).toBe('/ru');
  });

  it('chapter builds /{locale}/glava/{slug}', () => {
    expect(getRoutes('en').chapter('istoriya')).toBe('/en/glava/istoriya');
  });

  it('chapterSpread builds with spread param', () => {
    expect(getRoutes('de').chapterSpread('foto', 2)).toBe('/de/glava/foto?spread=2');
  });

  it('person builds persony URL with id', () => {
    expect(getRoutes('ru').person('person-1')).toBe('/ru/glava/persony?id=person-1');
  });
});
