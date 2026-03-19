'use client';

import { useLayoutEffect, useMemo, useRef, useState, useEffect, type PointerEvent as ReactPointerEvent } from 'react';
import { useRootPersonId } from '@/lib/contexts/RootPersonContext';
import {
  buildDescendantsMatrix,
  buildTreeMatrix,
  computeAncestorLayoutX,
  computeDescendantLayoutX,
} from '@/lib/utils/tree';
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

/** Stable defaults — avoid new [] / {} each render (useLayoutEffect deps). */
const DEFAULT_KINSHIP_SELECTED_IDS: string[] = [];
const DEFAULT_KINSHIP_HINT_BY_ID: Record<string, string | null | undefined> = {};

const VIEW_WIDTH = 120;
const VIEW_HEIGHT = 98;
const BASE_SCALE = 0.75;
const PAN_LIMIT_X_PX = 1100;
const PAN_LIMIT_Y_DOWN_PX = 120;
const PAN_LIMIT_Y_UP_PX = -210;
const PAN_INITIAL_Y_PX = 0;
const SAFE_TOP_PCT = 12;
const SAFE_BOTTOM_PCT = 12;
const SAFE_BOTTOM_PCT_ANCESTORS = 40;
const GENERATION_STEP_MULT_DESCENDANTS = 1.35;
const GENERATION_STEP_MULT_ANCESTORS = 1.25;
const MIN_GENERATION_STEP_PX_DESCENDANTS = 28;
const MIN_GENERATION_STEP_PX_ANCESTORS = 24;
const HORIZONTAL_SPREAD_MULT = 1.35;
const DRAG_START_THRESHOLD_PX = 6;

function getScaleForLevel(): number {
  return BASE_SCALE;
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
          ((2 * index + 1) / (2 * count)) * VIEW_WIDTH)
      : ((2 * index + 1) / (2 * count)) * VIEW_WIDTH;
  const xRaw = (xPx / VIEW_WIDTH) * 100;
  const x = 50 + (xRaw - 50) * HORIZONTAL_SPREAD_MULT;
  const heightPx = VIEW_HEIGHT;
  const topPadPx = (heightPx * SAFE_TOP_PCT) / 100;
  const bottomSafePct = treeMode === 'ancestors' ? SAFE_BOTTOM_PCT_ANCESTORS : SAFE_BOTTOM_PCT;
  const bottomPadPx = (heightPx * bottomSafePct) / 100;
  const usableHeightPx = Math.max(1, heightPx - topPadPx - bottomPadPx);
  const baseRowStep = usableHeightPx / Math.max(1, visibleLevelCount);
  const rowStepRaw =
    baseRowStep *
    (treeMode === 'descendants'
      ? GENERATION_STEP_MULT_DESCENDANTS
      : GENERATION_STEP_MULT_ANCESTORS);
  const minRowStepPx =
    treeMode === 'descendants'
      ? MIN_GENERATION_STEP_PX_DESCENDANTS
      : MIN_GENERATION_STEP_PX_ANCESTORS;
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
    () => matrix.slice(0, visibleLevelCount).reduce((sum, row) => sum + row.filter(Boolean).length, 0),
    [matrix, visibleLevelCount]
  );
  const nodeXByKey = useMemo(
    () =>
      treeMode === 'ancestors'
        ? computeAncestorLayoutX(matrix, visibleLevelCount, VIEW_WIDTH)
        : computeDescendantLayoutX(matrix, parentKeyByChildKey, visibleLevelCount, VIEW_WIDTH),
    [matrix, parentKeyByChildKey, visibleLevelCount, treeMode]
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const avatarRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [pan, setPan] = useState({ x: 0, y: PAN_INITIAL_Y_PX });
  const dragRef = useRef<{
    active: boolean;
    moved: boolean;
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const suppressNextClickRef = useRef(false);
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

  useEffect(() => {
    setPan({ x: 0, y: PAN_INITIAL_Y_PX });
  }, [rootPersonId, treeMode]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = {
      active: true,
      moved: false,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: pan.x,
      originY: pan.y,
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const st = dragRef.current;
    if (!st || !st.active || st.pointerId !== e.pointerId) return;
    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;
    if (!st.moved && Math.hypot(dx, dy) < DRAG_START_THRESHOLD_PX) return;
    if (!st.moved) {
      st.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const nextX = Math.max(-PAN_LIMIT_X_PX, Math.min(PAN_LIMIT_X_PX, st.originX + dx));
    const nextY = Math.max(PAN_LIMIT_Y_UP_PX, Math.min(PAN_LIMIT_Y_DOWN_PX, st.originY + dy));
    setPan({ x: nextX, y: nextY });
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const st = dragRef.current;
    if (!st || st.pointerId !== e.pointerId) return;
    if (st.moved) suppressNextClickRef.current = true;
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };
  const onClickCapture = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!suppressNextClickRef.current) return;
    suppressNextClickRef.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  useLayoutEffect(() => {
    const recompute = () => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const roundSnap = (n: number) => Math.round(n * 2) / 2;
    const getAnchor = (el: HTMLDivElement) => {
      const r = el.getBoundingClientRect();
      return {
        x: roundSnap(r.left - containerRect.left + r.width / 2),
        y: roundSnap(r.top - containerRect.top + r.height / 2),
        top: roundSnap(r.top - containerRect.top),
        bottom: roundSnap(r.bottom - containerRect.top),
      };
    };

    const currentCenters = new Map<string, { x: number; y: number; top: number; bottom: number }>();
    for (const [key, el] of avatarRefs.current.entries()) {
      if (!el) continue;
      currentCenters.set(key, getAnchor(el));
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
    const MIN_SEGMENT_PX = 6;
    const addV = (x: number, y1: number, y2: number, key: string, forceActive = false) => {
      const top = Math.min(y1, y2);
      const height = Math.max(0, Math.abs(y2 - y1));
      if (height < MIN_SEGMENT_PX) return;
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
        active: spouseDirectOnly ? false : shouldFade ? forceActive || activeEdgeKeys.has(key) : true,
      });
    };
    const addH = (y: number, x1: number, x2: number, key: string, forceActive = false) => {
      const left = Math.min(x1, x2);
      const width = Math.max(0, Math.abs(x2 - x1));
      if (width < MIN_SEGMENT_PX) return;
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
        active: spouseDirectOnly ? false : shouldFade ? forceActive || activeEdgeKeys.has(key) : true,
      });
    };

    for (let level = 1; level < Math.min(matrix.length, visibleLevelCount); level += 1) {
      const row = matrix[level];
      if (treeMode === 'descendants') {
        const childrenByParent = new Map<string, Array<{ key: string; x: number; y: number }>>();
        for (let index = 0; index < row.length; index += 1) {
          const child = row[index];
          if (!child) continue;
          const childKey = `${level}-${index}`;
          const parentKey = getParentKeyForChildKey(childKey);
          if (!parentKey) continue;
          const childCenter = currentCenters.get(childKey);
          if (!childCenter) continue;
          const list = childrenByParent.get(parentKey) ?? [];
          list.push({ key: childKey, x: childCenter.x, y: childCenter.y });
          childrenByParent.set(parentKey, list);
        }

        for (const [parentKey, children] of childrenByParent.entries()) {
          const parentCenter = currentCenters.get(parentKey);
          if (!parentCenter || children.length === 0) continue;
          const xParent = parentCenter.x;
          const yParentBottom = parentCenter.bottom;

          if (children.length === 1) {
            const c = children[0]!;
            addV(xParent, yParentBottom, c.y, `${parentKey}->${c.key}`);
            continue;
          }

          const minChildY = Math.min(...children.map((c) => c.y));
          const joinY = yParentBottom + Math.max(8, (minChildY - yParentBottom) * 0.42);
          const fanHasActiveChild = children.some((c) => activeEdgeKeys.has(`${parentKey}->${c.key}`));
          addV(xParent, yParentBottom, joinY, `${parentKey}->fan`, fanHasActiveChild);
          for (const c of children) {
            addH(joinY, xParent, c.x, `${parentKey}->${c.key}`);
            addV(c.x, joinY, c.y, `${parentKey}->${c.key}`);
          }
        }
        continue;
      }

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
        const yParent = parentCenter.bottom;
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
  }, [
    matrix,
    visibleLevelCount,
    kinshipMode,
    kinshipSelectedIds,
    treeMode,
    parentKeyByChildKey,
    nodeXByKey,
  ]);

  return (
    <div
      className="flex h-full w-full min-h-0 justify-center overflow-hidden touch-none cursor-grab active:cursor-grabbing"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={onClickCapture}
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
            const pos = getNodePosition(
              level,
              index,
              visibleLevelCount,
              treeMode,
              row.length,
              nodeXByKey
            );
            const key = `${level}-${index}`;
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
                  onPersonClick={kinshipMode && onKinshipSelect ? onKinshipSelect : onPersonClick}
                  onAvatarRef={
                    (el) => {
                      if (!el) avatarRefs.current.delete(key);
                      else avatarRefs.current.set(key, el);
                    }
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
