'use client';

import { ROOT_PERSON_ID } from '@/lib/constants/chapters';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { buildTreeMatrix } from '@/lib/utils/tree';
import { useRouter } from 'next/navigation';
import { TreeNode } from './TreeNode';

/** Шире — больше горизонтального пространства между узлами */
const VIEW_WIDTH = 110;
/** Высота: ряды узлов расставлены свободнее по вертикали */
const VIEW_HEIGHT = 86;
const TREE_TOP_OFFSET = 15;

function getNodePosition(level: number, index: number, totalLevels: number) {
  const count = Math.pow(2, level);
  const x = ((2 * index + 1) / (2 * count)) * VIEW_WIDTH;
  const rowHeight = VIEW_HEIGHT / (totalLevels + 0.6);
  const y = VIEW_HEIGHT - (level + 0.7) * rowHeight - TREE_TOP_OFFSET;
  const scale = 1 - level * 0.04;
  return {
    x: (x / VIEW_WIDTH) * 100,
    y: (y / VIEW_HEIGHT) * 100,
    scale: Math.max(0.55, scale),
  };
}

export function FamilyTree() {
  const router = useRouter();
  const { routes } = useLocaleRoutes();
  const matrix = buildTreeMatrix(ROOT_PERSON_ID);
  const totalLevels = matrix.length;

  const handlePersonClick = (personId: string) =>
    router.push(routes.person(personId));

  return (
    <div
      className="relative w-full min-h-0 flex-1"
      style={{ aspectRatio: `${VIEW_WIDTH} / ${VIEW_HEIGHT}` }}
    >
      {/* Узлы */}
      {matrix.map((row, level) =>
        row.map((person, index) => {
          if (!person) return null;
          const pos = getNodePosition(level, index, totalLevels);
          return (
            <div
              key={`node-${level}-${index}`}
              className="absolute origin-top"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: `translate(-50%, 0)`,
              }}
            >
              <TreeNode
                person={person}
                level={level}
                index={index}
                scale={pos.scale}
                onPersonClick={handlePersonClick}
              />
            </div>
          );
        })
      )}
    </div>
  );
}
