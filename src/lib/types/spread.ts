import type { ChapterId } from '@/lib/constants/chapters';

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
    shape: 'rect' | 'polygon';
  }>;
}

export interface PageContent {
  blocks?: ContentBlock[];
  image?: ImageConfig;
  tree?: boolean;
  /** ID персоны — для разворота с карточкой персоны (глава «Персоны») */
  personId?: string;
}

export interface ContentBlock {
  type: 'paragraph' | 'heading' | 'list';
  content: RichTextNode[];
}

export type RichTextNode =
  | { type: 'text'; value: string }
  | { type: 'bold'; children: RichTextNode[] }
  | { type: 'italic'; children: RichTextNode[] }
  | { type: 'link'; href: string; children: RichTextNode[] };
