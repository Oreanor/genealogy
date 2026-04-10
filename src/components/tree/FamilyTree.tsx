'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useRootPersonId } from '@/lib/contexts/RootPersonContext';
import {
  buildDescendantsMatrix,
  buildTreeMatrix,
  computeAncestorLayoutX,
  computeDescendantLayoutX,
  countVisibleTreeMatrixLevels,
} from '@/lib/utils/tree';
import {
  FAMILY_TREE_VIEW_LAYOUT,
  getFamilyTreeNodePosition,
} from '@/lib/utils/familyTreeViewLayout';
import type { Person } from '@/lib/types/person';
import { TreeNode } from './TreeNode';
import { useTreePan } from './useTreePan';
import { useTreeSegments } from './useTreeSegments';

interface FamilyTreeProps {
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

  const visibleLevelCount = useMemo(() => countVisibleTreeMatrixLevels(matrix), [matrix]);
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
        ? computeAncestorLayoutX(matrix, visibleLevelCount, FAMILY_TREE_VIEW_LAYOUT.view.width)
        : computeDescendantLayoutX(
            matrix,
            parentKeyByChildKey,
            visibleLevelCount,
            FAMILY_TREE_VIEW_LAYOUT.view.width
          ),
    [matrix, parentKeyByChildKey, visibleLevelCount, treeMode]
  );
  const nodePositionByKey = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getFamilyTreeNodePosition>>();
    for (let level = 0; level < visibleLevelCount; level += 1) {
      const row = matrix[level] ?? [];
      for (let index = 0; index < row.length; index += 1) {
        if (!row[index]) continue;
        map.set(
          `${level}-${index}`,
          getFamilyTreeNodePosition(
            level,
            index,
            visibleLevelCount,
            treeMode,
            row.length,
            nodeXByKey
          )
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
        FAMILY_TREE_VIEW_LAYOUT.pan.limitYDownBase +
        extraLevels * FAMILY_TREE_VIEW_LAYOUT.pan.extraLimitYDownPerLevel,
      limitYUp:
        FAMILY_TREE_VIEW_LAYOUT.pan.limitYUpBase -
        extraLevels * FAMILY_TREE_VIEW_LAYOUT.pan.extraLimitYUpPerLevel,
    };
  }, [visibleLevelCount]);
  const zoomRootRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const avatarRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const avatarRefCallbacksRef = useRef<Map<string, (el: HTMLDivElement | null) => void>>(new Map());
  const [avatarLayoutGeneration, setAvatarLayoutGeneration] = useState(0);
  const getAvatarRefForKey = useCallback((key: string) => {
    let cb = avatarRefCallbacksRef.current.get(key);
    if (!cb) {
      cb = (el: HTMLDivElement | null) => {
        if (!el) avatarRefs.current.delete(key);
        else avatarRefs.current.set(key, el);
        setAvatarLayoutGeneration((n) => n + 1);
      };
      avatarRefCallbacksRef.current.set(key, cb);
    }
    return cb;
  }, []);
  const { pan, scale, panHandlers } = useTreePan({
    initialY: FAMILY_TREE_VIEW_LAYOUT.pan.initialY,
    limitX: FAMILY_TREE_VIEW_LAYOUT.pan.limitX,
    limitYDown: panVerticalLimits.limitYDown,
    limitYUp: panVerticalLimits.limitYUp,
    dragStartThresholdPx: FAMILY_TREE_VIEW_LAYOUT.pan.dragStartThresholdPx,
    resetKey: `${rootPersonId}:${treeMode}`,
    zoomRootRef,
    transformTargetRef: containerRef,
  });
  const segments = useTreeSegments({
    containerRef,
    avatarRefs,
    avatarLayoutGeneration,
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
      ref={zoomRootRef}
      className="relative flex h-full w-full min-h-0 cursor-grab touch-none justify-center overflow-hidden active:cursor-grabbing"
      {...panHandlers}
    >
      <div
        ref={containerRef}
        className="relative h-full w-full max-h-full max-w-full origin-top p-8 md:min-h-0 md:aspect-[120/98] md:p-9"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: '0 0',
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
