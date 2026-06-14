"use client";

/** Rich-text editor for blog articles (TipTap).  Emits HTML via onChange.
 *  Toolbar: undo/redo · H2/H3/H4/paragraph · bold/italic/underline/strike ·
 *  lists · align · quote/code/rule · table/link/image/upload · HTML view.
 *  Images upload through the mandatory WebP pipeline (uploadImage). */

import { useState, useRef, useCallback } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import {
  Undo2, Redo2, Pilcrow, Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Quote, Code, Minus,
  Table as TableIcon, Link2, Image as ImageIcon, Upload, Code2, Loader2,
} from "lucide-react";
import { uploadImage } from "@/app/actions/upload-image";
import { promptDialog } from "@/components/ui/Dialog";
import { toast } from "@/components/ui/Toast";

const EDITOR_CLASS =
  "[&_.ProseMirror]:min-h-[360px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:px-4 [&_.ProseMirror]:py-3 [&_.ProseMirror]:text-fg [&_.ProseMirror]:leading-relaxed " +
  "[&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:mt-5 [&_.ProseMirror_h2]:mb-2 " +
  "[&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:mt-4 [&_.ProseMirror_h3]:mb-2 " +
  "[&_.ProseMirror_h4]:text-lg [&_.ProseMirror_h4]:font-semibold [&_.ProseMirror_h4]:mt-3 [&_.ProseMirror_h4]:mb-1 " +
  "[&_.ProseMirror_p]:my-2 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 " +
  "[&_.ProseMirror_a]:text-brand-blue [&_.ProseMirror_a]:underline [&_.ProseMirror_img]:rounded-xl [&_.ProseMirror_img]:my-3 [&_.ProseMirror_img]:max-w-full " +
  "[&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-brand-blue/40 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:text-fg-muted " +
  "[&_.ProseMirror_pre]:bg-bg-soft [&_.ProseMirror_pre]:rounded-lg [&_.ProseMirror_pre]:p-3 [&_.ProseMirror_pre]:text-sm [&_.ProseMirror_pre]:overflow-x-auto " +
  "[&_.ProseMirror_hr]:my-4 [&_.ProseMirror_hr]:border-border " +
  "[&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-border [&_.ProseMirror_td]:p-2 [&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-border [&_.ProseMirror_th]:bg-bg-soft [&_.ProseMirror_th]:p-2 " +
  "[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-fg-faint [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0";

export default function RichEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const [mode, setMode] = useState<"rich" | "html">("rich");
  const [html, setHtml] = useState(value);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || "",
    editorProps: { attributes: { class: "rich-content" } },
    onUpdate: ({ editor }) => {
      const h = editor.getHTML();
      setHtml(h);
      onChange(h);
    },
  });

  const insertImageUrl = useCallback(async () => {
    if (!editor) return;
    const url = await promptDialog({ title: "Insert image", message: "Image URL", placeholder: "https://…" });
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const setLink = useCallback(async () => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = await promptDialog({ title: "Add link", message: "Link URL", defaultValue: prev ?? "https://" });
    if (url === null) return;
    if (url === "") editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const onUpload = useCallback(
    async (file: File) => {
      if (!editor) return;
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("image", file);
        fd.append("folder", "blog");
        const res = await uploadImage(fd);
        if (res.ok) editor.chain().focus().setImage({ src: res.url }).run();
        else toast(res.error, "error");
      } finally {
        setUploading(false);
      }
    },
    [editor],
  );

  function toggleHtml() {
    if (mode === "rich") {
      setHtml(editor?.getHTML() ?? html);
      setMode("html");
    } else {
      editor?.commands.setContent(html || "", { emitUpdate: false });
      onChange(html);
      setMode("rich");
    }
  }

  if (!editor) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-2xl border border-border bg-bg">
        <Loader2 className="h-5 w-5 animate-spin text-fg-faint" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-bg">
      {/* Toolbar pins just below the admin topbar (h-16) so the formatting
          controls stay reachable while editing a long article — no more
          scrolling back to the top to bold or add a heading. */}
      <div className="sticky top-16 z-20 flex flex-wrap items-center gap-0.5 rounded-t-2xl border-b border-border bg-bg-soft px-2 py-1.5 shadow-sm">
        <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo2 className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo2 className="h-4 w-4" /></Btn>
        <Sep />
        <TextBtn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</TextBtn>
        <TextBtn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</TextBtn>
        <TextBtn active={editor.isActive("heading", { level: 4 })} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>H4</TextBtn>
        <Btn active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()} title="Paragraph"><Pilcrow className="h-4 w-4" /></Btn>
        <Sep />
        <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold className="h-4 w-4" /></Btn>
        <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic className="h-4 w-4" /></Btn>
        <Btn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><UnderlineIcon className="h-4 w-4" /></Btn>
        <Btn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough"><Strikethrough className="h-4 w-4" /></Btn>
        <Sep />
        <Btn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list"><List className="h-4 w-4" /></Btn>
        <Btn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list"><ListOrdered className="h-4 w-4" /></Btn>
        <Sep />
        <Btn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align left"><AlignLeft className="h-4 w-4" /></Btn>
        <Btn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Align center"><AlignCenter className="h-4 w-4" /></Btn>
        <Btn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Align right"><AlignRight className="h-4 w-4" /></Btn>
        <Sep />
        <Btn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote"><Quote className="h-4 w-4" /></Btn>
        <Btn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code block"><Code className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider"><Minus className="h-4 w-4" /></Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Table"><TableIcon className="h-4 w-4" /></Btn>
        <Btn active={editor.isActive("link")} onClick={setLink} title="Link"><Link2 className="h-4 w-4" /></Btn>
        <Btn onClick={insertImageUrl} title="Image by URL"><ImageIcon className="h-4 w-4" /></Btn>
        <Btn onClick={() => fileRef.current?.click()} title="Upload image">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        </Btn>
        <div className="ml-auto">
          <button
            type="button"
            onClick={toggleHtml}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              mode === "html" ? "bg-brand-blue text-white" : "text-fg-muted hover:bg-bg"
            }`}
          >
            <Code2 className="h-4 w-4" /> HTML
          </button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.target.value = "";
        }}
      />

      {mode === "rich" ? (
        // Self-scrolling pane: long content gets its own right-hand
        // scrollbar instead of stretching the whole page, keeping the
        // toolbar above it always in view.
        <div className="max-h-[65vh] overflow-y-auto rounded-b-2xl">
          <div className={EDITOR_CLASS}>
            <EditorContent editor={editor} />
          </div>
        </div>
      ) : (
        <textarea
          value={html}
          onChange={(e) => {
            setHtml(e.target.value);
            onChange(e.target.value);
          }}
          spellCheck={false}
          className="min-h-[360px] max-h-[65vh] w-full resize-y rounded-b-2xl bg-bg px-4 py-3 font-mono text-sm text-fg outline-none"
        />
      )}
    </div>
  );
}

function Btn({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${
        active ? "bg-brand-blue text-white" : "text-fg-muted hover:bg-bg"
      }`}
    >
      {children}
    </button>
  );
}

function TextBtn({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid h-8 min-w-8 place-items-center rounded-lg px-1.5 text-xs font-bold transition-colors ${
        active ? "bg-brand-blue text-white" : "text-fg-muted hover:bg-bg"
      }`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="mx-1 h-5 w-px bg-border" />;
}

// `editor` typing helper kept for clarity of intent.
export type { Editor };
