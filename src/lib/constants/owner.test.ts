import { describe, it, expect } from 'vitest';
import {
  FAMILY_SURNAME,
  getDefaultBookTitle,
  getDefaultMetaDescription,
} from './owner';

describe('owner', () => {
  it('FAMILY_SURNAME is defined', () => {
    expect(FAMILY_SURNAME).toBe('Никонец');
  });

  it('getDefaultBookTitle includes surname', () => {
    expect(getDefaultBookTitle()).toBe('Родословная семьи Никонец');
  });

  it('getDefaultMetaDescription includes surname', () => {
    expect(getDefaultMetaDescription()).toBe(
      'Интерактивный альбом-книга о родословной семьи Никонец'
    );
  });
});
