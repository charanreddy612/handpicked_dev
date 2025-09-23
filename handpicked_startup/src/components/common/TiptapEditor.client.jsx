// src/components/common/TiptapEditor.client.jsx
import React, { useEffect, useState, useRef } from "react";

/**
 * Drop-in client-only TipTap loader with:
 * - heading selector fixed
 * - dedupe of extensions
 * - guarded table support
 * - image inspector panel positioned to the right (avoids overlap)
 *
 * Props: valueHtml, onUpdate(html,json), uploadImage(file)->url, className
 */
export default function TiptapEditorClient(props) {
  const { valueHtml = "", onUpdate, uploadImage, className = "" } = props;
  const [EditorInner, setEditorInner] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // dynamic imports (browser-only)
        const tiptapModule = await import("@tiptap/react");
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

        const EditorContent =
          tiptapModule.EditorContent ?? tiptapModule.default?.EditorContent;
        const useEditor =
          tiptapModule.useEditor ?? tiptapModule.default?.useEditor;

        const Starter = StarterKitModule.default ?? StarterKitModule;
        const Underline = UnderlineModule.default ?? UnderlineModule;
        const LinkExt = LinkModule.default ?? LinkModule;
        const ImageExt = ImageModule.default ?? ImageModule;
        const TableExt = TableModule.default ?? TableModule;
        const TableRowExt = TableRowModule.default ?? TableRowModule;
        const TableCellExt = TableCellModule.default ?? TableCellModule;
        const TableHeaderExt = TableHeaderModule.default ?? TableHeaderModule;
        const TextAlignExt = TextAlignModule.default ?? TextAlignModule;
        const PlaceholderExt = PlaceholderModule.default ?? PlaceholderModule;

        function EditorInnerCmp({
          valueHtml: vHtml,
          onUpdate: onUpd,
          uploadImage: upImg,
          className: cls,
        }) {
          // build candidate extensions array
          const candidateExts = [
            Starter &&
              (Starter.configure
                ? Starter.configure({ history: true })
                : Starter),
            Underline,
            LinkExt &&
              (LinkExt.configure
                ? LinkExt.configure({ openOnClick: true })
                : LinkExt),
            ImageExt,
            // include table extensions but they might not expose the same command set in all builds
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

          // Deduplicate by extension name (safe, avoids coercion errors)
          const map = new Map();
          let tempCounter = 0;
          for (const ex of candidateExts) {
            let name = undefined;
            try {
              if (ex && typeof ex === "object" && ex.name) name = ex.name;
              else if (ex && typeof ex === "function" && ex.name)
                name = ex.name;
              else if (ex && ex.constructor && ex.constructor.name)
                name = ex.constructor.name;
            } catch (e) {
              /* ignore */
            }
            if (!name) name = `__ext_fallback_${++tempCounter}`;
            if (!map.has(name)) map.set(name, ex);
          }
          const extensions = Array.from(map.values());

          const editor = useEditor({
            extensions,
            content: vHtml || "<p></p>",
            onUpdate: ({ editor }) => {
              try {
                const html = editor.getHTML();
                const json = editor.getJSON();
                onUpd?.(html, json);
              } catch (err) {
                console.error("onUpdate error", err);
              }
            },
          });

          // sync external changes
          useEffect(() => {
            if (!editor) return;
            if (vHtml && editor.getHTML() !== vHtml) {
              editor.commands.setContent(vHtml, false);
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
          }, [vHtml, editor]);

          // image upload
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

          // image inspector (right-side panel)
          const rootRef = useRef(null);
          const [selectedImage, setSelectedImage] = useState(null);
          useEffect(() => {
            if (!rootRef.current) return;
            const root = rootRef.current;
            const onClick = (ev) => {
              const img =
                ev.target && ev.target.tagName === "IMG" ? ev.target : null;
              if (!img) {
                setSelectedImage(null);
                return;
              }
              setSelectedImage({
                src: img.getAttribute("src"),
                alt: img.getAttribute("alt") || "",
                title: img.getAttribute("title") || "",
              });
            };
            root.addEventListener("click", onClick);
            return () => root.removeEventListener("click", onClick);
          }, [editor]);

          const updateImageAttrs = (patch) => {
            if (!selectedImage) return;
            try {
              // best-effort: update attributes on currently selected image or fallback
              editor.chain().focus().updateAttributes("image", patch).run();
              setSelectedImage((s) => ({ ...s, ...patch }));
            } catch (err) {
              console.error("updateImageAttrs failed", err);
            }
          };

          // heading selector handler — use setNode for paragraph and toggleHeading for headings
          const handleHeadingChange = (value) => {
            if (!editor) return;
            if (value === "p") {
              // set paragraph node
              try {
                editor.chain().focus().setParagraph().run();
              } catch {
                // fallback to toggleHeading(0) if setParagraph absent
                try {
                  editor.chain().focus().toggleHeading({ level: 0 }).run();
                } catch {}
              }
            } else {
              const lvl = Number(value);
              if (Number.isFinite(lvl) && lvl >= 1 && lvl <= 6) {
                try {
                  editor.chain().focus().toggleHeading({ level: lvl }).run();
                } catch (e) {
                  console.error("toggleHeading failed", e);
                }
              }
            }
          };

          // guarded table insert (only if command exists)
          const handleInsertTable = () => {
            try {
              if (!editor) throw new Error("editor not ready");
              // prefer editor.commands.insertTable if available
              const cmd =
                editor.commands.insertTable ??
                editor.commands.createTable ??
                null;
              if (typeof cmd === "function") {
                // many versions expose insertTable via chain()
                editor
                  .chain()
                  .focus()
                  .insertTable?.({ rows: 2, cols: 2, withHeaderRow: true })
                  ?.run();
              } else {
                alert("Table feature not available in this build.");
              }
            } catch (err) {
              console.error("Insert table failed:", err);
              alert("Table feature not available.");
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
                  onChange={(e) => handleHeadingChange(e.target.value)}
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

              {/* right-side image inspector panel */}
              {selectedImage && (
                <div
                  style={{
                    position: "absolute",
                    right: -320, // place it to the right of the editor; tweak if needed
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
