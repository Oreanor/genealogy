import type { Locale } from './config';
import { isLocale } from './config';

import ru from './locales/ru.json';
import en from './locales/en.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import nl from './locales/nl.json';
import uk from './locales/uk.json';
import pl from './locales/pl.json';

const messages: Record<Locale, Record<string, string>> = {
  ru: ru as Record<string, string>,
  en: en as Record<string, string>,
  de: de as Record<string, string>,
  fr: fr as Record<string, string>,
  es: es as Record<string, string>,
  it: it as Record<string, string>,
  pt: pt as Record<string, string>,
  nl: nl as Record<string, string>,
  uk: uk as Record<string, string>,
  pl: pl as Record<string, string>,
};

export function getMessages(locale: string): Record<string, string> {
  return messages[isLocale(locale) ? locale : 'ru'] ?? messages.ru;
}

export type MessageKey = keyof typeof ru;
