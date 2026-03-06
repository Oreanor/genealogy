'use client';

import { memo } from 'react';
import type { Person } from '@/lib/types/person';
import { getFullName } from '@/lib/utils/person';
import { getAvatarForPerson, getAvatarCropStyles } from '@/lib/data/photos';
import Image from 'next/image';

interface SiblingChipsProps {
  siblings: Person[];
  scale: number;
  onPersonClick: (personId: string) => void;
}

/** Mini oval size (~1/3 of the standard 4.1×5.3rem node) */
const CHIP_W = '1.4rem';
const CHIP_H = '1.8rem';

export const SiblingChips = memo(function SiblingChips({
  siblings,
  scale,
  onPersonClick,
}: SiblingChipsProps) {
  return (
    <div
      className="mt-1 flex flex-wrap items-start justify-center gap-[3px]"
      style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
    >
      {siblings.map((person) => {
        const avatar = getAvatarForPerson(person.id, person.avatarPhotoSrc);
        return (
          <button
            key={person.id}
            type="button"
            onClick={() => onPersonClick(person.id)}
            className="relative shrink-0 rounded-[50%] border border-(--tree-stroke) bg-(--tree-plaque-fill) overflow-hidden"
            style={{ width: CHIP_W, height: CHIP_H }}
            aria-label={getFullName(person)}
            title={getFullName(person)}
          >
            {avatar && (
              avatar.faceRect ? (
                <div
                  className="h-full w-full bg-(--tree-plaque-fill)"
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
                  sizes="1.4rem"
                />
              )
            )}
          </button>
        );
      })}
    </div>
  );
});
