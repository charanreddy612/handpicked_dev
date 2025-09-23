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

          // Deduplicate by extension name safely (avoid coercion to primitive)
          let counter = 0;
          const extMap = new Map();
          for (const ext of rawExts) {
            if (!ext) continue;
            let name;
            try {
              if (typeof ext === "object" && ext !== null) {
                if (typeof ext.name === "string" && ext.name) name = ext.name;
                else if (
                  ext.constructor &&
                  typeof ext.constructor.name === "string"
                )
                  name = ext.constructor.name;
                else if (ext.content && ext.content.name)
                  name = ext.content.name;
              } else if (typeof ext === "function" && ext.name) {
                name = ext.name;
              }
            } catch (e) {
              // ignore
            }
            if (!name) name = `__ext_fallback_${++counter}`;
            if (!extMap.has(name)) extMap.set(name, ext);
          }
          const extensions = Array.from(extMap.values());

          // debug
          try {
            console.debug(
              "TipTap: registered extensions:",
              Array.from(extMap.keys())
            );
          } catch (e) {}

          // create editor instance
          const editor = useEditor({
            extensions,
            content: vHtml || "<p></p>",
            onUpdate: ({ editor }) => {
              try {
                const html = editor.getHTML();
                const json = editor.getJSON();
                onUpd?.(html, json);
              } catch (e) {
                console.error("Editor onUpdate failed", e);
              }
            },
          });

          // keep stable ref for handlers (prevents closure timing issues)
          const editorRef = useRef(null);
          useEffect(() => {
            editorRef.current = editor;
          }, [editor]);

          // sync external valueHtml changes (safe guard)
          useEffect(() => {
            const ed = editorRef.current;
            if (!ed) return;
            try {
              if (vHtml && ed.getHTML() !== vHtml) {
                ed.commands.setContent(vHtml, false);
              }
            } catch (e) {
              console.error("Failed to sync external HTML", e);
            }
          }, [vHtml]);

          // image upload handler via hidden input (uses ref)
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
              const ed = editorRef.current;
              if (ed && ed.chain) {
                ed.chain().focus().setImage({ src: url, alt: file.name }).run();
              } else {
                console.warn("Editor not ready for image insert");
              }
            } catch (e) {
              console.error("Image upload failed", e);
              alert("Image upload failed");
            }
          };

          // guarded insert table (uses ref)
          const handleInsertTable = () => {
            try {
              const ed = editorRef.current;
              if (!ed || !ed.commands) throw new Error("editor not ready");
              if (typeof ed.commands.insertTable === "function") {
                ed.chain()
                  .focus()
                  .insertTable({ rows: 2, cols: 2, withHeaderRow: true })
                  .run();
              } else {
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
                  onClick={() =>
                    editorRef.current?.chain()?.focus()?.toggleBold()?.run()
                  }
                  className="px-2 py-1 border rounded"
                >
                  B
                </button>

                <button
                  type="button"
                  onClick={() =>
                    editorRef.current?.chain()?.focus()?.toggleItalic()?.run()
                  }
                  className="px-2 py-1 border rounded"
                >
                  I
                </button>

                <button
                  type="button"
                  onClick={() =>
                    editorRef.current
                      ?.chain()
                      ?.focus()
                      ?.toggleUnderline()
                      ?.run()
                  }
                  className="px-2 py-1 border rounded"
                >
                  U
                </button>

                <button
                  type="button"
                  onClick={() =>
                    editorRef.current
                      ?.chain()
                      ?.focus()
                      ?.toggleBulletList()
                      ?.run()
                  }
                  className="px-2 py-1 border rounded"
                >
                  • List
                </button>

                <button
                  type="button"
                  onClick={() =>
                    editorRef.current
                      ?.chain()
                      ?.focus()
                      ?.toggleOrderedList()
                      ?.run()
                  }
                  className="px-2 py-1 border rounded"
                >
                  1. List
                </button>

                <button
                  type="button"
                  onClick={() =>
                    editorRef.current?.chain()?.focus()?.setParagraph()?.run()
                  }
                  className="px-2 py-1 border rounded"
                >
                  P
                </button>

                <button
                  type="button"
                  onClick={() =>
                    editorRef.current
                      ?.chain()
                      ?.focus()
                      ?.toggleCodeBlock()
                      ?.run()
                  }
                  className="px-2 py-1 border rounded"
                >
                  {"</>"}
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

              <div className="border rounded bg-white min-h-[240px]">
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
                        const ed = editorRef.current;
                        if (!ed) return;
                        const src = ed.getAttributes("image").src;
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
                        defaultValue={
                          editorRef.current?.getAttributes("image")?.alt || ""
                        }
                        onBlur={(e) => {
                          const alt = e.target.value || null;
                          const ed = editorRef.current;
                          if (!ed) return;
                          ed.chain()
                            .focus()
                            .updateAttributes("image", {
                              ...ed.getAttributes("image"),
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
                        defaultValue={
                          editorRef.current?.getAttributes("image")?.title || ""
                        }
                        onBlur={(e) => {
                          const title = e.target.value || null;
                          const ed = editorRef.current;
                          if (!ed) return;
                          ed.chain()
                            .focus()
                            .updateAttributes("image", {
                              ...ed.getAttributes("image"),
                              title,
                            })
                            .run();
                        }}
                        className="border px-2 py-1 rounded"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        const ed = editorRef.current;
                        if (!ed) return;
                        ed.chain().focus().deleteSelection().run();
                      }}
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
