/** Один элемент раздела «Истории»: название, ричтекст, ссылки на персон (без картинок в ричтексте) */
export interface HistoryEntry {
  /** Название (заголовок) */
  title: string;
  /** HTML-содержимое */
  richText: string;
  /** ID персон */
  personIds: string[];
}
