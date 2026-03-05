'use client';

import { useMemo, useState } from 'react';
import { getRootPersonId } from '@/lib/data/root';
import { buildTreeMatrix } from '@/lib/utils/tree';
import { getSiblings, getCousins } from '@/lib/utils/person';
import type { Person } from '@/lib/types/person';
import { TreeNode } from './TreeNode';
import { SiblingChips } from './SiblingChips';

export interface FamilyTreeProps {
  onPersonClick: (personId: string) => void;
}

const VIEW_WIDTH = 120;
const VIEW_HEIGHT = 98;
const TREE_TOP_OFFSET = 8;

const OFFSET_PX_BY_LEVEL: number[] = [0, 10, 20, 30, 40];
function getLevelOffsetPx(level: number): number {
  return OFFSET_PX_BY_LEVEL[level] ?? level * 10;
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

/** Siblings + first cousins for each person in the tree, excluding those already placed. */
function buildSiblingsMap(matrix: (Person | null)[][]): Map<string, Person[]> {
  const treeIds = new Set(matrix.flat().filter(Boolean).map((p) => p!.id));
  const map = new Map<string, Person[]>();

  for (const row of matrix) {
    for (const person of row) {
      if (!person) continue;
      const sibs = getSiblings(person.id);
      const cousins = getCousins(person.id);
      const all = [...sibs, ...cousins].filter((p) => !treeIds.has(p.id));
      const unique = Array.from(new Map(all.map((p) => [p.id, p])).values());
      if (unique.length > 0) map.set(person.id, unique);
    }
  }
  return map;
}

export function FamilyTree({ onPersonClick }: FamilyTreeProps) {
  const matrix = buildTreeMatrix(getRootPersonId());
  const totalLevels = matrix.length;
  const siblingsMap = useMemo(() => buildSiblingsMap(matrix), [matrix]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div
      className="relative w-full min-h-0 flex-1"
      style={{ aspectRatio: `${VIEW_WIDTH} / ${VIEW_HEIGHT}` }}
    >
      {matrix.map((row, level) =>
        row.map((person, index) => {
          const pos = getNodePosition(level, index, totalLevels);
          const offsetPx = getLevelOffsetPx(level);
          const siblings = person ? siblingsMap.get(person.id) : undefined;
          const isExpanded = person?.id === expandedId;
          return (
            <div
              key={`node-${level}-${index}`}
              className="absolute origin-top"
              style={{
                left: `${pos.x}%`,
                top: `calc(${pos.y}% + ${offsetPx}px)`,
                transform: 'translate(-50%, 0)',
                zIndex: isExpanded ? 100 : totalLevels - 1 - level,
              }}
            >
              <TreeNode
                person={person}
                level={level}
                index={index}
                scale={pos.scale}
                onPersonClick={onPersonClick}
                siblingCount={siblings?.length ?? 0}
                onSiblingBadgeClick={
                  siblings && siblings.length > 0
                    ? () => setExpandedId(isExpanded ? null : person!.id)
                    : undefined
                }
              />
              {isExpanded && siblings && siblings.length > 0 && (
                <SiblingChips
                  siblings={siblings}
                  scale={pos.scale}
                  onPersonClick={onPersonClick}
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
