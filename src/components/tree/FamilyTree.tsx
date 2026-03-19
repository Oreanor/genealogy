'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRootPersonId } from '@/lib/contexts/RootPersonContext';
import { buildDescendantsMatrix, buildTreeMatrix } from '@/lib/utils/tree';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Person } from '@/lib/types/person';
import { TreeNode } from './TreeNode';
import { getKinship } from '@/lib/utils/kinship';

export interface FamilyTreeProps {
  onPersonClick: (personId: string) => void;
  kinshipMode?: boolean;
  kinshipSelectedIds?: string[];
  onKinshipSelect?: (personId: string) => void;
  kinshipHintById?: Record<string, string | null | undefined>;
  treeMode?: 'ancestors' | 'descendants';
}

const VIEW_WIDTH = 120;
const VIEW_HEIGHT = 98;
/** On mobile: flatter aspect so tree fits without vertical scroll */
const VIEW_HEIGHT_MOBILE = 80;
const TREE_TOP_OFFSET_ANCESTORS = 22;
const TREE_TOP_OFFSET_DESCENDANTS = -4;
const BASE_SCALE = 0.75;

/** On mobile: grandparents +40%, parents +60%, me +80% of base scale (each tier +20% vs previous) */
function getScaleForLevel(level: number, isMobile: boolean): number {
  if (!isMobile) return BASE_SCALE;
  const multiplier = level <= 2 ? 1.8 - 0.2 * level : 1; // level 0 → 1.8, 1 → 1.6, 2 → 1.4, 3+ → 1
  return BASE_SCALE * multiplier;
}

const OFFSET_PX_BY_LEVEL: number[] = [-10, 30, 20, -10, 0];
/** On mobile: shift root (0) up so it doesn't get cut when viewport height shrinks */
const MOBILE_ROOT_UP_PX = 28;
/** On mobile: shift parents (1) and grandparents (2) up by 40px */
const MOBILE_LEVEL_UP_PX = 40;
/** On mobile: shift grandparents (2) and all levels below up by extra 20px */
const MOBILE_DEDY_UP_PX = 20;

function getLevelOffsetPx(level: number, isMobile: boolean): number {
  const base = OFFSET_PX_BY_LEVEL[level] ?? level * 10;
  if (!isMobile) return base;
  if (level === 0) return base - MOBILE_ROOT_UP_PX;
  if (level === 1) return base - MOBILE_LEVEL_UP_PX;
  if (level >= 2) return (level === 2 ? base - MOBILE_LEVEL_UP_PX : base) - MOBILE_DEDY_UP_PX;
  return base;
}

function getNodePosition(
  level: number,
  index: number,
  visibleLevelCount: number,
  isMobile: boolean,
  treeMode: 'ancestors' | 'descendants',
  rowCount: number
) {
  const count = treeMode === 'descendants' ? Math.max(1, rowCount) : Math.pow(2, level);
  const x = ((2 * index + 1) / (2 * count)) * VIEW_WIDTH;
  const rowHeight = VIEW_HEIGHT / (visibleLevelCount + 0.35);
  const y =
    treeMode === 'descendants'
      ? (level + 0.7) * rowHeight + TREE_TOP_OFFSET_DESCENDANTS
      : VIEW_HEIGHT - (level + 0.7) * rowHeight - TREE_TOP_OFFSET_ANCESTORS;
  return {
    x: (x / VIEW_WIDTH) * 100,
    y: (y / VIEW_HEIGHT) * 100,
    scale: getScaleForLevel(level, isMobile),
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
  kinshipSelectedIds = [],
  onKinshipSelect,
  kinshipHintById = {},
  treeMode = 'ancestors',
}: FamilyTreeProps) {
  const rootPersonId = useRootPersonId();
  const isMobile = useIsMobile();

  const { matrix, parentKeyByChildKey } = useMemo(() => {
    if (treeMode === 'descendants') {
      return buildDescendantsMatrix(rootPersonId);
    }
    return { matrix: buildTreeMatrix(rootPersonId), parentKeyByChildKey: {} as Record<string, string> };
  }, [rootPersonId, treeMode]);

  const visibleLevelCount = useMemo(() => getVisibleLevelCount(matrix), [matrix]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const avatarRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [segments, setSegments] = useState<
    Array<{
      key: string;
      edgeKey: string;
      left: number;
      top: number;
      width: number;
      height: number;
      active: boolean;
      rotateDeg?: number;
    }>
  >([]);

  useLayoutEffect(() => {
    const recompute = () => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const roundSnap = (n: number) => Math.round(n * 2) / 2;
    const getCenter = (el: HTMLDivElement) => {
      const r = el.getBoundingClientRect();
      return {
        x: roundSnap(r.left - containerRect.left + r.width / 2),
        y: roundSnap(r.top - containerRect.top + r.height / 2),
      };
    };

    const currentCenters = new Map<string, { x: number; y: number }>();
    for (const [key, el] of avatarRefs.current.entries()) {
      if (!el) continue;
      currentCenters.set(key, getCenter(el));
    }

    const nextSegments: Array<{
      key: string;
      edgeKey: string;
      left: number;
      top: number;
      width: number;
      height: number;
      active: boolean;
      rotateDeg?: number;
    }> = [];
    const segKeys = new Set<string>();

    const thickness = 1.5;

    const activeEdgeKeys = new Set<string>();
    let spouseDirectOnly = false;
    const spouseEdgePairs: Array<{ pairKey: string; aKey: string; bKey: string }> = [];
    const spouseEdgePairSet = new Set<string>();

    const getParentKeyForChildKey = (childKey: string): string | null => {
      if (treeMode === 'descendants') return parentKeyByChildKey[childKey] ?? null;
      const [levelStr, indexStr] = childKey.split('-');
      const level = parseInt(levelStr, 10);
      const index = parseInt(indexStr, 10);
      if (!Number.isFinite(level) || !Number.isFinite(index) || level <= 0) return null;
      return `${level - 1}-${index >> 1}`;
    };

    if (kinshipMode && kinshipSelectedIds.length === 2) {
      const [a, b] = kinshipSelectedIds;
      const res = getKinship(a, b);
      if (res) {
        spouseDirectOnly = res.edgeKinds.length === 1 && res.edgeKinds[0] === 'spouse';
        const idToKey = new Map<string, string>();
        matrix.slice(0, visibleLevelCount).forEach((row, level) => {
          row.forEach((p, index) => {
            if (p) idToKey.set(p.id, `${level}-${index}`);
          });
        });

        for (let i = 0; i < res.path.length - 1; i += 1) {
          const kind = res.edgeKinds[i]!;
          if (kind !== 'parent' && kind !== 'child') continue;
          const u = res.path[i]!;
          const v = res.path[i + 1]!;
          const uKey = idToKey.get(u);
          const vKey = idToKey.get(v);
          if (!uKey || !vKey) continue;

          const vParentKey = getParentKeyForChildKey(vKey);
          if (vParentKey === uKey) {
            activeEdgeKeys.add(`${uKey}->${vKey}`);
            continue;
          }
          const uParentKey = getParentKeyForChildKey(uKey);
          if (uParentKey === vKey) {
            activeEdgeKeys.add(`${vKey}->${uKey}`);
          }
        }
      }
    }
    // Add spouse edges from the kinship path as direct segments.
    // We also treat "spouse-only" connections specially: fade all blood lines and show only spouse line(s).
    if (kinshipMode && kinshipSelectedIds.length === 2) {
      const [a, b] = kinshipSelectedIds;
      const res = getKinship(a, b);
      if (res) {
        const idToKey = new Map<string, string>();
        matrix.slice(0, visibleLevelCount).forEach((row, level) => {
          row.forEach((p, index) => {
            if (p) idToKey.set(p.id, `${level}-${index}`);
          });
        });

        for (let i = 0; i < res.path.length - 1; i += 1) {
          const kind = res.edgeKinds[i]!;
          if (kind !== 'spouse') continue;
          const u = res.path[i]!;
          const v = res.path[i + 1]!;
          const uKey = idToKey.get(u);
          const vKey = idToKey.get(v);
          if (!uKey || !vKey) continue;
          const aKey = uKey < vKey ? uKey : vKey;
          const bKey = uKey < vKey ? vKey : uKey;
          const pairKey = `${aKey}<->${bKey}`;
          if (spouseEdgePairSet.has(pairKey)) continue;
          spouseEdgePairSet.add(pairKey);
          spouseEdgePairs.push({ pairKey, aKey, bKey });
        }
      }
    }

    const shouldFade =
      kinshipMode &&
      kinshipSelectedIds.length === 2 &&
      (spouseDirectOnly || activeEdgeKeys.size > 0 || spouseEdgePairs.length > 0);
    const addV = (x: number, y1: number, y2: number, key: string) => {
      const top = Math.min(y1, y2);
      const height = Math.max(0, Math.abs(y2 - y1));
      const left = x - thickness / 2;
      const segKey = `${key}:v:${left}:${top}:${height}`;
      if (segKeys.has(segKey)) return;
      segKeys.add(segKey);
      nextSegments.push({
        key: segKey,
        edgeKey: key,
        left,
        top,
        width: thickness,
        height,
        active: spouseDirectOnly ? false : shouldFade ? activeEdgeKeys.has(key) : true,
      });
    };
    const addH = (y: number, x1: number, x2: number, key: string) => {
      const left = Math.min(x1, x2);
      const width = Math.max(0, Math.abs(x2 - x1));
      const top = y - thickness / 2;
      const segKey = `${key}:h:${left}:${top}:${width}`;
      if (segKeys.has(segKey)) return;
      segKeys.add(segKey);
      nextSegments.push({
        key: segKey,
        edgeKey: key,
        left,
        top,
        width,
        height: thickness,
        active: spouseDirectOnly ? false : shouldFade ? activeEdgeKeys.has(key) : true,
      });
    };

    for (let level = 1; level < Math.min(matrix.length, visibleLevelCount); level += 1) {
      const row = matrix[level];
      for (let index = 0; index < row.length; index += 1) {
        const child = row[index];
        if (!child) continue;

        const childKey = `${level}-${index}`;
        const parentKey = getParentKeyForChildKey(childKey);
        if (!parentKey) continue;

        const parentCenter = currentCenters.get(parentKey);
        const childCenter = currentCenters.get(childKey);
        if (!parentCenter || !childCenter) continue;

        const xParent = parentCenter.x;
        const yParent = parentCenter.y;
        const xChild = childCenter.x;
        const yChild = childCenter.y;

        addV(xParent, yParent, yChild, `${parentKey}->${childKey}`);
        addH(yChild, xParent, xChild, `${parentKey}->${childKey}`);
      }
    }

    for (const { pairKey, aKey, bKey } of spouseEdgePairs) {
      const aCenter = currentCenters.get(aKey);
      const bCenter = currentCenters.get(bKey);
      if (!aCenter || !bCenter) continue;

      const dx = bCenter.x - aCenter.x;
      const dy = bCenter.y - aCenter.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const rotateDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

      // Draw direct "spouse" connection segments for the kinship path.
      nextSegments.push({
        key: `spouse-direct:${pairKey}`,
        edgeKey: `spouse-direct:${pairKey}`,
        left: aCenter.x,
        top: aCenter.y - thickness / 2,
        width: dist,
        height: thickness,
        active: true,
        rotateDeg,
      });
    }

    setSegments(nextSegments);
    };

    recompute();
    window.addEventListener('resize', recompute);
    return () => window.removeEventListener('resize', recompute);
  }, [matrix, visibleLevelCount, isMobile, kinshipMode, kinshipSelectedIds, treeMode, parentKeyByChildKey]);

  return (
    <div className="flex min-h-0 flex-1 justify-center overflow-hidden md:overflow-visible">
      <div
        ref={containerRef}
        className="relative w-full max-h-full max-w-full origin-top md:min-h-0"
        style={{ aspectRatio: `${VIEW_WIDTH} / ${isMobile ? VIEW_HEIGHT_MOBILE : VIEW_HEIGHT}` }}
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
            const pos = getNodePosition(
              level,
              index,
              visibleLevelCount,
              isMobile,
              treeMode,
              row.length
            );
            const offsetPx =
              treeMode === 'descendants' ? -getLevelOffsetPx(level, isMobile) : getLevelOffsetPx(level, isMobile);
            const key = `${level}-${index}`;

            return (
              <div
                key={`node-${key}`}
                className="absolute origin-top"
                style={{
                  left: `${pos.x}%`,
                  top: `calc(${pos.y}% + ${offsetPx}px)`,
                  transform: 'translate(-50%, 0)',
                  zIndex: visibleLevelCount - 1 - level,
                }}
              >
                <TreeNode
                  person={person}
                  level={level}
                  index={index}
                  scale={pos.scale}
                  onPersonClick={kinshipMode && onKinshipSelect ? onKinshipSelect : onPersonClick}
                  onAvatarRef={
                    person
                      ? (el) => {
                          if (!el) avatarRefs.current.delete(key);
                          else avatarRefs.current.set(key, el);
                        }
                      : undefined
                  }
                  kinshipHint={
                    kinshipMode && person
                      ? kinshipHintById[person.id] ?? null
                      : null
                  }
                  isKinshipSelected={
                    kinshipMode && person ? kinshipSelectedIds.includes(person.id) : false
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
