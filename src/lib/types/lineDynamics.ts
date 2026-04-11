/** Одна декада оценки числа активных линий (семей) */
export interface LineDynamicsRow {
  decade: string;
  low: number;
  mid: number;
  high: number;
  cluster_uman: number;
  cluster_sumy: number;
}

/** Оценка числа семей по декадам; визуализация позже */
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
