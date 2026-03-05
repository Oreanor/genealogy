'use client';

import { getRootPersonId } from '@/lib/data/root';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { buildTreeMatrix } from '@/lib/utils/tree';
import { useRouter } from 'next/navigation';
import { TreeNode } from './TreeNode';

/** Wider value gives more horizontal space between nodes */
const VIEW_WIDTH = 120;
/** Row height: nodes spaced more loosely vertically */
const VIEW_HEIGHT = 98;
const TREE_TOP_OFFSET = 8;

function getNodePosition(level: number, index: number, totalLevels: number) {
  const count = Math.pow(2, level);
  const x = ((2 * index + 1) / (2 * count)) * VIEW_WIDTH;
  const rowHeight = VIEW_HEIGHT / (totalLevels + 0.35);
  const y = VIEW_HEIGHT - (level + 0.7) * rowHeight - TREE_TOP_OFFSET;
  return {
    x: (x / VIEW_WIDTH) * 100,
    y: (y / VIEW_HEIGHT) * 100,
    scale: 0.75,
  };
}

export function FamilyTree() {
  const router = useRouter();
  const { routes } = useLocaleRoutes();
  const matrix = buildTreeMatrix(getRootPersonId());
  const totalLevels = matrix.length;

  const handlePersonClick = (personId: string) =>
    router.push(routes.person(personId));

  return (
    <div
      className="relative w-full min-h-0 flex-1"
      style={{ aspectRatio: `${VIEW_WIDTH} / ${VIEW_HEIGHT}` }}
    >
      {/* Nodes: draw ovals for all slots up to great-grandparents; empty slots as empty ovals */}
      {matrix.map((row, level) =>
        row.map((person, index) => {
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
