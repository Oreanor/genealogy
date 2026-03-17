'use client';

import { memo } from 'react';
import { getFullName } from '@/lib/utils/person';
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
  const hasPerson = !!person;
  const surname = hasPerson && person?.lastName?.trim() ? truncate(person.lastName.trim(), MAX_NAME_LEN) : '';
  const firstName = hasPerson && person?.firstName?.trim() ? truncate(person.firstName.trim(), MAX_NAME_LEN) : '';
  const patronymic = hasPerson && person?.patronymic?.trim() ? truncate(person.patronymic.trim(), MAX_NAME_LEN) : '';

  const strokeClass = hasPerson ? 'outline-(--tree-stroke) border-(--tree-stroke)' : 'outline-gray-300 border-gray-300';
  const plaqueStrokeClass = hasPerson ? 'border-(--tree-plaque-stroke)' : 'border-gray-300';
  const plaqueFillClass = hasPerson ? 'bg-(--tree-plaque-fill)' : 'bg-gray-100';

  const content = (
    <>
      <div className="relative z-10">
      <div
        className={`relative shrink-0 rounded-[50%] p-[1px] outline outline-2 bg-(--background) ${strokeClass} w-[3.6rem] h-[4.6rem] md:w-[5.8rem] md:h-[7.4rem]`}
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
      </div>
      </div>

      {/* Plaque below portrait */}
      <div className={`mt-[-0.15rem] md:mt-[-0.2rem] w-full min-w-0 rounded-md border-2 px-1.5 py-1 md:px-2 md:py-2 text-center ${plaqueStrokeClass} ${plaqueFillClass}`}>
        {hasPerson && (surname || firstName || patronymic) && (
          <div className="leading-tight text-(--ink)">
            {surname && <div className="truncate text-xs font-semibold md:text-base">{surname}</div>}
            {firstName && <div className="truncate text-[10px] font-semibold md:text-sm">{firstName}</div>}
            {patronymic && <div className="truncate text-[10px] font-semibold md:text-sm">{patronymic}</div>}
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
