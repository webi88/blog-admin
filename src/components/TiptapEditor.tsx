"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Bold, Italic, Underline as UIcon, Strikethrough, Code, Link as LinkIcon,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Quote,
  Minus, Table as TableIcon, Image as ImgIcon, Undo, Redo, Heading1, Heading2, Heading3,
  Highlighter, Code2, Globe,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { uploadImage } from "@/lib/supabase";

interface Props {
  content: string;
  onChange: (html: string) => void;
  site: string;
}

const Btn = ({ onClick, active, title, children }: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded-md text-sm transition-colors ${
      active ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
    }`}
  >
    {children}
  </button>
);

const Sep = () => <div className="w-px h-5 bg-gray-200 mx-1" />;

export default function TiptapEditor({ content, onChange, site }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow, TableHeader, TableCell,
      CharacterCount,
      Placeholder.configure({ placeholder: "Escribe el contenido del artículo aquí…" }),
    ],
    content,
    editorProps: { attributes: { class: "tiptap-content px-6 py-5 focus:outline-none" } },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const insertImageFromFile = useCallback(async (file: File) => {
    if (!editor) return;
    const toBase64 = (f: File): Promise<string> =>
      new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(f);
      });
    try {
      const url = await uploadImage(file, site);
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      const b64 = await toBase64(file);
      editor.chain().focus().setImage({ src: b64 }).run();
    }
  }, [editor, site]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    for (const file of files) await insertImageFromFile(file);
    e.target.value = "";
  }, [insertImageFromFile]);

  const handleImageUrl = useCallback(() => {
    const url = window.prompt("URL de la imagen:");
    if (url) editor?.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    for (const file of files) await insertImageFromFile(file);
  }, [insertImageFromFile]);

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.files).filter(f => f.type.startsWith("image/"));
    if (!files.length) return;
    e.preventDefault();
    for (const file of files) await insertImageFromFile(file);
  }, [insertImageFromFile]);

  const addLink = useCallback(() => {
    const prev = editor?.getAttributes("link").href ?? "";
    const url = window.prompt("URL del enlace:", prev);
    if (url === null) return;
    if (url === "") { editor?.chain().focus().unsetLink().run(); return; }
    editor?.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const addTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) return <div className="h-[400px] bg-gray-50 rounded-xl animate-pulse" />;

  const chars = editor.storage.characterCount?.characters?.() ?? 0;
  const words = editor.storage.characterCount?.words?.() ?? 0;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
        {/* History */}
        <Btn title="Deshacer" onClick={() => editor.chain().focus().undo().run()}><Undo className="w-4 h-4" /></Btn>
        <Btn title="Rehacer" onClick={() => editor.chain().focus().redo().run()}><Redo className="w-4 h-4" /></Btn>
        <Sep />
        {/* Headings */}
        <Btn title="H1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="w-4 h-4" /></Btn>
        <Btn title="H2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="w-4 h-4" /></Btn>
        <Btn title="H3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="w-4 h-4" /></Btn>
        <Sep />
        {/* Format */}
        <Btn title="Negrita" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="w-4 h-4" /></Btn>
        <Btn title="Cursiva" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="w-4 h-4" /></Btn>
        <Btn title="Subrayado" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UIcon className="w-4 h-4" /></Btn>
        <Btn title="Tachado" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="w-4 h-4" /></Btn>
        <Btn title="Resaltar" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()}><Highlighter className="w-4 h-4" /></Btn>
        <Sep />
        {/* Align */}
        <Btn title="Izquierda" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="w-4 h-4" /></Btn>
        <Btn title="Centro" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="w-4 h-4" /></Btn>
        <Btn title="Derecha" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight className="w-4 h-4" /></Btn>
        <Sep />
        {/* Lists */}
        <Btn title="Lista" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="w-4 h-4" /></Btn>
        <Btn title="Lista numerada" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="w-4 h-4" /></Btn>
        <Btn title="Cita" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="w-4 h-4" /></Btn>
        <Btn title="Código" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}><Code className="w-4 h-4" /></Btn>
        <Btn title="Bloque código" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code2 className="w-4 h-4" /></Btn>
        <Btn title="Separador" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="w-4 h-4" /></Btn>
        <Sep />
        {/* Link & Image & Table */}
        <Btn title="Enlace" active={editor.isActive("link")} onClick={addLink}><LinkIcon className="w-4 h-4" /></Btn>
        <Btn title="Insertar imagen" onClick={() => fileRef.current?.click()}><ImgIcon className="w-4 h-4" /></Btn>
        <Btn title="Insertar tabla" onClick={addTable}><TableIcon className="w-4 h-4" /></Btn>

        <Btn title="Imagen desde URL" onClick={handleImageUrl}><Globe className="w-4 h-4" /></Btn>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />

        {/* Word count */}
        <div className="ml-auto text-xs text-gray-400 pr-2">
          {words} pal · {chars} car
        </div>
      </div>

      {/* Editor area with drag & drop + paste */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onPaste={handlePaste}
        className={`relative transition-colors ${dragging ? "bg-blue-50" : ""}`}
      >
        {dragging && (
          <div className="absolute inset-0 z-10 border-2 border-dashed border-blue-400 rounded-b-xl flex items-center justify-center pointer-events-none">
            <p className="text-blue-500 font-semibold text-sm">Suelta la imagen aquí</p>
          </div>
        )}
        <EditorContent editor={editor} className="min-h-[450px] cursor-text" />
      </div>
    </div>
  );
}
