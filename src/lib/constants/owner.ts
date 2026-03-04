/**
 * Конфиг «хозяина» альбома. Смена фамилии здесь меняет заголовок книги и описание
 * во всех локалях. Данные персон (имена в persons.json) не трогаем — только бренд.
 */
export const FAMILY_SURNAME = 'Никонец';

/** Заголовок книги по умолчанию (рус) для metadata и SSR */
export function getDefaultBookTitle(): string {
  return `Родословная семьи ${FAMILY_SURNAME}`;
}

/** Описание по умолчанию (рус) для metadata */
export function getDefaultMetaDescription(): string {
  return `Интерактивный альбом-книга о родословной семьи ${FAMILY_SURNAME}`;
}
