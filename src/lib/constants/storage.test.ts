import { describe, it, expect } from 'vitest';
import { STORAGE_KEYS } from './storage';

describe('STORAGE_KEYS', () => {
  it('has paperColor and locale keys', () => {
    expect(STORAGE_KEYS.paperColor).toBe('genealogy-paper-color');
    expect(STORAGE_KEYS.locale).toBe('genealogy-locale');
  });
});
