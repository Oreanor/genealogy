'use client';

import { memo } from 'react';
import { useTranslations } from '@/lib/i18n/context';
import { formatLifeDates, getFullName } from '@/lib/utils/person';
import { getTreeRoleKey } from '@/lib/utils/relationship';
import type { Person } from '@/lib/types/person';
import Image from 'next/image';

const MAX_NAME_LEN = 22;
const MAX_YEARS_LEN = 24;

export interface TreeNodeProps {
  person: Person | null;
  level: number;
  index: number;
  scale: number;
  onPersonClick: (personId: string) => void;
}

function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text;
}

export const TreeNode = memo(function TreeNode({
  person,
  level,
  index,
  scale,
  onPersonClick,
}: TreeNodeProps) {
  const t = useTranslations();
  const hasPerson = !!person;
  const roleKey = getTreeRoleKey(level, index, person);
  const role = roleKey ? t(roleKey) : '';
  const displayName = truncate(getFullName(person) || t('unknown'), MAX_NAME_LEN);
  const lifeDates = formatLifeDates(person?.birthDate, person?.deathDate);
  const displayYears = lifeDates ? truncate(lifeDates, MAX_YEARS_LEN) : '';

  const content = (
    <>
      {/* Oval: light ring between outlines, plaque color inside inner oval */}
      <div
        className="relative shrink-0 rounded-[50%] p-[2px] outline outline-2 outline-[var(--tree-stroke)] outline-offset-2 bg-[var(--background)]"
        style={{ width: '4.1rem', height: '5.3rem' }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-[50%] border-2 border-[var(--tree-stroke)] bg-[var(--tree-plaque-fill)]">
          {hasPerson && person.photoUrl ? (
            <Image
              src={person.photoUrl}
              alt=""
              fill
              className="object-cover object-top"
              sizes="5rem"
            />
          ) : null}
        </div>
      </div>

      {/* Plaque below portrait */}
      <div className="mt-[-0.2rem] w-full min-w-0 rounded-md border-2 border-[var(--tree-plaque-stroke)] bg-[var(--tree-plaque-fill)] px-2 py-2 text-center">
        {role && (
          <div className="text-xs leading-tight text-[var(--tree-stroke)]">
            {role}
          </div>
        )}
        <div className="truncate text-sm font-semibold leading-tight text-[var(--ink)]">
          {displayName}
        </div>
        {displayYears && (
          <div className="text-xs leading-tight text-[var(--tree-stroke)]">
            {displayYears}
          </div>
        )}
      </div>
    </>
  );

  const wrapperClass =
    'flex flex-col items-center origin-top transition-opacity hover:opacity-80';
  const style = { transform: `scale(${scale})`, minWidth: '5rem' };

  if (hasPerson) {
    return (
      <button
        type="button"
        className={`${wrapperClass} border-0 bg-transparent p-0`}
        style={style}
        aria-label={getFullName(person!)}
        onClick={() => onPersonClick(person!.id)}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={wrapperClass} style={style}>
      {content}
    </div>
  );
});
