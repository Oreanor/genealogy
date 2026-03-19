import type { Person } from '@/lib/types/person';
import { formatLifeDates } from '@/lib/utils/person';

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
  return t(`${baseKey}_${n}`, params);
}

function genderedVerbs(person: Person): {
  bornVerb: string;
  diedVerb: string;
  workedVerb: string;
  livedVerb: string;
} {
  if (person.gender === 'f') {
    return {
      bornVerb: 'Родилась',
      diedVerb: 'ушла из жизни',
      workedVerb: 'Работала',
      livedVerb: 'жила',
    };
  }
  return {
    bornVerb: 'Родился',
    diedVerb: 'ушёл из жизни',
    workedVerb: 'Работал',
    livedVerb: 'жил',
  };
}

function isYearOnlyDate(value?: string): boolean {
  const trimmed = value?.trim();
  return Boolean(trimmed && /^\d{4}$/.test(trimmed));
}

export function buildPersonSummary(person: Person, t: TFunction): string[] {
  const lines: string[] = [];
  const lifeDates = formatLifeDates(person.birthDate, person.deathDate);
  const verbs = genderedVerbs(person);
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

  if (person.occupation?.trim() && person.residenceCity?.trim()) {
    lines.push(
      variant(t, 'personSummary_workAndCity', `${person.id}:workAndCity`, {
        occupation: person.occupation.trim(),
        city: person.residenceCity.trim(),
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
  } else if (person.residenceCity?.trim()) {
    lines.push(
      variant(t, 'personSummary_cityOnly', `${person.id}:cityOnly`, {
        city: person.residenceCity.trim(),
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
