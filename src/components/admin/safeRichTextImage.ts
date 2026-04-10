import Image from '@tiptap/extension-image';
import { isSafeRichTextHref } from '@/lib/utils/string';

/**
 * TipTap image node: only allows safe `src` (same rules as rich-text links: /… or http(s)).
 */
export const SafeRichTextImage = Image.extend({
  name: 'image',

  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
        parseHTML: (element) => {
          if (!(element instanceof HTMLElement)) return null;
          const raw = element.getAttribute('src');
          if (!raw || !isSafeRichTextHref(raw)) return null;
          return raw;
        },
      },
    };
  },
});
