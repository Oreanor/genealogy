import type { ChapterId } from '@/lib/constants/chapters';
import type { HistoryEntry } from './history';

export interface Page {
  id: string;
  chapter: ChapterId;
  spreadIndex: number;
  left: PageContent;
  right: PageContent;
}

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
  /** ID персоны — для разворота с карточкой персоны (глава «Персоны») */
  personId?: string;
  /** Элементы раздела «Истории» (название + ричтекст + персоны + картинки) */
  historyEntries?: HistoryEntry[];
}

export type ContentBlock =
  | { type: 'paragraph'; content: RichTextNode[] }
  | { type: 'heading'; content: RichTextNode[] }
  | { type: 'list'; content: RichTextNode[] }
  | { type: 'html'; html: string };

export type RichTextNode =
  | { type: 'text'; value: string }
  | { type: 'bold'; children: RichTextNode[] }
  | { type: 'italic'; children: RichTextNode[] }
  | { type: 'link'; href: string; children: RichTextNode[] };
