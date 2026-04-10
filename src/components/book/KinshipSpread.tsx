'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useLocale, useLocaleRoutes } from '@/lib/i18n/context';
import { getPersons, getPersonById } from '@/lib/data/persons';
import { usePersonsOverlayRevision } from '@/hooks/usePersonsOverlayRevision';
import { getAvatarForPerson, getAvatarCropStyles } from '@/lib/data/photos';
import {
  formatLifeDates,
  formatNamePartsByLocale,
  formatPersonNameForLocale,
  sortPersonsBySurname,
} from '@/lib/utils/person';
import { getSiblings } from '@/lib/data/familyRelations';
import {
  findPeakParentEdgeIndex,
  getKinship,
  kinshipChainConnectorLabel,
  KIN_RELATION_KEY_TO_DESC_CATEGORY,
  type KinshipResult,
} from '@/lib/utils/kinship';
import type { Person } from '@/lib/types/person';
import { BookSpread } from './BookSpread';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CONTENT_LINK_CLASS } from '@/lib/constants/theme';

function PersonInfo({ person, pathname }: Readonly<{ person: Person; pathname: string }>) {
  const locale = useLocale();
  const dates = formatLifeDates(person.birthDate, person.deathDate);
  const siblings = getSiblings(person.id);

  return (
    <div className="flex flex-col items-center gap-1">
      <Link
        href={`${pathname}?section=persons&id=${person.id}`}
        className={`book-serif text-center text-lg font-semibold ${CONTENT_LINK_CLASS}`}
      >
        {formatPersonNameForLocale(person, locale)}
      </Link>
      <div className="space-y-0.5 text-center text-xs text-(--ink-muted)">
        {dates && <p>{dates}</p>}
        {person.birthPlace && <p>{person.birthPlace}</p>}
        {person.occupation && <p>{person.occupation}</p>}
      </div>
      {siblings.length > 0 && (
        <div className="mt-1 flex flex-wrap justify-center gap-x-2 gap-y-0.5 text-xs">
          {siblings.map((s) => (
            <Link
              key={s.id}
              href={`${pathname}?section=persons&id=${s.id}`}
              className={CONTENT_LINK_CLASS}
            >
              {formatPersonNameForLocale(s, locale)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function KinshipChain({
  result,
  t,
}: Readonly<{
  result: KinshipResult;
  t: (k: string) => string;
}>) {
  if (result.path.length <= 2) return null;

  const peakIdx = findPeakParentEdgeIndex(result.edgeKinds);
  const hasUp = result.edgeKinds.includes('parent');
  const hasDown = result.edgeKinds.includes('child');
  const hasSpouse = result.edgeKinds.includes('spouse');
  const isSideBranch = hasUp && hasDown && !hasSpouse;
  const middleIds = result.path.slice(1, -1);
  const middleKinds = result.edgeKinds.slice(1);

  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      <h3 className="book-serif text-lg font-semibold text-(--ink) md:text-xl">
        {t('kinshipChainLabel')}
      </h3>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {/* First person (A) */}
        <ChainNode
          person={getPersonById(result.path[0]!)}
          highlight={false}
        />
        {middleIds.map((id, i) => {
          const person = getPersonById(id);
          const isPeak = isSideBranch && i + 1 === peakIdx;
          const edgeIdx = i + 1;
          const label = kinshipChainConnectorLabel(result.edgeKinds[edgeIdx]!, person, t);
          const isSpouseEdge = result.edgeKinds[edgeIdx] === 'spouse';
          return (
            <span key={id} className="contents">
              <ChainArrow label={label} spouse={isSpouseEdge} />
              <ChainNode person={person} highlight={isPeak} t={t} />
            </span>
          );
        })}
        {/* Last person (B) */}
        <ChainArrow
          label={kinshipChainConnectorLabel(middleKinds.at(-1)!, getPersonById(result.path.at(-1)!), t)}
          spouse={middleKinds.at(-1) === 'spouse'}
        />
        <ChainNode
          person={getPersonById(result.path.at(-1)!)}
          highlight={false}
        />
      </div>
    </div>
  );
}

function ChainNode({
  person,
  highlight,
  t,
}: Readonly<{
  person: Person | null;
  highlight: boolean;
  t?: (k: string) => string;
}>) {
  const locale = useLocale();
  if (!person) return null;
  const localized = formatNamePartsByLocale(person, locale);
  const avatar = getAvatarForPerson(person.id, person.avatarPhotoSrc);
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`relative h-18 w-18 shrink-0 overflow-hidden rounded-full border-2 ${
          highlight
            ? 'border-(--accent) ring-2 ring-(--accent)/30'
            : 'border-(--border-subtle)'
        } bg-(--paper-light)`}
      >
        {avatar &&
          (avatar.faceRect ? (
            <div
              className="h-full w-full"
              style={getAvatarCropStyles(avatar.faceRect, avatar.src)}
              role="img"
              aria-hidden
            />
          ) : (
            <Image
              src={avatar.src}
              alt=""
              fill
              className="object-cover object-top"
              sizes="72px"
            />
          ))}
      </div>
      <div className={`flex max-w-20 flex-col items-center text-center text-xs leading-tight ${
        highlight ? 'font-bold text-(--ink)' : 'text-(--ink)'
      }`}>
        {localized.lastName && <span className="truncate">{localized.lastName}</span>}
        {localized.firstName && <span className="truncate">{localized.firstName}</span>}
        {localized.patronymic && <span className="truncate">{localized.patronymic}</span>}
      </div>
      {highlight && t && (
        <span className="text-[10px] text-(--ink-muted)">— {t('kinshipCommonAncestor').replace(/:$/, '')}</span>
      )}
    </div>
  );
}

function ChainArrow({ label, spouse }: Readonly<{ label: string; spouse?: boolean }>) {
  const color = spouse ? 'var(--ink-muted)' : 'var(--ink)';
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-xs ${spouse ? 'italic text-(--ink-muted)' : 'text-(--ink-muted)'}`}>{label}</span>
      <svg width="48" height="12" viewBox="0 0 48 12" className="shrink-0">
        <line x1="0" y1="6" x2="38" y2="6" stroke={color} strokeWidth="2" strokeDasharray={spouse ? '4 3' : undefined} />
        <polygon points="38,1 48,6 38,11" fill={color} />
      </svg>
    </div>
  );
}

export function KinshipSpread() {
  const { t, locale } = useLocaleRoutes();
  const pathname = usePathname() ?? '';
  const personsOverlayRev = usePersonsOverlayRevision();
  const sorted = useMemo(() => {
    void personsOverlayRev;
    return sortPersonsBySurname(getPersons());
  }, [personsOverlayRev]);

  const [idA, setIdA] = useState('');
  const [idB, setIdB] = useState('');

  const personA = idA ? getPersonById(idA) : null;
  const personB = idB ? getPersonById(idB) : null;

  const bothSelected = !!(idA && idB);
  const isSame = bothSelected && idA === idB;

  const resultAtoB = idA && idB && idA !== idB ? getKinship(idB, idA) : null;
  const resultBtoA = idA && idB && idA !== idB ? getKinship(idA, idB) : null;

  return (
    <BookSpread
      fullWidth={
        <div className="flex h-full w-full flex-col bg-(--paper) p-6 sm:p-8 md:p-9 shadow-inner">
          <h2 className="book-serif mb-6 hidden text-center text-xl font-semibold text-(--ink) md:mb-6 md:block md:text-2xl">
            {t('chapters_kinship')}
          </h2>

          {/* Selects row */}
          <div className="mb-6 flex justify-center gap-4 sm:gap-8 md:gap-12">
            <select
              value={idA}
              onChange={(e) => setIdA(e.target.value)}
              className="w-1/3 rounded border border-(--border-subtle) bg-(--paper) px-3 py-2 text-sm text-(--ink) focus:outline-none focus:ring-1 focus:ring-(--accent)"
            >
              <option value="">{t('kinshipSelectPerson')}</option>
              {sorted.map((p) => (
                <option key={p.id} value={p.id}>
                  {formatPersonNameForLocale(p, locale)}
                </option>
              ))}
            </select>
            <div className="w-1/3" />
            <select
              value={idB}
              onChange={(e) => setIdB(e.target.value)}
              className="w-1/3 rounded border border-(--border-subtle) bg-(--paper) px-3 py-2 text-sm text-(--ink) focus:outline-none focus:ring-1 focus:ring-(--accent)"
            >
              <option value="">{t('kinshipSelectPerson')}</option>
              {sorted.map((p) => (
                <option key={p.id} value={p.id}>
                  {formatPersonNameForLocale(p, locale)}
                </option>
              ))}
            </select>
          </div>

          {/* Person info + arrows */}
          <div className="mt-2 flex items-start justify-center gap-4 sm:gap-8 md:gap-12">
            <div className="flex w-1/3 flex-col items-center pt-6">
              {personA && <PersonInfo person={personA} pathname={pathname} />}
            </div>

            {/* Arrows + terms — fixed height to prevent layout shift */}
            <div className="flex w-1/3 min-h-40 flex-col items-stretch justify-center gap-1">
              {isSame && (
                <p className="book-serif text-center text-base text-(--ink-muted)">{t('kinSelf')}</p>
              )}
              {bothSelected && !isSame && !resultAtoB && !resultBtoA && (
                <p className="book-serif text-center text-base text-(--ink-muted)">{t('kinshipNoRelation')}</p>
              )}
              {resultAtoB && (
                <div className="flex flex-col items-center">
                  <p className="book-serif text-base font-bold text-(--ink) md:text-lg">
                    {t(resultAtoB.key)}
                  </p>
                  {KIN_RELATION_KEY_TO_DESC_CATEGORY[resultAtoB.key] && (
                    <p className="mt-0.5 text-xs italic text-(--ink-muted)">
                      {t(KIN_RELATION_KEY_TO_DESC_CATEGORY[resultAtoB.key])}
                    </p>
                  )}
                  <svg className="my-2 w-full" height="20" viewBox="0 0 200 20" preserveAspectRatio="none">
                    <line x1="0" y1="10" x2="182" y2="10" stroke="var(--ink)" strokeWidth="3" />
                    <polygon points="182,2 200,10 182,18" fill="var(--ink)" />
                  </svg>
                </div>
              )}
              {resultBtoA && (
                <div className="flex flex-col items-center">
                  <svg className="my-2 w-full" height="20" viewBox="0 0 200 20" preserveAspectRatio="none">
                    <line x1="18" y1="10" x2="200" y2="10" stroke="var(--ink)" strokeWidth="3" />
                    <polygon points="18,2 0,10 18,18" fill="var(--ink)" />
                  </svg>
                  <p className="book-serif text-base font-bold text-(--ink) md:text-lg">
                    {t(resultBtoA.key)}
                  </p>
                  {KIN_RELATION_KEY_TO_DESC_CATEGORY[resultBtoA.key] && (
                    <p className="mt-0.5 text-xs italic text-(--ink-muted)">
                      {t(KIN_RELATION_KEY_TO_DESC_CATEGORY[resultBtoA.key])}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex w-1/3 flex-col items-center pt-6">
              {personB && <PersonInfo person={personB} pathname={pathname} />}
            </div>
          </div>

          {/* Chain: path through common ancestor */}
          {resultAtoB && resultAtoB.path.length > 2 && (
            <KinshipChain result={resultAtoB} t={t} />
          )}
        </div>
      }
    />
  );
}
