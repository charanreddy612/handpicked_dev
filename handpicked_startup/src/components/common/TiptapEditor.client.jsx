// src/components/common/TiptapEditor.client.jsx
import React, { useEffect, useState, useRef } from "react";

export default function TiptapEditorClient(props) {
  const { valueHtml = "", onUpdate, uploadImage, className = "" } = props;
  const [EditorInner, setEditorInner] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // dynamic imports (only run in browser)
        const [
          tiptapReact,
          StarterKit,
          Underline,
          Link,
          ImageExt,
          Table,
          TableRow,
          TableCell,
          TableHeader,
          TextAlign,
          Placeholder,
          BubbleMenuModule,
        ] = await Promise.all([
          import("@tiptap/react"),
          import("@tiptap/starter-kit"),
          import("@tiptap/extension-underline"),
          import("@tiptap/extension-link"),
          import("@tiptap/extension-image"),
          import("@tiptap/extension-table"),
          import("@tiptap/extension-table-row"),
          import("@tiptap/extension-table-cell"),
          import("@tiptap/extension-table-header"),
          import("@tiptap/extension-text-align"),
          import("@tiptap/extension-placeholder"),
          import("@tiptap/react")
            .then((m) => m.BubbleMenu)
            .catch(() => null),
        ]);

        if (!mounted) return;

        const { EditorContent, useEditor, BubbleMenu } = tiptapReact;
        const Starter = StarterKit.default ?? StarterKit;
        const UnderlineExt = Underline.default ?? Underline;
        const LinkExt = Link.default ?? Link;
        const ImageExtDef = ImageExt.default ?? ImageExt;
        const TableExt = Table.default ?? Table;
        const TableRowExt = TableRow.default ?? TableRow;
        const TableCellExt = TableCell.default ?? TableCell;
        const TableHeaderExt = TableHeader.default ?? TableHeader;
        const TextAlignExt = TextAlign.default ?? TextAlign;
        const PlaceholderExt = Placeholder.default ?? Placeholder;
        const BubbleMenuComp = BubbleMenu || null;

        // Inner component that actually uses TipTap hooks (safe since imports done)
        function EditorInnerCmp(innerProps) {
          const {
            valueHtml: vHtml,
            onUpdate: onUpd,
            uploadImage: upImg,
            className: cls,
          } = innerProps;
          const editor = useEditor({
            extensions: [
              Starter.configure({ history: true }),
              UnderlineExt,
              LinkExt.configure({ openOnClick: true }),
              ImageExtDef.extend({
                addAttributes() {
                  return {
                    src: {},
                    alt: { default: null },
                    title: { default: null },
                    width: { default: null },
                    height: { default: null },
                  };
                },
              }),
              TableExt.configure({ resizable: true }),
              TableRowExt,
              TableHeaderExt,
              TableCellExt,
              TextAlignExt.configure({ types: ["heading", "paragraph"] }),
              PlaceholderExt.configure({ placeholder: "Write here..." }),
            ],
            content: vHtml || "<p></p>",
            onUpdate: ({ editor }) => {
              const html = editor.getHTML();
              const json = editor.getJSON();
              onUpd?.(html, json);
            },
          });

          // image upload handler via hidden input (same logic you used)
          const fileRef = useRef(null);
          useEffect(() => {
            // sync external changes to content
            if (!editor) return;
            if (vHtml && editor.getHTML() !== vHtml) {
              editor.commands.setContent(vHtml, false);
            }
          }, [vHtml, editor]);

          const insertImageFile = async (file) => {
            if (!file) return;
            if (!upImg) {
              console.error("uploadImage prop required");
              return;
            }
            try {
              if (file.size > 10 * 1024 * 1024) {
                alert("Image too large (max 10MB)");
                return;
              }
              const url = await upImg(file);
              if (!url) throw new Error("no url returned");
              editor
                .chain()
                .focus()
                .setImage({ src: url, alt: file.name })
                .run();
            } catch (e) {
              console.error("Image upload failed", e);
              alert("Image upload failed");
            }
          };

          return (
            <div className={`tiptap-root ${cls}`}>
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
                  onClick={() =>
                    editor?.chain().focus().toggleUnderline().run()
                  }
                  className="px-2 py-1 border rounded"
                >
                  U
                </button>
                <button
                  type="button"
                  onClick={() =>
                    editor?.chain().focus().toggleBulletList().run()
                  }
                  className="px-2 py-1 border rounded"
                >
                  • List
                </button>
                <button
                  type="button"
                  onClick={() =>
                    editor?.chain().focus().toggleOrderedList().run()
                  }
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
                  onClick={() =>
                    editor?.chain().focus().toggleCodeBlock().run()
                  }
                  className="px-2 py-1 border rounded"
                >{`</>`}</button>
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
                  onClick={() => fileRef.current?.click()}
                  className="px-2 py-1 border rounded"
                >
                  Image
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => insertImageFile(e.target.files?.[0])}
                />
              </div>

              <div className="border rounded bg-white min-h-[240px]">
                <EditorContent editor={editor} />
              </div>

              {editor && BubbleMenuComp && (
                <BubbleMenuComp
                  editor={editor}
                  tippyOptions={{ duration: 100 }}
                >
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
                      onClick={() =>
                        editor.chain().focus().deleteSelection().run()
                      }
                      className="px-2 py-1 border rounded"
                    >
                      Delete
                    </button>
                  </div>
                </BubbleMenuComp>
              )}
            </div>
          );
        }

        // set component for render
        setEditorInner(() => EditorInnerCmp);
      } catch (err) {
        console.error("Failed to load TipTap in client:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (!EditorInner) {
    return <div>Loading editor…</div>;
  }

  return (
    <EditorInner
      valueHtml={valueHtml}
      onUpdate={onUpdate}
      uploadImage={uploadImage}
      className={className}
    />
  );
}
