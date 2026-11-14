/** Estimated number of active family lines in one decade */
export interface LineDynamicsRow {
  decade: string;
  low: number;
  mid: number;
  high: number;
  cluster_uman: number;
  cluster_sumy: number;
}

/** Estimated family lines per decade (visualization planned) */
export interface LineDynamicsDataset {
  title: string;
  description: string;
  data: LineDynamicsRow[];
}

export const EMPTY_LINE_DYNAMICS: LineDynamicsDataset = {
  title: '',
  description: '',
  data: [],
};
