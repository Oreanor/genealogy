'use client';

import { useMemo } from 'react';
import { useRootPersonId } from '@/lib/contexts/RootPersonContext';
import { buildTreeMatrix } from '@/lib/utils/tree';
import { useIsMobile } from '@/hooks/useIsMobile';
import { TreeNode } from './TreeNode';

export interface FamilyTreeProps {
  onPersonClick: (personId: string) => void;
}

const VIEW_WIDTH = 120;
const VIEW_HEIGHT = 98;
const TREE_TOP_OFFSET = 8;
const BASE_SCALE = 0.75;

/** On mobile: grandparents +40%, parents +60%, me +80% of base scale (each tier +20% vs previous) */
function getScaleForLevel(level: number, isMobile: boolean): number {
  if (!isMobile) return BASE_SCALE;
  const multiplier = level <= 2 ? 1.8 - 0.2 * level : 1; // level 0 → 1.8, 1 → 1.6, 2 → 1.4, 3+ → 1
  return BASE_SCALE * multiplier;
}

const OFFSET_PX_BY_LEVEL: number[] = [-10, 30, 20, -10, 0];
/** On mobile: shift grandparents (2) and parents (1) up by 40px */
const MOBILE_LEVEL_UP_PX = 40;

function getLevelOffsetPx(level: number, isMobile: boolean): number {
  const base = OFFSET_PX_BY_LEVEL[level] ?? level * 10;
  if (isMobile && (level === 1 || level === 2)) return base - MOBILE_LEVEL_UP_PX;
  return base;
}

function getNodePosition(
  level: number,
  index: number,
  totalLevels: number,
  isMobile: boolean
) {
  const count = Math.pow(2, level);
  const x = ((2 * index + 1) / (2 * count)) * VIEW_WIDTH;
  const rowHeight = VIEW_HEIGHT / (totalLevels + 0.35);
  const y = VIEW_HEIGHT - (level + 0.7) * rowHeight - TREE_TOP_OFFSET;
  return {
    x: (x / VIEW_WIDTH) * 100,
    y: (y / VIEW_HEIGHT) * 100,
    scale: getScaleForLevel(level, isMobile),
  };
}

export function FamilyTree({ onPersonClick }: FamilyTreeProps) {
  const rootPersonId = useRootPersonId();
  const isMobile = useIsMobile();
  const matrix = useMemo(() => buildTreeMatrix(rootPersonId), [rootPersonId]);
  const totalLevels = matrix.length;

  return (
    <div className="flex min-h-0 flex-1 justify-center overflow-x-hidden overflow-y-auto md:overflow-visible">
      <div
        className="relative w-full min-h-full max-w-full origin-top md:min-h-0"
        style={{ aspectRatio: `${VIEW_WIDTH} / ${VIEW_HEIGHT}` }}
      >
      {matrix.map((row, level) =>
        row.map((person, index) => {
          const pos = getNodePosition(level, index, totalLevels, isMobile);
          const offsetPx = getLevelOffsetPx(level, isMobile);
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
    </div>
  );
}
