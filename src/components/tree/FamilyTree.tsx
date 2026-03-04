'use client';

import { ROOT_PERSON_ID } from '@/lib/constants/chapters';
import { ROUTES } from '@/lib/constants/routes';
import type { Person } from '@/lib/types/person';
import { getSiblings } from '@/lib/utils/person';
import { buildTreeMatrix } from '@/lib/utils/tree';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import {
  NODE_SCALE,
  OVAL_TOP_OFFSET,
  PLAQUE_BOTTOM_OFFSET,
  TreeNode,
} from './TreeNode';

const VIEW_WIDTH = 80;
const VIEW_HEIGHT = 72; /* 48 * 1.5 — уровни расставлены в 1.5 раза шире по вертикали */
const TREE_TOP_OFFSET = 15; /* сдвиг дерева вверх */

function getNodePosition(level: number, index: number, totalLevels: number) {
  const count = Math.pow(2, level);
  const x = ((2 * index + 1) / (2 * count)) * VIEW_WIDTH;
  const rowHeight = VIEW_HEIGHT / (totalLevels + 0.6);
  const y = VIEW_HEIGHT - (level + 0.7) * rowHeight - TREE_TOP_OFFSET;
  const scale = 1 - level * 0.04;
  return { x, y, scale: Math.max(0.55, scale) };
}

export function FamilyTree() {
  const router = useRouter();
  const matrix = buildTreeMatrix(ROOT_PERSON_ID);
  const totalLevels = matrix.length;
  const [siblingsPopup, setSiblingsPopup] = useState<{
    x: number;
    y: number;
    siblings: Person[];
  } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const handlePersonClick = (personId: string) => {
    router.push(ROUTES.person(personId));
  };

  const handleSiblingsBadgeClick = useCallback(
    (siblings: Person[], e: React.MouseEvent) => {
      setSiblingsPopup({ x: e.clientX, y: e.clientY, siblings });
    },
    []
  );

  const closePopup = useCallback(() => setSiblingsPopup(null), []);

  return (
    <div
      className="relative flex h-full w-full items-stretch justify-center p-1"
      onClick={siblingsPopup ? closePopup : undefined}
      onKeyDown={(e) => siblingsPopup && e.key === 'Escape' && closePopup()}
    >
      {siblingsPopup && (
        <div
          ref={popupRef}
          className="fixed z-30 min-w-[180px] rounded-lg border border-amber-800/40 bg-white py-2 shadow-xl"
          style={{ left: siblingsPopup.x, top: siblingsPopup.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="mb-1 px-3 text-xs font-medium text-amber-900/70">
            Братья и сёстры:
          </p>
          {siblingsPopup.siblings.map((s) => (
            <Link
              key={s.id}
              href={ROUTES.person(s.id)}
              className="block px-3 py-1 text-sm text-amber-800 underline hover:bg-amber-100 hover:text-amber-900"
              onClick={closePopup}
            >
              {s.name}
            </Link>
          ))}
        </div>
      )}
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="h-full w-full min-w-0"
        preserveAspectRatio="xMidYMid meet"
      >
        {matrix.slice(1).map((row, levelIdx) =>
          row.map((person, index) => {
            if (!person) return null;
            const childPos = getNodePosition(levelIdx + 1, index, totalLevels);
            const parentPos = getNodePosition(
              levelIdx,
              index >> 1,
              totalLevels
            );
            const childScale = childPos.scale * NODE_SCALE;
            const parentScale = parentPos.scale * NODE_SCALE;
            // Нижний (parentPos = «я») — линия выходит из верха его портрета; верхний (childPos = родитель) — линия приходит к низу его плашки
            const fromY = parentPos.y + parentScale * OVAL_TOP_OFFSET;
            const toY = childPos.y + childScale * PLAQUE_BOTTOM_OFFSET;
            const midX = (childPos.x + parentPos.x) / 2;
            return (
              <path
                key={`line-${levelIdx}-${index}`}
                d={`M ${parentPos.x} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${childPos.x} ${toY}`}
                fill="none"
                stroke="var(--tree-stroke)"
                strokeWidth="0.1"
              />
            );
          })
        )}
        {matrix.map((row, level) =>
          row.map((person, index) => {
            const isLastLevel = level === totalLevels - 1;
            if (isLastLevel && !person) return null;
            const { x, y, scale } = getNodePosition(level, index, totalLevels);
            const sibs = person ? getSiblings(person.id) : [];
            return (
              <TreeNode
                key={`node-${level}-${index}`}
                person={person}
                x={x}
                y={y}
                scale={scale}
                level={level}
                index={index}
                siblings={sibs}
                onPersonClick={handlePersonClick}
                onSiblingsBadgeClick={handleSiblingsBadgeClick}
              />
            );
          })
        )}
      </svg>
    </div>
  );
}
