// src/components/common/TiptapEditor.client.jsx
import React, { useEffect, useState, useRef } from "react";

/**
 * Client-only TipTap loader (drop-in).
 * Props: { valueHtml = "", onUpdate(html,json), uploadImage(file)->url, className }
 */
export default function TiptapEditorClient(props) {
  const { valueHtml = "", onUpdate, uploadImage, className = "" } = props;
  const [EditorInner, setEditorInner] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // dynamic imports (client only)
        const tiptap = await import("@tiptap/react");
        const StarterKitMod = await import("@tiptap/starter-kit");
        const UnderlineMod = await import("@tiptap/extension-underline");
        const LinkMod = await import("@tiptap/extension-link");
        const ImageMod = await import("@tiptap/extension-image");
        const TableMod = await import("@tiptap/extension-table");
        const TableRowMod = await import("@tiptap/extension-table-row");
        const TableCellMod = await import("@tiptap/extension-table-cell");
        const TableHeaderMod = await import("@tiptap/extension-table-header");
        const TextAlignMod = await import("@tiptap/extension-text-align");
        const PlaceholderMod = await import("@tiptap/extension-placeholder");

        if (!mounted) return;

        const EditorContent =
          tiptap.EditorContent ?? tiptap.default?.EditorContent;
        const useEditor = tiptap.useEditor ?? tiptap.default?.useEditor;
        const BubbleMenuComp =
          tiptap.BubbleMenu ?? tiptap.default?.BubbleMenu ?? null;

        const StarterKit = StarterKitMod.default ?? StarterKitMod;
        const Underline = UnderlineMod.default ?? UnderlineMod;
        const LinkExt = LinkMod.default ?? LinkMod;
        const ImageExt = ImageMod.default ?? ImageMod;
        const TableExt = TableMod.default ?? TableMod;
        const TableRowExt = TableRowMod.default ?? TableRowMod;
        const TableCellExt = TableCellMod.default ?? TableCellMod;
        const TableHeaderExt = TableHeaderMod.default ?? TableHeaderMod;
        const TextAlignExt = TextAlignMod.default ?? TextAlignMod;
        const PlaceholderExt = PlaceholderMod.default ?? PlaceholderMod;

        function EditorInnerCmp({
          valueHtml: vHtml,
          onUpdate: onUpd,
          uploadImage: upImg,
          className: cls,
        }) {
          // build extensions list
          const candidates = [
            StarterKit &&
              (StarterKit.configure
                ? StarterKit.configure({ history: true })
                : StarterKit),
            Underline,
            LinkExt &&
              (LinkExt.configure
                ? LinkExt.configure({ openOnClick: true })
                : LinkExt),
            ImageExt &&
              (ImageExt.extend
                ? ImageExt.extend({
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
                : ImageExt),
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

          // dedupe by stable name to avoid "Duplicate extension" and runtime conflicts
          const extMap = new Map();
          let fallbackCounter = 0;
          for (const ex of candidates) {
            let name;
            try {
              if (ex && typeof ex === "object" && ex.name) name = ex.name;
              else if (typeof ex === "function" && ex.name) name = ex.name;
              else if (ex && ex.constructor && ex.constructor.name)
                name = ex.constructor.name;
            } catch (e) {}
            if (!name) name = `__ext_fallback_${++fallbackCounter}`;
            if (!extMap.has(name)) extMap.set(name, ex);
          }
          const extensions = Array.from(extMap.values());

          const editor = useEditor({
            extensions,
            content: vHtml || "<p></p>",
            onUpdate: ({ editor }) => {
              try {
                const html = editor.getHTML();
                const json = editor.getJSON();
                onUpd?.(html, json);
              } catch (err) {
                console.error("editor.onUpdate error", err);
              }
            },
          });

          // sync external value changes
          useEffect(() => {
            if (!editor) return;
            if (vHtml && editor.getHTML() !== vHtml) {
              editor.commands.setContent(vHtml, false);
            }
          }, [vHtml, editor]);

          const fileRef = useRef(null);
          const insertImageFile = async (file) => {
            if (!file) return;
            if (!upImg) {
              console.error("uploadImage prop required");
              return;
            }
            if (file.size > 10 * 1024 * 1024) {
              alert("Image too large (max 10MB)");
              return;
            }
            try {
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

          // simple image inspector (right side) — non-blocking
          const rootRef = useRef(null);
          const [selectedImage, setSelectedImage] = useState(null);
          useEffect(() => {
            if (!rootRef.current) return;
            const root = rootRef.current;
            const clickHandler = (e) => {
              const img =
                e.target && e.target.tagName === "IMG" ? e.target : null;
              if (!img) {
                setSelectedImage(null);
                return;
              }
              setSelectedImage({
                src: img.src,
                alt: img.alt || "",
                title: img.title || "",
              });
            };
            root.addEventListener("click", clickHandler);
            return () => root.removeEventListener("click", clickHandler);
          }, [editor]);

          const updateImageAttrs = (patch) => {
            try {
              editor.chain().focus().updateAttributes("image", patch).run();
              setSelectedImage((s) => ({ ...s, ...patch }));
            } catch (err) {
              console.error("updateImageAttrs failed", err);
            }
          };

          const handleInsertTable = () => {
            try {
              if (!editor) throw new Error("editor not ready");
              // prefer chain().insertTable if available
              if (
                editor.chain &&
                typeof editor.chain().insertTable === "function"
              ) {
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 2, cols: 2, withHeaderRow: true })
                  .run();
                return;
              }
              // fallback detection for various builds
              if (
                editor.commands &&
                typeof editor.commands.insertTable === "function"
              ) {
                editor.commands.insertTable({
                  rows: 2,
                  cols: 2,
                  withHeaderRow: true,
                });
                return;
              }
              alert("Table feature not available in this build.");
            } catch (err) {
              console.error("Insert table failed:", err);
              alert("Table feature not available.");
            }
          };

          const setHeading = (value) => {
            if (!editor) return;
            if (value === "p") {
              try {
                editor.chain().focus().setParagraph().run();
              } catch {
                try {
                  editor.chain().focus().toggleHeading({ level: 0 }).run();
                } catch {}
              }
              return;
            }
            const lvl = Number(value);
            if (Number.isFinite(lvl)) {
              try {
                editor.chain().focus().toggleHeading({ level: lvl }).run();
              } catch (e) {
                console.error(e);
              }
            }
          };

          return (
            <div
              style={{ position: "relative" }}
              className={`tiptap-root ${cls}`}
            >
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
                    editor?.chain().focus().toggleOrderedList().run()
                  }
                  className="px-2 py-1 border rounded"
                >
                  1.
                </button>
                <button
                  type="button"
                  onClick={() =>
                    editor?.chain().focus().toggleBulletList().run()
                  }
                  className="px-2 py-1 border rounded"
                >
                  •
                </button>

                <button
                  type="button"
                  onClick={() =>
                    editor?.chain().focus().toggleCodeBlock().run()
                  }
                  className="px-2 py-1 border rounded"
                >{`</>`}</button>

                <select
                  onChange={(e) => setHeading(e.target.value)}
                  defaultValue="p"
                  className="border px-2 py-1 rounded"
                >
                  <option value="p">Paragraph</option>
                  <option value="1">H1</option>
                  <option value="2">H2</option>
                  <option value="3">H3</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    const url = prompt("Enter link URL");
                    if (url)
                      editor.chain().focus().setLink({ href: url }).run();
                  }}
                  className="px-2 py-1 border rounded"
                >
                  Link
                </button>

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

              <div
                ref={rootRef}
                className="border rounded bg-white min-h-[240px]"
              >
                {editor ? (
                  <EditorContent editor={editor} />
                ) : (
                  <div className="p-4">Loading editor...</div>
                )}
              </div>

              {selectedImage && (
                <div
                  style={{
                    position: "absolute",
                    right: -320,
                    top: 0,
                    width: 300,
                    zIndex: 60,
                    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                    background: "white",
                    borderRadius: 6,
                    padding: 12,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Image</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#444",
                      marginBottom: 8,
                      wordBreak: "break-all",
                    }}
                  >
                    {selectedImage.src}
                  </div>

                  <label style={{ display: "block", marginBottom: 8 }}>
                    Alt
                    <input
                      value={selectedImage.alt}
                      onChange={(e) =>
                        setSelectedImage((s) => ({ ...s, alt: e.target.value }))
                      }
                      onBlur={(e) =>
                        updateImageAttrs({ alt: e.target.value || null })
                      }
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        marginTop: 6,
                        borderRadius: 4,
                        border: "1px solid #ddd",
                      }}
                    />
                  </label>

                  <label style={{ display: "block", marginBottom: 8 }}>
                    Title
                    <input
                      value={selectedImage.title}
                      onChange={(e) =>
                        setSelectedImage((s) => ({
                          ...s,
                          title: e.target.value,
                        }))
                      }
                      onBlur={(e) =>
                        updateImageAttrs({ title: e.target.value || null })
                      }
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        marginTop: 6,
                        borderRadius: 4,
                        border: "1px solid #ddd",
                      }}
                    />
                  </label>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      style={{ padding: "6px 10px", borderRadius: 4 }}
                      onClick={() => {
                        try {
                          editor.chain().focus().deleteSelection().run();
                        } catch {}
                        setSelectedImage(null);
                      }}
                    >
                      Delete
                    </button>
                    <button
                      style={{ padding: "6px 10px", borderRadius: 4 }}
                      onClick={() => setSelectedImage(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        }

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
