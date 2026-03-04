/** Сегменты пути без пустых строк: "/ru/glava/istoriya" → ["ru", "glava", "istoriya"] */
export function getPathSegments(pathname: string): string[] {
  return pathname.split('/').filter(Boolean);
}
