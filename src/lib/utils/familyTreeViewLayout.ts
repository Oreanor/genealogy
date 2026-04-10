import type { Person } from '@/lib/types/person';

/** Layout constants for the family tree canvas (percent-based positioning). */
export const FAMILY_TREE_VIEW_LAYOUT: {
  view: { width: number; height: number };
  node: { baseScale: number };
  pan: {
    limitX: number;
    limitYDownBase: number;
    limitYUpBase: number;
    initialY: number;
    dragStartThresholdPx: number;
    extraLimitYDownPerLevel: number;
    extraLimitYUpPerLevel: number;
  };
  spacing: {
    safeTopPct: number;
    safeBottomPctDescendants: number;
    safeBottomPctAncestors: number;
    generationStepMultDescendants: number;
    generationStepMultAncestors: number;
    minGenerationStepPxDescendants: number;
    minGenerationStepPxAncestors: number;
    horizontalSpreadMult: number;
  };
} = {
  view: {
    width: 120,
    height: 98,
  },
  node: {
    baseScale: 0.75,
  },
  pan: {
    limitX: 1100,
    limitYDownBase: 120,
    limitYUpBase: -210,
    initialY: 0,
    dragStartThresholdPx: 6,
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
};

function getScaleForLevel(): number {
  return FAMILY_TREE_VIEW_LAYOUT.node.baseScale;
}

export function getFamilyTreeNodePosition(
  level: number,
  index: number,
  visibleLevelCount: number,
  treeMode: 'ancestors' | 'descendants',
  rowCount: number,
  nodeXByKey: Map<string, number> | null
): { x: number; y: number; scale: number } {
  const L = FAMILY_TREE_VIEW_LAYOUT;
  const count = treeMode === 'descendants' ? Math.max(1, rowCount) : Math.pow(2, level);
  const xPx = nodeXByKey
    ? (nodeXByKey.get(`${level}-${index}`) ?? ((2 * index + 1) / (2 * count)) * L.view.width)
    : ((2 * index + 1) / (2 * count)) * L.view.width;
  const xRaw = (xPx / L.view.width) * 100;
  const x = 50 + (xRaw - 50) * L.spacing.horizontalSpreadMult;
  const heightPx = L.view.height;
  const topPadPx = (heightPx * L.spacing.safeTopPct) / 100;
  const bottomSafePct =
    treeMode === 'ancestors' ? L.spacing.safeBottomPctAncestors : L.spacing.safeBottomPctDescendants;
  const bottomPadPx = (heightPx * bottomSafePct) / 100;
  const usableHeightPx = Math.max(1, heightPx - topPadPx - bottomPadPx);
  const baseRowStep = usableHeightPx / Math.max(1, visibleLevelCount);
  const rowStepRaw =
    baseRowStep *
    (treeMode === 'descendants'
      ? L.spacing.generationStepMultDescendants
      : L.spacing.generationStepMultAncestors);
  const minRowStepPx =
    treeMode === 'descendants'
      ? L.spacing.minGenerationStepPxDescendants
      : L.spacing.minGenerationStepPxAncestors;
  const rowStep = Math.max(minRowStepPx, rowStepRaw);
  const y =
    treeMode === 'descendants'
      ? (() => {
          const yPx = topPadPx + level * rowStep;
          return (yPx / heightPx) * 100;
        })()
      : (() => {
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
