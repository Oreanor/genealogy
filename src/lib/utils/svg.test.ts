import { describe, it, expect } from 'vitest';
import { polygonPoints } from './svg';

describe('polygonPoints', () => {
  it('converts [x1,y1,x2,y2] to "x1,y1 x2,y2"', () => {
    expect(polygonPoints([1, 2, 3, 4])).toBe('1,2 3,4');
  });

  it('converts polygon coords to SVG points string', () => {
    expect(polygonPoints([10, 20, 30, 40, 50, 60])).toBe('10,20 30,40 50,60');
  });

  it('returns empty string for less than 2 values', () => {
    expect(polygonPoints([1])).toBe('');
    expect(polygonPoints([])).toBe('');
  });

  it('handles single pair', () => {
    expect(polygonPoints([0, 0])).toBe('0,0');
  });
});
