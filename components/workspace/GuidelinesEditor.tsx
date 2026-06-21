"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered, Heading2 } from "lucide-react";

interface Props {
  /** TipTap JSON document (or null/empty for a blank editor). */
  value: unknown;
  onChange: (doc: unknown) => void;
}

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

export default function GuidelinesEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value && typeof value === "object" ? (value as object) : EMPTY_DOC,
    // Next.js SSR: don't render on the server to avoid hydration mismatches.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[160px] px-4 py-3",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  });

  if (!editor) {
    return (
      <div className="rounded-2xl border border-gray-300 dark:border-gray-700 min-h-[200px]" />
    );
  }

  const btn = (active: boolean) =>
    `p-2 rounded-lg transition-colors ${
      active
        ? "bg-primary/20 text-primary"
        : "hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-500"
    }`;

  return (
    <div className="rounded-2xl border border-gray-300 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#151515]">
        {/* onMouseDown preventDefault stops the button from stealing focus/collapsing the
            editor's selection before onClick runs — without it, toggling a mark with no text
            selected only "sticks" for as long as the mouse stays pressed. */}
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive("bold"))} title="Bold">
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive("italic"))} title="Italic">
          <Italic className="w-4 h-4" />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive("heading", { level: 2 }))} title="Heading">
          <Heading2 className="w-4 h-4" />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive("bulletList"))} title="Bullet list">
          <List className="w-4 h-4" />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive("orderedList"))} title="Numbered list">
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
