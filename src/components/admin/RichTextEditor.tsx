'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { ImageIcon } from 'lucide-react';
import { useTranslations } from '@/lib/i18n/context';
import type { PhotoEntry } from '@/lib/types/photo';
import { RichTextPhotoPickerDialog } from './RichTextPhotoPickerDialog';
import { SafeRichTextImage } from './safeRichTextImage';

const btnClass =
  'rounded border border-(--border) bg-(--book-bg) px-2 py-1 text-sm text-(--ink) hover:bg-(--paper-light)';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** When set, toolbar shows “insert image” and a gallery grouped by category. */
  photos?: PhotoEntry[];
}

export function RichTextEditor({ value, onChange, photos }: RichTextEditorProps) {
  const t = useTranslations();
  const colorPickerId = useId();
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);

  const extensions = useMemo(
    () => [StarterKit, TextStyle, Color, SafeRichTextImage.configure({ allowBase64: false })],
    []
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: value,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: {
        class: 'h-full min-h-[80px] text-(--ink) focus:outline-none prose prose-sm max-w-none [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:my-3',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return <div className="min-h-[120px] animate-pulse rounded bg-(--book-bg)" />;

  const gallery = photos ?? [];
  const canInsertImage = gallery.length > 0;

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex shrink-0 flex-wrap gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass}
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass}
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btnClass}
          title="Heading"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .setColor((document.getElementById(colorPickerId) as HTMLInputElement)?.value ?? '#000')
              .run()
          }
          className={btnClass}
          title="Color"
        >
          A
        </button>
        <input
          id={colorPickerId}
          type="color"
          defaultValue="#000000"
          className="h-8 w-8 cursor-pointer rounded border border-(--border)"
        />
        {canInsertImage && (
          <button
            type="button"
            onClick={() => setPhotoPickerOpen(true)}
            className={`${btnClass} inline-flex items-center gap-1 px-2`}
            title={t('adminRichTextInsertImage')}
          >
            <ImageIcon className="size-4 shrink-0" aria-hidden />
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 rounded border border-(--border-subtle) bg-(--paper) px-2">
        <div className="mb-4 h-full overflow-y-auto pt-2 pb-4">
          <EditorContent editor={editor} />
        </div>
      </div>

      {canInsertImage && (
        <RichTextPhotoPickerDialog
          open={photoPickerOpen}
          onClose={() => setPhotoPickerOpen(false)}
          photos={gallery}
          onPick={(src) => {
            editor.chain().focus().setImage({ src }).run();
          }}
          t={t}
        />
      )}
    </div>
  );
}
