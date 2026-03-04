import { describe, it, expect } from 'vitest';
import {
  contrastColor,
  darkenColor,
  lightenColor,
  hexToRgba,
} from './color';

describe('color', () => {
  describe('contrastColor', () => {
    it('returns black for light background', () => {
      expect(contrastColor('#ffffff')).toBe('#000000');
      expect(contrastColor('#fef9c3')).toBe('#000000');
    });

    it('returns white for dark background', () => {
      expect(contrastColor('#000000')).toBe('#ffffff');
      expect(contrastColor('#1f2937')).toBe('#ffffff');
    });
  });

  describe('darkenColor', () => {
    it('darkens hex color by amount', () => {
      expect(darkenColor('#ffffff', 1)).toBe('#000000');
      expect(darkenColor('#ffffff', 0)).toBe('#ffffff');
    });
  });

  describe('lightenColor', () => {
    it('lightens hex color by amount', () => {
      expect(lightenColor('#000000', 1)).toBe('#ffffff');
      expect(lightenColor('#000000', 0)).toBe('#000000');
    });
  });

  describe('hexToRgba', () => {
    it('converts hex to rgba string', () => {
      expect(hexToRgba('#000000', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
      expect(hexToRgba('#ffffff', 1)).toBe('rgba(255, 255, 255, 1)');
    });
  });
});
