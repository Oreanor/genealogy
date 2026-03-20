type SearchParamsLike = { toString(): string };

export function buildUrlWithUpdatedSearchParams(
  pathname: string,
  current: SearchParamsLike,
  updates: Record<string, string | null | undefined>
): string {
  const params = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value == null || value === '') params.delete(key);
    else params.set(key, value);
  }
  const next = params.toString();
  return `${pathname}${next ? `?${next}` : ''}`;
}
