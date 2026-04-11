import type { LineDynamicsDataset } from '@/lib/types/lineDynamics';
import { EMPTY_LINE_DYNAMICS } from '@/lib/types/lineDynamics';
import appData from '@/data/data.json';

type AppDataShape = {
  lineDynamics?: LineDynamicsDataset;
  nikonetsLineDynamics?: LineDynamicsDataset;
};

const raw = appData as AppDataShape;
const dataset: LineDynamicsDataset =
  raw.lineDynamics ?? raw.nikonetsLineDynamics ?? EMPTY_LINE_DYNAMICS;

export function getLineDynamics(): LineDynamicsDataset {
  return dataset;
}
