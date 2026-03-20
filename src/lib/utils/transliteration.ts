const CYR_TO_LAT_MAP: Record<string, string> = {
  А: 'A', а: 'a', Б: 'B', б: 'b', В: 'V', в: 'v', Г: 'G', г: 'g',
  Д: 'D', д: 'd', Е: 'E', е: 'e', Ё: 'Yo', ё: 'yo', Ж: 'Zh', ж: 'zh',
  З: 'Z', з: 'z', И: 'I', и: 'i', Й: 'Y', й: 'y', К: 'K', к: 'k',
  Л: 'L', л: 'l', М: 'M', м: 'm', Н: 'N', н: 'n', О: 'O', о: 'o',
  П: 'P', п: 'p', Р: 'R', р: 'r', С: 'S', с: 's', Т: 'T', т: 't',
  У: 'U', у: 'u', Ф: 'F', ф: 'f', Х: 'Kh', х: 'kh', Ц: 'Ts', ц: 'ts',
  Ч: 'Ch', ч: 'ch', Ш: 'Sh', ш: 'sh', Щ: 'Shch', щ: 'shch',
  Ъ: '', ъ: '', Ы: 'Y', ы: 'y', Ь: '', ь: '',
  Э: 'E', э: 'e', Ю: 'Yu', ю: 'yu', Я: 'Ya', я: 'ya',
  Є: 'Ye', є: 'ye', І: 'I', і: 'i', Ї: 'Yi', ї: 'yi', Ґ: 'G', ґ: 'g',
};

const transliterationCache = new Map<string, string>();

export function transliterateCyrillicToLatin(input: string): string {
  const cached = transliterationCache.get(input);
  if (cached != null) return cached;
  const result = input
    .split('')
    .map((ch) => CYR_TO_LAT_MAP[ch] ?? ch)
    .join('');
  transliterationCache.set(input, result);
  return result;
}
