import type { HistoryEntry } from './history';
import type { ContentBlock } from './content';

export type { ContentBlock, RichTextNode } from './content';

export interface Spread {
  spreadIndex: number;
  left: PageContent;
  right: PageContent;
}

export interface ImageConfig {
  src: string;
  alt?: string;
  hotspots?: Array<{
    personId: string;
    coords: number[];
    shape: 'point' | 'circle' | 'rect' | 'polygon';
  }>;
}

export interface PageContent {
  blocks?: ContentBlock[];
  image?: ImageConfig;
  tree?: boolean;
  /** Person ID for the person-card spread (Persons section) */
  personId?: string;
  /** History section entries (title + rich text + persons + images) */
  historyEntries?: HistoryEntry[];
}
