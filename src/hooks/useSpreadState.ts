'use client';

import { useSearchParams } from 'next/navigation';

interface UseSpreadStateResult {
  spreadIndex: number;
  safeIndex: number;
  hasPrev: boolean;
  hasNext: boolean;
  totalSpreads: number;
}

export function useSpreadState(totalSpreads: number): UseSpreadStateResult {
  const searchParams = useSearchParams();
  const spreadParam = searchParams.get('spread');
  const currentIndex = spreadParam ? Math.max(0, parseInt(spreadParam, 10)) : 0;
  const safeIndex = Math.min(currentIndex, totalSpreads - 1);

  return {
    spreadIndex: currentIndex,
    safeIndex,
    hasPrev: safeIndex > 0,
    hasNext: safeIndex < totalSpreads - 1,
    totalSpreads,
  };
}
