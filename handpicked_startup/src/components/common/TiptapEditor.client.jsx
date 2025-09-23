// src/components/common/TiptapEditor.client.jsx
import React, { useEffect, useState, useRef } from "react";

/**
 * Client-only TipTap loader.
 * Dynamically imports TipTap and extensions at runtime (no top-level @tiptap imports).
 *
 * Props:
 * - valueHtml, onUpdate(html,json), uploadImage(file) -> url, className
 */
export default function TiptapEditorClient(props) {
  const { valueHtml = "", onUpdate, uploadImage, className = "" } = props;
  const [EditorInner, setEditorInner] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // dynamic imports (await each so we can grab .default reliably)
        const tiptapReactModule = await import("@tiptap/react");
        const StarterKitModule = await import("@tiptap/starter-kit");
        const UnderlineModule = await import("@tiptap/extension-underline");
        const LinkModule = await import("@tiptap/extension-link");
        const ImageModule = await import("@tiptap/extension-image");
        const TableModule = await import("@tiptap/extension-table");
        const TableRowModule = await import("@tiptap/extension-table-row");
        const TableCellModule = await import("@tiptap/extension-table-cell");
        const TableHeaderModule = await import(
          "@tiptap/extension-table-header"
        );
        const TextAlignModule = await import("@tiptap/extension-text-align");
        const PlaceholderModule = await import("@tiptap/extension-placeholder");

        if (!mounted) return;

        // Safely extract exports (handle ESM/CJS interop)
        const EditorContent =
          tiptapReactModule.EditorContent ??
          tiptapReactModule.default?.EditorContent;
        const useEditor =
          tiptapReactModule.useEditor ?? tiptapReactModule.default?.useEditor;
        const BubbleMenuComp =
          tiptapReactModule.BubbleMenu ??
          tiptapReactModule.default?.BubbleMenu ??
          null;

        const Starter = StarterKitModule.default ?? StarterKitModule;
        const UnderlineExt = UnderlineModule.default ?? UnderlineModule;
        const LinkExt = LinkModule.default ?? LinkModule;
        const ImageExtDef = ImageModule.default ?? ImageModule;
        const TableExt = TableModule.default ?? TableModule;
        const TableRowExt = TableRowModule.default ?? TableRowModule;
        const TableCellExt = TableCellModule.default ?? TableCellModule;
        const TableHeaderExt = TableHeaderModule.default ?? TableHeaderModule;
        const TextAlignExt = TextAlignModule.default ?? TextAlignModule;
        const PlaceholderExt = PlaceholderModule.default ?? PlaceholderModule;

        // Inner component that actually uses TipTap hooks (safe since imports are done)
        function EditorInnerCmp(innerProps) {
          const {
            valueHtml: vHtml,
            onUpdate: onUpd,
            uploadImage: upImg,
            className: cls,
          } = innerProps;

          // Build raw extensions with feature detection
          const rawExts = [
            Starter &&
              (Starter.configure
                ? Starter.configure({ history: true })
                : Starter),
            UnderlineExt,
            LinkExt &&
              (LinkExt.configure
                ? LinkExt.configure({ openOnClick: true })
                : LinkExt),
            ImageExtDef &&
              (ImageExtDef.extend
                ? ImageExtDef.extend({
                    addAttributes() {
                      return {
                        src: {},
                        alt: { default: null },
                        title: { default: null },
                        width: { default: null },
                        height: { default: null },
                      };
                    },
                  })
                : ImageExtDef),
            TableExt &&
              (TableExt.configure
                ? TableExt.configure({ resizable: true })
                : TableExt),
            TableRowExt,
            TableHeaderExt,
            TableCellExt,
            TextAlignExt &&
              (TextAlignExt.configure
                ? TextAlignExt.configure({ types: ["heading", "paragraph"] })
                : TextAlignExt),
            PlaceholderExt &&
              (PlaceholderExt.configure
                ? PlaceholderExt.configure({ placeholder: "Write here..." })
                : PlaceholderExt),
          ].filter(Boolean);

          // Deduplicate by extension name (if available) to avoid duplicate-extension warnings
          const seen = new Set();
          const extensions = rawExts.filter((ext) => {
            try {
              const name =
                ext.name ||
                (ext.constructor && ext.constructor.name) ||
                String(ext);
              if (seen.has(name)) return false;
              seen.add(name);
              return true;
            } catch {
              return true;
            }
          });

          const editor = useEditor({
            extensions,
            content: vHtml || "<p></p>",
            onUpdate: ({ editor }) => {
              const html = editor.getHTML();
              const json = editor.getJSON();
              onUpd?.(html, json);
            },
          });

          // sync external valueHtml changes
          useEffect(() => {
            if (!editor) return;
            if (vHtml && editor.getHTML() !== vHtml) {
              editor.commands.setContent(vHtml, false);
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
          }, [vHtml, editor]);

          // image upload handler via hidden input
          const fileRef = useRef(null);
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
              if (editor && editor.chain) {
                editor
                  .chain()
                  .focus()
                  .setImage({ src: url, alt: file.name })
                  .run();
              }
            } catch (e) {
              console.error("Image upload failed", e);
              alert("Image upload failed");
            }
          };

          // guarded insert table
          const handleInsertTable = () => {
            try {
              if (!editor || !editor.commands)
                throw new Error("editor not ready");
              // some builds may expose nested commands; guard for function
              if (typeof editor.commands.insertTable === "function") {
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 2, cols: 2, withHeaderRow: true })
                  .run();
              } else {
                // fallback: try using createTable command path (older/newer variations)
                console.error("Table command not available on editor.commands");
                alert("Table feature not available in this build.");
              }
            } catch (err) {
              console.error("Insert table failed:", err);
              alert("Table feature not available.");
            }
          };

          return (
            <div className={`tiptap-root ${cls}`}>
              <div className="mb-2 flex flex-wrap gap-2">
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
                  onClick={handleInsertTable}
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
                {/* EditorContent from dynamic import */}
                {editor ? (
                  <EditorContent editor={editor} />
                ) : (
                  <div className="p-4">Loading editor...</div>
                )}
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

  if (!EditorInner) return <div>Loading editor…</div>;

  return (
    <EditorInner
      valueHtml={valueHtml}
      onUpdate={onUpdate}
      uploadImage={uploadImage}
      className={className}
    />
  );
}
