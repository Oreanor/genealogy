import { describe, it, expect } from 'vitest';
import {
  getFamilySurname,
  getDefaultBookTitle,
  getDefaultMetaDescription,
} from './owner';

describe('owner', () => {
  it('getFamilySurname returns root person lastName from data or template placeholder', () => {
    expect(getFamilySurname()).toBe('Никонец');
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
