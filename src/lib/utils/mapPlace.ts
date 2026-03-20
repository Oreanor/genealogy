export function normalizePlace(raw: string): string {
  return raw
    .trim()
    .replace(/^[гс]\.\s*/i, '')
    .replace(/^ст\.\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function toPlaceFallbackKey(raw: string): string {
  return normalizePlace(raw)
    .toLowerCase()
    .replace(/[а-яёіїєґ]/g, (char) => {
      switch (char) {
        case 'а':
          return 'a';
        case 'б':
          return 'b';
        case 'в':
          return 'v';
        case 'г':
          return 'g';
        case 'ґ':
          return 'g';
        case 'д':
          return 'd';
        case 'е':
          return 'e';
        case 'ё':
          return 'yo';
        case 'є':
          return 'ye';
        case 'ж':
          return 'zh';
        case 'з':
          return 'z';
        case 'и':
          return 'i';
        case 'і':
          return 'i';
        case 'ї':
          return 'yi';
        case 'й':
          return 'y';
        case 'к':
          return 'k';
        case 'л':
          return 'l';
        case 'м':
          return 'm';
        case 'н':
          return 'n';
        case 'о':
          return 'o';
        case 'п':
          return 'p';
        case 'р':
          return 'r';
        case 'с':
          return 's';
        case 'т':
          return 't';
        case 'у':
          return 'u';
        case 'ф':
          return 'f';
        case 'х':
          return 'kh';
        case 'ц':
          return 'ts';
        case 'ч':
          return 'ch';
        case 'ш':
          return 'sh';
        case 'щ':
          return 'shch';
        case 'ъ':
          return '';
        case 'ы':
          return 'y';
        case 'ь':
          return '';
        case 'э':
          return 'e';
        case 'ю':
          return 'yu';
        case 'я':
          return 'ya';
        default:
          return '';
      }
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

