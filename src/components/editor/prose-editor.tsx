"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Minus,
  ImagePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, useRef } from "react";
import type { JSONContent } from "@tiptap/react";

interface ProseEditorProps {
  initialContent?: JSONContent;
  onChange?: (content: JSONContent) => void;
  className?: string;
}

export function ProseEditor({
  initialContent,
  onChange,
  className,
}: ProseEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg",
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing your story...",
      }),
    ],
    content: initialContent || undefined,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none",
      },
    },
  });

  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;

      const url = URL.createObjectURL(file);
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [editor]
  );

  if (!editor) return null;

  return (
    <div className={cn("rounded-lg border border-border bg-surface", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-border px-3 py-2 flex-wrap">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          active={false}
          onClick={handleImageUpload}
          title="Insert Image"
        >
          <ImagePlus className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <div className="tiptap-editor">
        <EditorContent editor={editor} />
      </div>

      {/* Hidden file input for images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFile}
        className="hidden"
      />
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex items-center justify-center h-8 w-8 rounded-md transition-colors cursor-pointer",
        active
          ? "bg-accent/15 text-accent"
          : "text-muted hover:text-foreground hover:bg-surface-hover"
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="h-5 w-px bg-border mx-1" />;
}
