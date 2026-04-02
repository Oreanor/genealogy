'use client';

import { useCallback, useMemo, useRef } from 'react';
import { useRootPersonId } from '@/lib/contexts/RootPersonContext';
import {
  buildDescendantsMatrix,
  buildTreeMatrix,
  computeAncestorLayoutX,
  computeDescendantLayoutX,
} from '@/lib/utils/tree';
import type { Person } from '@/lib/types/person';
import { TreeNode } from './TreeNode';
import { useTreePan } from './useTreePan';
import { useTreeSegments } from './useTreeSegments';

export interface FamilyTreeProps {
  onPersonClick: (personId: string) => void;
  kinshipMode?: boolean;
  kinshipSelectedIds?: string[];
  onKinshipSelect?: (personId: string) => void;
  kinshipHintById?: Record<string, string | null | undefined>;
  treeMode?: 'ancestors' | 'descendants';
}

/** Stable defaults — avoid new [] / {} each render (useLayoutEffect deps). */
const DEFAULT_KINSHIP_SELECTED_IDS: string[] = [];
const DEFAULT_KINSHIP_HINT_BY_ID: Record<string, string | null | undefined> = {};

const TREE_LAYOUT = {
  view: {
    width: 120,
    height: 98,
  },
  node: {
    baseScale: 0.75,
  },
  pan: {
    limitX: 1100,
    /** Baseline vertical pan (px); `panVerticalLimits` adds headroom per tree level. */
    limitYDownBase: 120,
    limitYUpBase: -210,
    initialY: 0,
    dragStartThresholdPx: 6,
    /** Extra downward pan (px) per generation beyond the first four (ancestors stack upward). */
    extraLimitYDownPerLevel: 82,
    extraLimitYUpPerLevel: 58,
  },
  spacing: {
    safeTopPct: 12,
    safeBottomPctDescendants: 12,
    safeBottomPctAncestors: 40,
    generationStepMultDescendants: 1.35,
    generationStepMultAncestors: 1.25,
    minGenerationStepPxDescendants: 28,
    minGenerationStepPxAncestors: 24,
    horizontalSpreadMult: 1.35,
  },
} as const;

function getScaleForLevel(): number {
  return TREE_LAYOUT.node.baseScale;
}

function getNodePosition(
  level: number,
  index: number,
  visibleLevelCount: number,
  treeMode: 'ancestors' | 'descendants',
  rowCount: number,
  nodeXByKey: Map<string, number> | null
) {
  const count = treeMode === 'descendants' ? Math.max(1, rowCount) : Math.pow(2, level);
  const xPx =
    nodeXByKey
      ? (nodeXByKey.get(`${level}-${index}`) ??
          ((2 * index + 1) / (2 * count)) * TREE_LAYOUT.view.width)
      : ((2 * index + 1) / (2 * count)) * TREE_LAYOUT.view.width;
  const xRaw = (xPx / TREE_LAYOUT.view.width) * 100;
  const x = 50 + (xRaw - 50) * TREE_LAYOUT.spacing.horizontalSpreadMult;
  const heightPx = TREE_LAYOUT.view.height;
  const topPadPx = (heightPx * TREE_LAYOUT.spacing.safeTopPct) / 100;
  const bottomSafePct =
    treeMode === 'ancestors'
      ? TREE_LAYOUT.spacing.safeBottomPctAncestors
      : TREE_LAYOUT.spacing.safeBottomPctDescendants;
  const bottomPadPx = (heightPx * bottomSafePct) / 100;
  const usableHeightPx = Math.max(1, heightPx - topPadPx - bottomPadPx);
  const baseRowStep = usableHeightPx / Math.max(1, visibleLevelCount);
  const rowStepRaw =
    baseRowStep *
    (treeMode === 'descendants'
      ? TREE_LAYOUT.spacing.generationStepMultDescendants
      : TREE_LAYOUT.spacing.generationStepMultAncestors);
  const minRowStepPx =
    treeMode === 'descendants'
      ? TREE_LAYOUT.spacing.minGenerationStepPxDescendants
      : TREE_LAYOUT.spacing.minGenerationStepPxAncestors;
  const rowStep = Math.max(minRowStepPx, rowStepRaw);
  const y =
    treeMode === 'descendants'
      ? (() => {
          // Root starts from top safe zone, children go downward within inner bounds.
          const yPx = topPadPx + level * rowStep;
          return (yPx / heightPx) * 100;
        })()
      : (() => {
          // Root starts from bottom safe zone, ancestors go upward within inner bounds.
          const rootY = heightPx - bottomPadPx;
          const yPx = rootY - level * rowStep;
          return (yPx / heightPx) * 100;
        })();
  return {
    x,
    y,
    scale: getScaleForLevel(),
  };
}

/** Last level index that has at least one person; levels above are hidden and tree is raised. */
function getVisibleLevelCount(matrix: (Person | null)[][]): number {
  for (let l = matrix.length - 1; l >= 0; l--) {
    if (matrix[l]!.some((p) => p !== null)) return l + 1;
  }
  return 1;
}

export function FamilyTree({
  onPersonClick,
  kinshipMode = false,
  kinshipSelectedIds = DEFAULT_KINSHIP_SELECTED_IDS,
  onKinshipSelect,
  kinshipHintById = DEFAULT_KINSHIP_HINT_BY_ID,
  treeMode = 'ancestors',
}: FamilyTreeProps) {
  const rootPersonId = useRootPersonId();

  const { matrix, parentKeyByChildKey } = useMemo(() => {
    if (treeMode === 'descendants') {
      return buildDescendantsMatrix(rootPersonId);
    }
    return { matrix: buildTreeMatrix(rootPersonId), parentKeyByChildKey: {} as Record<string, string> };
  }, [rootPersonId, treeMode]);

  const visibleLevelCount = useMemo(() => getVisibleLevelCount(matrix), [matrix]);
  const visibleNodeCount = useMemo(
    () => {
      let count = 0;
      for (let level = 0; level < visibleLevelCount; level += 1) {
        const row = matrix[level] ?? [];
        for (let i = 0; i < row.length; i += 1) {
          if (row[i]) count += 1;
        }
      }
      return count;
    },
    [matrix, visibleLevelCount]
  );
  const nodeXByKey = useMemo(
    () =>
      treeMode === 'ancestors'
        ? computeAncestorLayoutX(matrix, visibleLevelCount, TREE_LAYOUT.view.width)
        : computeDescendantLayoutX(matrix, parentKeyByChildKey, visibleLevelCount, TREE_LAYOUT.view.width),
    [matrix, parentKeyByChildKey, visibleLevelCount, treeMode]
  );
  const nodePositionByKey = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getNodePosition>>();
    for (let level = 0; level < visibleLevelCount; level += 1) {
      const row = matrix[level] ?? [];
      for (let index = 0; index < row.length; index += 1) {
        if (!row[index]) continue;
        map.set(
          `${level}-${index}`,
          getNodePosition(level, index, visibleLevelCount, treeMode, row.length, nodeXByKey)
        );
      }
    }
    return map;
  }, [matrix, nodeXByKey, treeMode, visibleLevelCount]);
  const kinshipSelectedIdSet = useMemo(
    () => new Set(kinshipSelectedIds),
    [kinshipSelectedIds]
  );
  const panVerticalLimits = useMemo(() => {
    const depth = Math.max(1, visibleLevelCount);
    const extraLevels = Math.max(0, depth - 4);
    return {
      limitYDown:
        TREE_LAYOUT.pan.limitYDownBase +
        extraLevels * TREE_LAYOUT.pan.extraLimitYDownPerLevel,
      limitYUp:
        TREE_LAYOUT.pan.limitYUpBase -
        extraLevels * TREE_LAYOUT.pan.extraLimitYUpPerLevel,
    };
  }, [visibleLevelCount]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const avatarRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const avatarRefCallbacksRef = useRef<Map<string, (el: HTMLDivElement | null) => void>>(new Map());
  const getAvatarRefForKey = useCallback((key: string) => {
    let cb = avatarRefCallbacksRef.current.get(key);
    if (!cb) {
      cb = (el: HTMLDivElement | null) => {
        if (!el) avatarRefs.current.delete(key);
        else avatarRefs.current.set(key, el);
      };
      avatarRefCallbacksRef.current.set(key, cb);
    }
    return cb;
  }, []);
  const { pan, panHandlers } = useTreePan({
    initialY: TREE_LAYOUT.pan.initialY,
    limitX: TREE_LAYOUT.pan.limitX,
    limitYDown: panVerticalLimits.limitYDown,
    limitYUp: panVerticalLimits.limitYUp,
    dragStartThresholdPx: TREE_LAYOUT.pan.dragStartThresholdPx,
    resetKey: `${rootPersonId}:${treeMode}`,
  });
  const segments = useTreeSegments({
    containerRef,
    avatarRefs,
    matrix,
    visibleLevelCount,
    kinshipMode,
    kinshipSelectedIds,
    treeMode,
    parentKeyByChildKey,
    layoutVersion: nodeXByKey,
  });

  return (
    <div
      className="flex h-full w-full min-h-0 justify-center overflow-hidden touch-none cursor-grab active:cursor-grabbing"
      {...panHandlers}
    >
      <div
        ref={containerRef}
        className="relative h-full w-full max-h-full max-w-full origin-top p-8 md:min-h-0 md:aspect-[120/98] md:p-9"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px)`,
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          {segments.map((seg) => (
            <div
              key={seg.key}
              style={{
                left: `${seg.left}px`,
                top: `${seg.top}px`,
                width: `${seg.width}px`,
                height: `${seg.height}px`,
                backgroundImage:
                  seg.edgeKey.startsWith('spouse-direct:')
                    ? 'repeating-linear-gradient(90deg, rgba(107,114,128,0.95) 0 5px, rgba(107,114,128,0) 5px 10px)'
                    : undefined,
                backgroundColor: seg.edgeKey.startsWith('spouse-direct:') ? 'transparent' : undefined,
                opacity: seg.edgeKey.startsWith('spouse-direct:') ? 1 : undefined,
                transform: seg.rotateDeg != null ? `rotate(${seg.rotateDeg}deg)` : undefined,
                transformOrigin: 'left center',
              }}
              className={`absolute ${
                seg.edgeKey.startsWith('spouse-direct:')
                  ? 'bg-transparent'
                  : seg.active
                    ? 'bg-gray-500/95 opacity-100'
                    : 'bg-gray-500/30 opacity-10'
              }`}
              aria-hidden
            />
          ))}
        </div>

        {matrix.slice(0, visibleLevelCount).map((row, level) =>
          row.map((person, index) => {
            if (!person) return null;
            const key = `${level}-${index}`;
            const pos = nodePositionByKey.get(key);
            if (!pos) return null;
            const isSingleDescendantRootView =
              treeMode === 'descendants' && visibleNodeCount === 1;

            return (
              <div
                key={`node-${key}`}
                className="absolute origin-top"
                style={{
                  left: isSingleDescendantRootView ? '50%' : `${pos.x}%`,
                  top: isSingleDescendantRootView ? '50%' : `${pos.y}%`,
                  transform: isSingleDescendantRootView ? 'translate(-50%, -50%)' : 'translate(-50%, 0)',
                  zIndex:
                    treeMode === 'descendants'
                      ? level + 1
                      : visibleLevelCount - 1 - level,
                }}
              >
                <TreeNode
                  person={person}
                  level={level}
                  index={index}
                  scale={pos.scale}
                  showSiblings={treeMode !== 'descendants'}
                  onPersonClick={kinshipMode && onKinshipSelect ? onKinshipSelect : onPersonClick}
                  onAvatarRef={getAvatarRefForKey(key)}
                  kinshipHint={
                    kinshipMode && person
                      ? kinshipHintById[person.id] ?? null
                      : null
                  }
                  isKinshipSelected={
                    kinshipMode && person ? kinshipSelectedIdSet.has(person.id) : false
                  }
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
