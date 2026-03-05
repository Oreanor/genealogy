import type { HistoryEntry } from './history';

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
