'use client';

import { memo, useMemo } from 'react';
import { useLocale } from '@/lib/i18n/context';
import type { Locale } from '@/lib/i18n/config';
import { formatLifeDates, formatPersonNameForLocale } from '@/lib/utils/person';
import type { Person } from '@/lib/types/person';
import { getAvatarForPerson, getAvatarCropStyles } from '@/lib/data/photos';
import { getSiblings } from '@/lib/data/familyRelations';
import Image from 'next/image';

const MAX_NAME_LEN = 22;

export interface TreeNodeProps {
  person: Person | null;
  level: number;
  index: number;
  scale: number;
  onPersonClick: (personId: string) => void;
  onAvatarRef?: (el: HTMLDivElement | null) => void;
  /** When kinship pick mode is active, show who this person is to the other selected one. */
  kinshipHint?: string | null;
  /** Visual selection state (kinship pick mode). */
  isKinshipSelected?: boolean;
  /** Sibling mini-avatars beside the oval (off in descendants tree — siblings are already separate nodes). */
  showSiblings?: boolean;
}

function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text;
}

function siblingShortLabel(person: Person, locale: Locale): string {
  const last = (person.lastName ?? '').trim();
  const firstInitial = (person.firstName ?? '').trim().charAt(0);
  const patronymicInitial = (person.patronymic ?? '').trim().charAt(0);
  const initials = `${firstInitial ? `${firstInitial}.` : ''}${patronymicInitial ? `${patronymicInitial}.` : ''}`;
  const lastPart = last ? truncate(last, 10) : '';
  const label = [lastPart, initials].filter(Boolean).join(' ');
  return label || formatPersonNameForLocale(person, locale);
}

function TreeNodeBase({
  person,
  scale,
  onPersonClick,
  onAvatarRef,
  kinshipHint,
  isKinshipSelected,
  showSiblings = true,
}: TreeNodeProps) {
  const locale = useLocale();
  const hasPerson = !!person;
  const siblings = useMemo(
    () => (person && showSiblings ? getSiblings(person.id) : []),
    [person, showSiblings]
  );
  const surname = hasPerson && person?.lastName?.trim() ? truncate(person.lastName.trim(), MAX_NAME_LEN) : '';
  const firstName = hasPerson && person?.firstName?.trim() ? truncate(person.firstName.trim(), MAX_NAME_LEN) : '';
  const patronymic = hasPerson && person?.patronymic?.trim() ? truncate(person.patronymic.trim(), MAX_NAME_LEN) : '';
  const lifeDates = hasPerson ? formatLifeDates(person?.birthDate, person?.deathDate) : '';
  const hasRawNameParts = Boolean(surname || firstName || patronymic);
  const templateDisplayName =
    hasPerson && !hasRawNameParts ? formatPersonNameForLocale(person!, locale) : '';

  const strokeClass = hasPerson
    ? isKinshipSelected
      ? 'outline-(--ink) border-(--ink)'
      : 'outline-(--tree-stroke) border-(--tree-stroke)'
    : 'outline-gray-300 border-gray-300';
  const plaqueStrokeClass = hasPerson
    ? isKinshipSelected
      ? 'border-(--ink)'
      : 'border-(--tree-plaque-stroke)'
    : 'border-gray-300';
  const plaqueFillClass = hasPerson
    ? isKinshipSelected
      ? 'bg-(--paper)'
      : 'bg-(--tree-plaque-fill)'
    : 'bg-gray-100';

  const renderAvatarFill = (p: Person) => {
    const avatar = getAvatarForPerson(p.id, p.avatarPhotoSrc);
    if (!avatar) return null;
    if (avatar.faceRect) {
      return (
        <div
          className="absolute inset-0 bg-(--tree-plaque-fill)"
          style={getAvatarCropStyles(avatar.faceRect, avatar.src)}
          role="img"
          aria-hidden
        />
      );
    }
    return (
      <Image
        src={avatar.src}
        alt=""
        fill
        className="object-cover object-top"
        sizes="5rem"
      />
    );
  };

  const ovalInner = (
    <>
      <div className={`relative h-full w-full overflow-hidden rounded-[50%] border-2 ${strokeClass} ${plaqueFillClass}`}>
        {hasPerson ? renderAvatarFill(person!) : null}
      </div>
      {kinshipHint && isKinshipSelected && (
        <div className="pointer-events-none absolute left-1/2 top-1 z-30 w-max max-w-none -translate-x-1/2 whitespace-normal break-words rounded-md bg-black/65 px-2 py-0.5 text-[12px] font-semibold leading-tight text-white shadow-sm">
          {kinshipHint}
        </div>
      )}
    </>
  );

  const mainContent = (
    <>
      <div className="relative z-10 inline-block">
        {hasPerson ? (
          <>
            <button
              type="button"
              className="block border-0 bg-transparent p-0"
              aria-label={formatPersonNameForLocale(person!, locale)}
              onClick={() => onPersonClick(person!.id)}
            >
              <div
                ref={onAvatarRef}
                className={`relative shrink-0 origin-center rounded-[50%] p-[1px] outline outline-2 transition-transform duration-200 ease-out will-change-transform group-hover:scale-[1.15] bg-(--background) ${strokeClass} ${
                  isKinshipSelected ? 'ring-2 ring-(--ink)/25' : ''
                } w-[3.6rem] h-[4.6rem] md:w-[5.8rem] md:h-[7.4rem]`}
              >
                {ovalInner}
              </div>
            </button>
            {siblings.length > 0 && (
              <div className="absolute left-full top-1/2 ml-1 -mt-0.5 flex -translate-x-[10px] -translate-y-1/2 flex-row items-center -space-x-2 md:ml-1.5 md:-space-x-3">
                {siblings.map((sibling, sibIndex) => (
                  <button
                    key={sibling.id}
                    type="button"
                    onClick={() => onPersonClick(sibling.id)}
                    className="relative flex flex-col items-center border-0 bg-transparent p-0 transition-transform duration-200 ease-out will-change-transform hover:scale-[1.15]"
                    style={{ zIndex: 11 + sibIndex }}
                    aria-label={formatPersonNameForLocale(sibling, locale)}
                    title={formatPersonNameForLocale(sibling, locale)}
                  >
                    <div className="rounded-[50%] border border-(--tree-stroke) bg-(--tree-plaque-fill) p-[1px] shadow-sm">
                      <div className="relative h-[3.2rem] w-[2.5rem] overflow-hidden rounded-[50%] border border-(--tree-stroke) md:h-[5.2rem] md:w-[4.1rem]">
                        {renderAvatarFill(sibling)}
                      </div>
                    </div>
                    <span className="-mt-2.5 z-10 max-w-[4.8rem] truncate whitespace-nowrap rounded border border-(--tree-plaque-stroke) bg-(--tree-plaque-fill) px-1 py-0.5 text-center text-[8px] leading-none text-(--ink) md:-mt-3 md:max-w-[7.2rem] md:text-[10px]">
                      {siblingShortLabel(sibling, locale)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div
            ref={onAvatarRef}
            className={`relative shrink-0 origin-center rounded-[50%] p-[1px] outline outline-2 transition-transform duration-200 ease-out will-change-transform group-hover:scale-[1.15] bg-(--background) ${strokeClass} w-[3.6rem] h-[4.6rem] md:w-[5.8rem] md:h-[7.4rem]`}
          >
            {ovalInner}
          </div>
        )}
      </div>

      {/* Plaque below portrait */}
      {hasPerson ? (
        <button
          type="button"
          className={`relative z-20 mt-[-0.15rem] block w-full min-w-[3.8rem] max-w-[7.4rem] cursor-pointer rounded-md border-2 px-1.5 py-1 text-center font-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ink)/25 md:mt-[-0.2rem] md:min-w-[6rem] md:max-w-[11rem] md:px-2 md:py-2 ${plaqueStrokeClass} ${plaqueFillClass}`}
          aria-label={formatPersonNameForLocale(person!, locale)}
          onClick={() => onPersonClick(person!.id)}
        >
          {(hasRawNameParts || lifeDates || templateDisplayName) && (
            <div className={`leading-tight text-(--ink) ${isKinshipSelected ? 'font-semibold' : ''}`}>
              {hasRawNameParts && (
                <>
                  {surname && <div className="break-words text-xs font-semibold md:text-base">{surname}</div>}
                  {firstName && <div className="break-words text-[10px] font-semibold md:text-sm">{firstName}</div>}
                  {patronymic && <div className="break-words text-[10px] font-semibold md:text-sm">{patronymic}</div>}
                </>
              )}
              {!hasRawNameParts && templateDisplayName && (
                <div className="break-words text-xs font-semibold md:text-base">{templateDisplayName}</div>
              )}
              {lifeDates && <div className="break-words pt-0.5 text-[9px] font-normal opacity-80 md:text-xs">{lifeDates}</div>}
            </div>
          )}
        </button>
      ) : (
        <div className={`relative z-20 mt-[-0.15rem] md:mt-[-0.2rem] min-w-[3.8rem] md:min-w-[6rem] max-w-[7.4rem] md:max-w-[11rem] rounded-md border-2 px-1.5 py-1 md:px-2 md:py-2 text-center ${plaqueStrokeClass} ${plaqueFillClass}`} />
      )}
    </>
  );

  const wrapperClass =
    'flex flex-col items-center origin-top min-w-[2.5rem] md:min-w-[5rem]';
  const style = { transform: `scale(${scale})` };

  if (hasPerson) {
    return (
      <div className={wrapperClass} style={style}>
        <div className="group relative flex w-max flex-col items-center">{mainContent}</div>
      </div>
    );
  }

  return (
    <div className={`${wrapperClass} group`} style={style}>
      {mainContent}
    </div>
  );
}

export const TreeNode = memo(TreeNodeBase);
