// src/components/common/TiptapEditor.client.jsx
import React, { useEffect, useState, useRef } from "react";

/**
 * Robust client-only TipTap loader (drop-in).
 * Dynamically imports TipTap + extensions and defensively maps exports.
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
        // dynamic imports
        const [
          tiptapReactModule,
          StarterKitModule,
          UnderlineModule,
          LinkModule,
          ImageModule,
          TableModule,
          TableRowModule,
          TableCellModule,
          TableHeaderModule,
          TextAlignModule,
          PlaceholderModule,
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
        ]);

        if (!mounted) return;

        // helper to extract extension from module (tries common locations)
        const pick = (mod, names = []) => {
          if (!mod) return null;
          if (mod.default) return mod.default;
          for (const n of names) {
            if (mod[n]) return mod[n];
          }
          // fallback to module itself (some bundles export directly)
          return mod;
        };

        // extract core exports
        const EditorContent =
          tiptapReactModule.EditorContent ??
          tiptapReactModule.default?.EditorContent;
        const useEditor =
          tiptapReactModule.useEditor ?? tiptapReactModule.default?.useEditor;
        const BubbleMenuComp =
          tiptapReactModule.BubbleMenu ??
          tiptapReactModule.default?.BubbleMenu ??
          null;

        // extract extensions robustly
        const Starter = pick(StarterKitModule, ["StarterKit", "default"]);
        const UnderlineExt = pick(UnderlineModule, ["Underline", "default"]);
        const LinkExt = pick(LinkModule, ["Link", "default"]);
        const ImageExtDef = pick(ImageModule, ["Image", "default"]);
        const TableExt = pick(TableModule, ["Table", "default"]);
        const TableRowExt = pick(TableRowModule, ["TableRow", "default"]);
        const TableCellExt = pick(TableCellModule, ["TableCell", "default"]);
        const TableHeaderExt = pick(TableHeaderModule, [
          "TableHeader",
          "default",
        ]);
        const TextAlignExt = pick(TextAlignModule, ["TextAlign", "default"]);
        const PlaceholderExt = pick(PlaceholderModule, [
          "Placeholder",
          "default",
        ]);

        // Editor inner component
        function EditorInnerCmp(innerProps) {
          const {
            valueHtml: vHtml,
            onUpdate: onUpd,
            uploadImage: upImg,
            className: cls,
          } = innerProps;

          // build extension instances (feature-detect configure/extend methods)
          const rawExts = [];

          if (Starter) {
            // StarterKit is usually a function; try configure or push directly
            try {
              rawExts.push(Starter.configure ? Starter.configure({}) : Starter);
            } catch (e) {
              rawExts.push(Starter);
            }
          }

          if (UnderlineExt) rawExts.push(UnderlineExt);
          if (LinkExt)
            rawExts.push(
              LinkExt.configure
                ? LinkExt.configure({ openOnClick: true })
                : LinkExt
            );

          if (ImageExtDef) {
            if (ImageExtDef.extend) {
              rawExts.push(
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
                })
              );
            } else {
              rawExts.push(ImageExtDef);
            }
          }

          // include root 'table' extension first (if present)
          if (TableExt)
            rawExts.push(
              TableExt.configure
                ? TableExt.configure({ resizable: true })
                : TableExt
            );
          if (TableRowExt) rawExts.push(TableRowExt);
          if (TableHeaderExt) rawExts.push(TableHeaderExt);
          if (TableCellExt) rawExts.push(TableCellExt);

          if (TextAlignExt)
            rawExts.push(
              TextAlignExt.configure
                ? TextAlignExt.configure({ types: ["heading", "paragraph"] })
                : TextAlignExt
            );
          if (PlaceholderExt)
            rawExts.push(
              PlaceholderExt.configure
                ? PlaceholderExt.configure({ placeholder: "Write here..." })
                : PlaceholderExt
            );

          // dedupe extensions by safe name detection
          const extMap = new Map();
          let fallbackCounter = 0;
          for (const e of rawExts) {
            if (!e) continue;
            let nm = null;
            try {
              if (typeof e === "object" && e !== null) {
                if (typeof e.name === "string" && e.name) nm = e.name;
                else if (
                  e.constructor &&
                  typeof e.constructor.name === "string"
                )
                  nm = e.constructor.name;
                else if (e.options && e.options.name) nm = e.options.name;
              } else if (typeof e === "function" && e.name) nm = e.name;
            } catch (er) {
              /* ignore */
            }
            if (!nm) nm = `__ext_fallback_${++fallbackCounter}`;
            if (!extMap.has(nm)) extMap.set(nm, e);
          }

          const extensions = Array.from(extMap.values());
          try {
            console.debug(
              "TipTap: registered extensions:",
              Array.from(extMap.keys())
            );
          } catch (er) {}

          // create editor
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

          // stable ref
          const editorRef = useRef(null);
          useEffect(() => {
            editorRef.current = editor;
          }, [editor]);

          // sync external HTML changes
          useEffect(() => {
            const ed = editorRef.current;
            if (!ed) return;
            try {
              if (vHtml && ed.getHTML() !== vHtml)
                ed.commands.setContent(vHtml, false);
            } catch (e) {
              console.error("sync content failed", e);
            }
          }, [vHtml]);

          // file input for images
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
                console.warn("Editor not ready for image insertion");
              }
            } catch (err) {
              console.error("Image upload failed", err);
              alert("Image upload failed");
            }
          };

          // insert table (guard)
          const handleInsertTable = () => {
            const ed = editorRef.current;
            if (!ed) {
              alert("Editor not ready");
              return;
            }
            // many versions attach insertTable to commands - guard both forms
            try {
              if (
                ed.commands &&
                typeof ed.commands.insertTable === "function"
              ) {
                ed.chain()
                  .focus()
                  .insertTable({ rows: 2, cols: 2, withHeaderRow: true })
                  .run();
                return;
              }
              // some builds provide createTable or table commands; best-effort fallback:
              if (ed.chain && ed.chain().insertTable) {
                ed.chain().focus().insertTable({ rows: 2, cols: 2 }).run();
                return;
              }
              alert("Table feature not available in this build.");
            } catch (err) {
              console.error("Insert table error", err);
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
                        const src = ed?.getAttributes("image")?.src;
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
                          const ed = editorRef.current;
                          if (!ed) return;
                          const alt = e.target.value || null;
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
                          const ed = editorRef.current;
                          if (!ed) return;
                          const title = e.target.value || null;
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
                      onClick={() =>
                        editorRef.current
                          ?.chain()
                          ?.focus()
                          ?.deleteSelection()
                          ?.run()
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
