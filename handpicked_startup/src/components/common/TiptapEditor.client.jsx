// src/components/common/TiptapEditor.client.jsx
import React, { useEffect, useState, useRef } from "react";

/**
 * Minimal, robust TipTap client loader.
 * - Dynamically imports TipTap in browser only.
 * - Supports bold/italic/underline/lists/headings/link/image/codeblock.
 * - No table, no BubbleMenu (these caused your failures).
 *
 * Props:
 * - valueHtml (string)
 * - onUpdate (html, json)
 * - uploadImage (async file -> url)
 * - className
 */
export default function TiptapEditorClient(props) {
  const { valueHtml = "", onUpdate, uploadImage, className = "" } = props;
  const [EditorInner, setEditorInner] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const tiptap = await import("@tiptap/react");
        const StarterKit = (await import("@tiptap/starter-kit")).default;
        const Underline = (await import("@tiptap/extension-underline")).default;
        const Link = (await import("@tiptap/extension-link")).default;
        const Image = (await import("@tiptap/extension-image")).default;
        const Placeholder = (await import("@tiptap/extension-placeholder"))
          .default;

        if (!mounted) return;

        const EditorContent =
          tiptap.EditorContent ?? tiptap.default?.EditorContent;
        const useEditor = tiptap.useEditor ?? tiptap.default?.useEditor;

        function EditorInnerCmp({
          valueHtml: vHtml,
          onUpdate: onUpd,
          uploadImage: upImg,
          className: cls,
        }) {
          const editor = useEditor({
            extensions: [
              StarterKit.configure({ history: true }),
              Underline,
              Link.configure({ openOnClick: true }),
              Image,
              Placeholder.configure({ placeholder: "Write here..." }),
            ],
            content: vHtml || "<p></p>",
            onUpdate: ({ editor }) => {
              try {
                const html = editor.getHTML();
                const json = editor.getJSON();
                onUpd?.(html, json);
              } catch (err) {
                console.error("editor onUpdate failed", err);
              }
            },
          });

          // image input and upload
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

          // simple image alt/title editor (shows when an img inside editor is clicked)
          const containerRef = useRef(null);
          const [selectedImage, setSelectedImage] = useState(null); // { src, alt, title, nodePos }

          useEffect(() => {
            if (!containerRef.current) return;
            const root = containerRef.current;
            const onClick = (ev) => {
              const img =
                ev.target && ev.target.tagName === "IMG" ? ev.target : null;
              if (!img) {
                setSelectedImage(null);
                return;
              }
              // get current attributes from editor (best-effort)
              try {
                const attrs = editor?.getAttributes?.("image") ?? {};
                // But attrs corresponds to selection; we'll read DOM attributes for reliability
                setSelectedImage({
                  src: img.getAttribute("src"),
                  alt: img.getAttribute("alt") || "",
                  title: img.getAttribute("title") || "",
                  // node position isn't reliable across builds; we'll update by replacing the img node by src match
                });
              } catch (err) {
                setSelectedImage({
                  src: img.src,
                  alt: img.alt || "",
                  title: img.title || "",
                });
              }
            };
            root.addEventListener("click", onClick);
            return () => root.removeEventListener("click", onClick);
          }, [editor]);

          const updateSelectedImageAttr = (patch) => {
            if (!selectedImage) return;
            try {
              // find image nodes and update attributes when src matches
              const json = editor.getJSON();
              const walk = (node, path = []) => {
                if (!node) return null;
                if (
                  node.type === "image" &&
                  node.attrs &&
                  node.attrs.src === selectedImage.src
                ) {
                  return { node, path };
                }
                if (node.content && Array.isArray(node.content)) {
                  for (let i = 0; i < node.content.length; i++) {
                    const found = walk(node.content[i], path.concat(i));
                    if (found) return found;
                  }
                }
                return null;
              };
              const found = walk(json);
              if (!found) {
                // fallback: update all images with matching src using chain().updateAttributes
                editor
                  .chain()
                  .focus()
                  .updateAttributes("image", { ...patch })
                  .run();
                // this will update the *selection* image; not perfect but simple fallback
              } else {
                // compute a selection to that node using transaction if possible
                // simpler approach: replace every image with same src by re-setting attributes via editor.commands
                const currentAttrs = found.node.attrs || {};
                const newAttrs = { ...currentAttrs, ...patch };
                // Use updateAttributes (this updates selected node only), so ensure we select that node first
                // select node by searching for the occurrence in document text isn't trivial; use a simple replace:
                editor
                  .chain()
                  .focus()
                  .updateAttributes("image", newAttrs)
                  .run();
              }
              setSelectedImage((s) => ({ ...s, ...patch }));
            } catch (err) {
              console.error("updateSelectedImageAttr failed", err);
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
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "p") editor.chain().focus().setParagraph().run();
                    else
                      editor
                        .chain()
                        .focus()
                        .toggleHeading({ level: Number(v) })
                        .run();
                    e.target.value = "p";
                  }}
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
                ref={containerRef}
                className="border rounded bg-white min-h-[240px]"
              >
                {editor ? (
                  <EditorContent editor={editor} />
                ) : (
                  <div className="p-4">Loading editor...</div>
                )}
              </div>

              {/* simple inline image editor */}
              {selectedImage && (
                <div className="mt-2 border rounded p-2 bg-white max-w-md">
                  <div className="font-medium mb-2">Image</div>
                  <div className="text-xs text-gray-600 mb-2 break-all">
                    {selectedImage.src}
                  </div>

                  <label className="block mb-2">
                    Alt:
                    <input
                      className="w-full border px-2 py-1 rounded mt-1"
                      value={selectedImage.alt}
                      onChange={(e) =>
                        setSelectedImage((s) => ({ ...s, alt: e.target.value }))
                      }
                      onBlur={(e) =>
                        updateSelectedImageAttr({ alt: e.target.value || null })
                      }
                    />
                  </label>

                  <label className="block mb-2">
                    Title:
                    <input
                      className="w-full border px-2 py-1 rounded mt-1"
                      value={selectedImage.title}
                      onChange={(e) =>
                        setSelectedImage((s) => ({
                          ...s,
                          title: e.target.value,
                        }))
                      }
                      onBlur={(e) =>
                        updateSelectedImageAttr({
                          title: e.target.value || null,
                        })
                      }
                    />
                  </label>

                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 border rounded"
                      onClick={() => {
                        // delete image: replace selection if possible
                        try {
                          editor.chain().focus().deleteSelection().run();
                          setSelectedImage(null);
                        } catch (err) {
                          console.error("delete image fail", err);
                        }
                      }}
                    >
                      Delete image
                    </button>
                    <button
                      className="px-3 py-1 border rounded"
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
