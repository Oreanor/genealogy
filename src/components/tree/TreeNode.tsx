'use client';

import { memo } from 'react';
import { formatLifeDates, getFullName } from '@/lib/utils/person';
import type { Person } from '@/lib/types/person';
import { getAvatarForPerson, getAvatarCropStyles } from '@/lib/data/photos';
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
}

function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text;
}

export const TreeNode = memo(function TreeNode({
  person,
  scale,
  onPersonClick,
  onAvatarRef,
  kinshipHint,
  isKinshipSelected,
}: TreeNodeProps) {
  const hasPerson = !!person;
  const surname = hasPerson && person?.lastName?.trim() ? truncate(person.lastName.trim(), MAX_NAME_LEN) : '';
  const firstName = hasPerson && person?.firstName?.trim() ? truncate(person.firstName.trim(), MAX_NAME_LEN) : '';
  const patronymic = hasPerson && person?.patronymic?.trim() ? truncate(person.patronymic.trim(), MAX_NAME_LEN) : '';
  const lifeDates = hasPerson ? formatLifeDates(person?.birthDate, person?.deathDate) : '';

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

  const content = (
    <>
      <div className="relative z-10">
      <div
        ref={onAvatarRef}
        className={`relative shrink-0 rounded-[50%] p-[1px] outline outline-2 bg-(--background) ${strokeClass} ${
          hasPerson && isKinshipSelected ? 'ring-2 ring-(--ink)/25' : ''
        } w-[3.6rem] h-[4.6rem] md:w-[5.8rem] md:h-[7.4rem]`}
      >
        <div className={`relative h-full w-full overflow-hidden rounded-[50%] border-2 ${strokeClass} ${plaqueFillClass}`}>
          {hasPerson && (() => {
            const avatar = getAvatarForPerson(person!.id, person!.avatarPhotoSrc);
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
          })()}
        </div>

        {kinshipHint && isKinshipSelected && (
          <div
            className="pointer-events-none absolute left-1/2 top-1 z-30 w-max max-w-none -translate-x-1/2 whitespace-normal break-words rounded-md bg-black/65 px-2 py-0.5 text-[12px] font-semibold leading-tight text-white shadow-sm"
          >
            {kinshipHint}
          </div>
        )}
      </div>
      </div>

      {/* Plaque below portrait */}
      <div className={`relative z-20 mt-[-0.15rem] md:mt-[-0.2rem] w-full min-w-0 rounded-md border-2 px-1.5 py-1 md:px-2 md:py-2 text-center ${plaqueStrokeClass} ${plaqueFillClass}`}>
        {hasPerson && (surname || firstName || patronymic || lifeDates) && (
          <div className={`leading-tight text-(--ink) ${isKinshipSelected ? 'font-semibold' : ''}`}>
            {surname && <div className="truncate text-xs font-semibold md:text-base">{surname}</div>}
            {firstName && <div className="truncate text-[10px] font-semibold md:text-sm">{firstName}</div>}
            {patronymic && <div className="truncate text-[10px] font-semibold md:text-sm">{patronymic}</div>}
            {lifeDates && <div className="truncate pt-0.5 text-[9px] font-normal opacity-80 md:text-xs">{lifeDates}</div>}
          </div>
        )}
      </div>
    </>
  );

  const wrapperClass =
    'flex flex-col items-center origin-top min-w-[2.5rem] md:min-w-[5rem]';
  const style = { transform: `scale(${scale})` };

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
