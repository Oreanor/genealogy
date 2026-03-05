/** Converts [x1,y1, x2,y2, ...] to "x1,y1 x2,y2" string for SVG polygon */
export function polygonPoints(coords: number[]): string {
  const pairs: string[] = [];
  for (let i = 0; i < coords.length - 1; i += 2) {
    pairs.push(`${coords[i]},${coords[i + 1]}`);
  }
  return pairs.join(' ');
}
