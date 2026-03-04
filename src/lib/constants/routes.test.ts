import { describe, it, expect } from 'vitest';
import { ROUTES } from './routes';

describe('ROUTES', () => {
  it('home is /', () => {
    expect(ROUTES.home).toBe('/');
  });

  it('chapter builds /glava/{slug}', () => {
    expect(ROUTES.chapter('istoriya')).toBe('/glava/istoriya');
  });

  it('chapterSpread builds with spread param', () => {
    expect(ROUTES.chapterSpread('foto', 2)).toBe('/glava/foto?spread=2');
  });

  it('person builds persony URL with id', () => {
    expect(ROUTES.person('person-1')).toBe('/glava/persony?id=person-1');
  });
});
