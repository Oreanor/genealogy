'use client';

import { useMemo } from 'react';
import { useRootPersonId } from '@/lib/contexts/RootPersonContext';
import { buildTreeMatrix } from '@/lib/utils/tree';
import { TreeNode } from './TreeNode';

export interface FamilyTreeProps {
  onPersonClick: (personId: string) => void;
}

const VIEW_WIDTH = 120;
const VIEW_HEIGHT = 98;
const TREE_TOP_OFFSET = 8;

const OFFSET_PX_BY_LEVEL: number[] = [-10, 30, 20, -10, 0];
function getLevelOffsetPx(level: number): number {
  const base = OFFSET_PX_BY_LEVEL[level] ?? level * 10;
  return base;
}

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

export function FamilyTree({ onPersonClick }: FamilyTreeProps) {
  const rootPersonId = useRootPersonId();
  const matrix = useMemo(() => buildTreeMatrix(rootPersonId), [rootPersonId]);
  const totalLevels = matrix.length;

  return (
    <div
      className="relative w-full min-h-0 flex-1"
      style={{ aspectRatio: `${VIEW_WIDTH} / ${VIEW_HEIGHT}` }}
    >
      {matrix.map((row, level) =>
        row.map((person, index) => {
          const pos = getNodePosition(level, index, totalLevels);
          const offsetPx = getLevelOffsetPx(level);
          return (
            <div
              key={`node-${level}-${index}`}
              className="absolute origin-top"
              style={{
                left: `${pos.x}%`,
                top: `calc(${pos.y}% + ${offsetPx}px)`,
                transform: 'translate(-50%, 0)',
                zIndex: totalLevels - 1 - level,
              }}
            >
              <TreeNode
                person={person}
                level={level}
                index={index}
                scale={pos.scale}
                onPersonClick={onPersonClick}
              />
            </div>
          );
        })
      )}
    </div>
  );
}
