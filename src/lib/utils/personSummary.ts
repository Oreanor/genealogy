import type { Person } from '@/lib/types/person';
import { formatLifeDates } from '@/lib/utils/person';
import { normalizePlace } from '@/lib/utils/mapPlace';

type TFunction = (key: string, params?: Record<string, string | number>) => string;

function pickVariantIndex(seed: string): 1 | 2 | 3 {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const idx = (hash % 3) + 1;
  return idx as 1 | 2 | 3;
}

function variant(
  t: TFunction,
  baseKey: string,
  seed: string,
  params?: Record<string, string | number>
): string {
  const n = pickVariantIndex(seed);
  const preferredKey = `${baseKey}_${n}`;
  const preferred = t(preferredKey, params);
  if (preferred !== preferredKey) return preferred;

  // Fallback guard: never expose raw i18n keys in UI.
  const fallbackKey = `${baseKey}_1`;
  const fallback = t(fallbackKey, params);
  if (fallback !== fallbackKey) return fallback;

  return preferred;
}

function genderedVerbs(person: Person): {
  bornVerb: string;
  diedVerb: string;
  workedVerb: string;
  livedVerb: string;
  subjectPronoun: string;
  livedVisitedVerb: string;
} {
  if (person.gender === 'f') {
    return {
      bornVerb: 'Родилась',
      diedVerb: 'ушла из жизни',
      workedVerb: 'Работала',
      livedVerb: 'жила',
      subjectPronoun: 'она',
      livedVisitedVerb: 'жила или бывала',
    };
  }
  return {
    bornVerb: 'Родился',
    diedVerb: 'ушёл из жизни',
    workedVerb: 'Работал',
    livedVerb: 'жил',
    subjectPronoun: 'он',
    livedVisitedVerb: 'жил или бывал',
  };
}

function splitResidenceCities(raw?: string): string[] {
  if (!raw) return [];
  const result: string[] = [];
  const seen = new Set<string>();
  for (const part of raw.split(',')) {
    const city = part.trim().replace(/\s+/g, ' ');
    const key = normalizePlace(city).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(city);
  }
  return result;
}

function isYearOnlyDate(value?: string): boolean {
  const trimmed = value?.trim();
  return Boolean(trimmed && /^\d{4}$/.test(trimmed));
}

export function buildPersonSummary(person: Person, t: TFunction): string[] {
  const lines: string[] = [];
  const lifeDates = formatLifeDates(person.birthDate, person.deathDate);
  const verbs = genderedVerbs(person);
  const residenceCities = splitResidenceCities(person.residenceCity);
  const residenceCityOne = residenceCities[0] ?? '';
  const residenceCitiesText = residenceCities.join(', ');
  const hasBirth = Boolean(person.birthDate?.trim());
  const hasDeath = Boolean(person.deathDate?.trim());
  const birthYearOnly = isYearOnlyDate(person.birthDate);
  const deathYearOnly = isYearOnlyDate(person.deathDate);

  if (hasBirth && hasDeath && birthYearOnly !== deathYearOnly) {
    const birthPart = birthYearOnly
      ? t('personSummary_birthYearFragment', { birth: person.birthDate!.trim(), bornVerb: verbs.bornVerb })
      : t('personSummary_birthExactFragment', { birth: person.birthDate!.trim(), bornVerb: verbs.bornVerb });
    const deathPart = deathYearOnly
      ? t('personSummary_deathYearFragment', { death: person.deathDate!.trim(), diedVerb: verbs.diedVerb })
      : t('personSummary_deathExactFragment', { death: person.deathDate!.trim(), diedVerb: verbs.diedVerb });
    lines.push(
      variant(t, 'personSummary_datesMixed', `${person.id}:datesMixed`, {
        birthPart,
        deathPart,
      })
    );
  } else if (person.birthDate && person.deathDate) {
    lines.push(
      variant(t, 'personSummary_datesKnown', `${person.id}:datesKnown`, {
        birth: person.birthDate,
        death: person.deathDate,
        bornVerb: verbs.bornVerb,
        diedVerb: verbs.diedVerb,
      })
    );
  } else if (hasBirth && birthYearOnly) {
    lines.push(
      variant(t, 'personSummary_datesPartial', `${person.id}:datesBirthYearOnly`, {
        dates: t('personSummary_birthYearFragment', { birth: person.birthDate!.trim(), bornVerb: verbs.bornVerb }),
      })
    );
  } else if (hasDeath && deathYearOnly) {
    lines.push(
      variant(t, 'personSummary_datesPartial', `${person.id}:datesDeathYearOnly`, {
        dates: t('personSummary_deathYearFragment', { death: person.deathDate!.trim(), diedVerb: verbs.diedVerb }),
      })
    );
  } else if (lifeDates) {
    lines.push(
      variant(t, 'personSummary_datesPartial', `${person.id}:datesPartial`, {
        dates: lifeDates,
      })
    );
  } else {
    lines.push(variant(t, 'personSummary_datesUnknown', `${person.id}:datesUnknown`));
  }

  if (person.birthPlace?.trim()) {
    lines.push(
      variant(t, 'personSummary_birthPlace', `${person.id}:birthPlace`, {
        place: person.birthPlace.trim(),
      })
    );
  }

  if (person.occupation?.trim() && residenceCities.length > 1) {
    lines.push(
      variant(t, 'personSummary_workAndCities', `${person.id}:workAndCities`, {
        occupation: person.occupation.trim(),
        cities: residenceCitiesText,
        subjectPronoun: verbs.subjectPronoun,
        livedVisitedVerb: verbs.livedVisitedVerb,
      })
    );
  } else if (person.occupation?.trim() && residenceCityOne) {
    lines.push(
      variant(t, 'personSummary_workAndCity', `${person.id}:workAndCity`, {
        occupation: person.occupation.trim(),
        city: residenceCityOne,
        workedVerb: verbs.workedVerb,
        livedVerb: verbs.livedVerb,
      })
    );
  } else if (person.occupation?.trim()) {
    lines.push(
      variant(t, 'personSummary_workOnly', `${person.id}:workOnly`, {
        occupation: person.occupation.trim(),
      })
    );
  } else if (residenceCities.length > 1) {
    lines.push(
      variant(t, 'personSummary_cityOnlyMany', `${person.id}:cityOnlyMany`, {
        cities: residenceCitiesText,
        subjectPronoun: verbs.subjectPronoun,
        livedVisitedVerb: verbs.livedVisitedVerb,
      })
    );
  } else if (residenceCityOne) {
    lines.push(
      variant(t, 'personSummary_cityOnly', `${person.id}:cityOnly`, {
        city: residenceCityOne,
        livedVerb: verbs.livedVerb,
      })
    );
  }

  if (person.comment?.trim()) {
    lines.push(
      variant(t, 'personSummary_comment', `${person.id}:comment`, {
        comment: person.comment.trim(),
      })
    );
  }

  return lines;
}
