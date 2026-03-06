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
