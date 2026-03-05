'use client';

import { useEffect, useId } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';

const btnClass =
  'rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-sm text-[var(--ink)] hover:bg-[var(--paper-light)]';

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const colorPickerId = useId();
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, TextStyle, Color],
    content: value,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: {
        class:
          'h-full text-[var(--ink)] focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return <div className="min-h-[120px] animate-pulse rounded bg-[var(--surface)]" />;

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
            editor.chain().focus().setColor((document.getElementById(colorPickerId) as HTMLInputElement)?.value ?? '#000').run()
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
          className="h-8 w-8 cursor-pointer rounded border border-[var(--border)]"
        />
      </div>
      <div className="min-h-0 flex-1 rounded border border-(--border-subtle) bg-(--paper) px-2">
        <div className="h-full overflow-y-auto pt-2 pb-4 mb-4">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
