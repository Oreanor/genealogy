/** Path segments without empty strings: "/ru/chapter/history" → ["ru", "chapter", "history"] */
export function getPathSegments(pathname: string): string[] {
  return pathname.split('/').filter(Boolean);
}
