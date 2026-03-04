'use client';

import { ROOT_PERSON_ID } from '@/lib/constants/chapters';
import { ROUTES } from '@/lib/constants/routes';
import { buildTreeMatrix } from '@/lib/utils/tree';
import { useRouter } from 'next/navigation';
import { TreeNode } from './TreeNode';

const VIEW_WIDTH = 80;
const VIEW_HEIGHT = 48;

function getNodePosition(level: number, index: number, totalLevels: number) {
  const count = Math.pow(2, level);
  const x = ((2 * index + 1) / (2 * count)) * VIEW_WIDTH;
  const rowHeight = VIEW_HEIGHT / (totalLevels + 0.6);
  const y = VIEW_HEIGHT - (level + 0.7) * rowHeight;
  const scale = 1 - level * 0.04;
  return { x, y, scale: Math.max(0.55, scale) };
}

export function FamilyTree() {
  const router = useRouter();
  const matrix = buildTreeMatrix(ROOT_PERSON_ID);
  const totalLevels = matrix.length;

  const handlePersonClick = (personId: string) => {
    router.push(ROUTES.person(personId));
  };

  return (
    <div className="flex h-full w-full items-stretch justify-center p-1">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="h-full w-full min-w-0"
        preserveAspectRatio="xMidYMid meet"
      >
        {matrix.slice(1).map((row, levelIdx) =>
          row.map((person, index) => {
            if (!person) return null;
            const { x: childX, y: childY } = getNodePosition(
              levelIdx + 1,
              index,
              totalLevels
            );
            const { x: parentX, y: parentY } = getNodePosition(
              levelIdx,
              index >> 1,
              totalLevels
            );
            const midX = (childX + parentX) / 2;
            return (
              <path
                key={`line-${levelIdx}-${index}`}
                d={`M ${childX} ${childY} L ${midX} ${childY} L ${midX} ${parentY} L ${parentX} ${parentY}`}
                fill="none"
                stroke="#78716c"
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
            return (
              <TreeNode
                key={`node-${level}-${index}`}
                person={person}
                x={x}
                y={y}
                scale={scale}
                onPersonClick={handlePersonClick}
              />
            );
          })
        )}
      </svg>
    </div>
  );
}
