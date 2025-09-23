// src/components/common/TiptapEditor.jsx
import React, { useEffect, useMemo, useRef } from "react";
import { EditorContent, useEditor, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import ResizeImage from "tiptap-extension-resize-image";

/**
 * Props:
 * - valueHtml: initial HTML string (optional)
 * - onUpdate: (html, json) => void // called on change
 * - uploadImage: async (File) => url  // required for image uploads
 * - className: optional
 */
export default function TiptapEditor({
  valueHtml = "",
  onUpdate,
  uploadImage,
  className = "",
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link,
      Image.configure({ inline: false }),
      // add ResizeImage immediately after Image
      ResizeImage.configure({
        // optional: enable percentage snap, min/max width, or custom handle UI
        // leave defaults if you don't need customization
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Write here..." }),
    ],
    content: valueHtml || "<p></p>",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const json = editor.getJSON();
      onUpdate?.(html, json);
    },
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    // update content if external valueHtml changes
    if (!editor) return;
    if (valueHtml && editor.getHTML() !== valueHtml) {
      editor.commands.setContent(valueHtml, false);
    }
  }, [valueHtml, editor]);

  const insertImageFile = async (file) => {
    if (!file) return;
    if (!uploadImage) {
      console.error("uploadImage prop required");
      return;
    }
    try {
      // optional quick client validation
      if (file.size > 10 * 1024 * 1024) {
        alert("Image too large (max 10MB)");
        return;
      }
      // insert placeholder
      const editorInstance = editor;
      const selection = editorInstance.state.selection;
      editorInstance
        .chain()
        .focus()
        .insertContent(`<p>Uploading image…</p>`)
        .run();

      const url = await uploadImage(file); // must return public URL
      if (!url) throw new Error("no url returned");

      // remove placeholder and insert image node
      editorInstance
        .chain()
        .focus()
        .deleteRange({ from: selection.from, to: selection.to })
        .setImage({ src: url, alt: file.name })
        .run();
    } catch (e) {
      console.error("Image upload failed", e);
      alert("Image upload failed");
    }
  };

  const handleFilePick = () => fileInputRef.current?.click();

  return (
    <div className={`tiptap-root ${className}`}>
      <div className="mb-2 flex gap-2">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className="px-2 py-1 border rounded"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className="px-2 py-1 border rounded"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          className="px-2 py-1 border rounded"
        >
          U
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className="px-2 py-1 border rounded"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className="px-2 py-1 border rounded"
        >
          1. List
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().setParagraph().run()}
          className="px-2 py-1 border rounded"
        >
          P
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          className="px-2 py-1 border rounded"
        >
          {"</>"}
        </button>
        <button
          type="button"
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .insertTable({ rows: 2, cols: 2, withHeaderRow: true })
              .run()
          }
          className="px-2 py-1 border rounded"
        >
          Table
        </button>
        <button
          type="button"
          onClick={handleFilePick}
          className="px-2 py-1 border rounded"
        >
          Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => insertImageFile(e.target.files?.[0])}
        />
      </div>

      <div className="border rounded bg-white min-h-[240px]">
        <EditorContent editor={editor} />
      </div>

      {/* BubbleMenu for image alt/title editing */}
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="bg-white border rounded p-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const src = editor.getAttributes("image").src;
                if (src) window.open(src, "_blank", "noopener");
              }}
              className="px-2 py-1 border rounded"
            >
              Open
            </button>
            <label className="flex items-center gap-2">
              Alt:
              <input
                type="text"
                defaultValue={editor.getAttributes("image").alt || ""}
                onBlur={(e) => {
                  const alt = e.target.value || null;
                  editor
                    .chain()
                    .focus()
                    .updateAttributes("image", {
                      ...editor.getAttributes("image"),
                      alt,
                    })
                    .run();
                }}
                className="border px-2 py-1 rounded"
              />
            </label>
            <label className="flex items-center gap-2">
              Title:
              <input
                type="text"
                defaultValue={editor.getAttributes("image").title || ""}
                onBlur={(e) => {
                  const title = e.target.value || null;
                  editor
                    .chain()
                    .focus()
                    .updateAttributes("image", {
                      ...editor.getAttributes("image"),
                      title,
                    })
                    .run();
                }}
                className="border px-2 py-1 rounded"
              />
            </label>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteSelection().run()}
              className="px-2 py-1 border rounded"
            >
              Delete
            </button>
          </div>
        </BubbleMenu>
      )}
    </div>
  );
}
