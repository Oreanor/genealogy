'use client';

import { useLayoutEffect, useState } from 'react';
import { getKinship } from '@/lib/utils/kinship';
import type { Person } from '@/lib/types/person';

type NodeAnchor = { x: number; y: number; top: number; bottom: number };
export type TreeSegment = {
  key: string;
  edgeKey: string;
  left: number;
  top: number;
  width: number;
  height: number;
  active: boolean;
  rotateDeg?: number;
};

type Params = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  avatarRefs: React.RefObject<Map<string, HTMLDivElement>>;
  matrix: (Person | null)[][];
  visibleLevelCount: number;
  kinshipMode: boolean;
  kinshipSelectedIds: string[];
  treeMode: 'ancestors' | 'descendants';
  parentKeyByChildKey: Record<string, string>;
  layoutVersion: unknown;
};

export function useTreeSegments({
  containerRef,
  avatarRefs,
  matrix,
  visibleLevelCount,
  kinshipMode,
  kinshipSelectedIds,
  treeMode,
  parentKeyByChildKey,
  layoutVersion,
}: Params) {
  const [segments, setSegments] = useState<TreeSegment[]>([]);

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

      const currentCenters = new Map<string, NodeAnchor>();
      for (const [key, el] of avatarRefs.current.entries()) {
        if (!el) continue;
        currentCenters.set(key, getAnchor(el));
      }

      const nextSegments: TreeSegment[] = [];
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
            row.forEach((person, index) => {
              if (person) idToKey.set(person.id, `${level}-${index}`);
            });
          });
          for (let i = 0; i < res.path.length - 1; i += 1) {
            const kind = res.edgeKinds[i]!;
            const u = res.path[i]!;
            const v = res.path[i + 1]!;
            const uKey = idToKey.get(u);
            const vKey = idToKey.get(v);
            if (!uKey || !vKey) continue;
            if (kind === 'parent' || kind === 'child') {
              const vParentKey = getParentKeyForChildKey(vKey);
              if (vParentKey === uKey) {
                activeEdgeKeys.add(`${uKey}->${vKey}`);
                continue;
              }
              const uParentKey = getParentKeyForChildKey(uKey);
              if (uParentKey === vKey) activeEdgeKeys.add(`${vKey}->${uKey}`);
              continue;
            }
            if (kind === 'spouse') {
              const aKey = uKey < vKey ? uKey : vKey;
              const bKey = uKey < vKey ? vKey : uKey;
              const pairKey = `${aKey}<->${bKey}`;
              if (spouseEdgePairSet.has(pairKey)) continue;
              spouseEdgePairSet.add(pairKey);
              spouseEdgePairs.push({ pairKey, aKey, bKey });
            }
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
              const child = children[0]!;
              addV(xParent, yParentBottom, child.y, `${parentKey}->${child.key}`);
              continue;
            }

            const minChildY = Math.min(...children.map((child) => child.y));
            const joinY = yParentBottom + Math.max(8, (minChildY - yParentBottom) * 0.42);
            const fanHasActiveChild = children.some((child) =>
              activeEdgeKeys.has(`${parentKey}->${child.key}`)
            );
            addV(xParent, yParentBottom, joinY, `${parentKey}->fan`, fanHasActiveChild);
            for (const child of children) {
              addH(joinY, xParent, child.x, `${parentKey}->${child.key}`);
              addV(child.x, joinY, child.y, `${parentKey}->${child.key}`);
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

          addV(parentCenter.x, parentCenter.bottom, childCenter.y, `${parentKey}->${childKey}`);
          addH(childCenter.y, parentCenter.x, childCenter.x, `${parentKey}->${childKey}`);
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
    avatarRefs,
    containerRef,
    kinshipMode,
    kinshipSelectedIds,
    layoutVersion,
    matrix,
    parentKeyByChildKey,
    treeMode,
    visibleLevelCount,
  ]);

  return segments;
}
