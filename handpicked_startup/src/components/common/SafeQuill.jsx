// src/components/common/SafeQuill.jsx
import React, { useEffect, useState, forwardRef } from "react";
import { uploadBlogImage } from "../../services/blogService";

/**
 * Convert a dataURL (base64) to a File object
 */
function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

const SafeQuill = forwardRef((props, ref) => {
  const [Editor, setEditor] = useState(null);

  // Lazy-load the Quill editor (keeps your current behavior)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import("react-quill-new");
        await import("react-quill-new/dist/quill.snow.css");
        if (mounted) setEditor(() => mod.default);
      } catch (err) {
        console.error("Failed to load Quill editor:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Attach paste / clipboard handlers after the editor instance exists
  useEffect(() => {
    if (!Editor || !ref) return;
    let cancelled = false;
    let removePasteListener = () => {};

    (async () => {
      // wait briefly for forwarded ref to mount the underlying editor
      let editor = null;
      for (let i = 0; i < 20; i++) {
        editor = ref.current?.getEditor?.();
        if (editor) break;
        // small delay
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 50));
      }
      if (!editor || cancelled) return;

      // Attempt to import Quill's Delta for returning an empty Delta from matcher
      let DeltaClass = null;
      try {
        const QuillModule = (await import("quill")).default;
        DeltaClass = QuillModule.import("delta");
      } catch (e) {
        // fallback: will return a plain empty delta object if import fails
        console.warn("Could not import Quill Delta; using fallback.", e);
      }

      // Clipboard matcher: intercept <img src="data:..."> nodes (base64)
      const clipboardHandler = (node, delta) => {
        try {
          const src =
            (node && node.getAttribute && node.getAttribute("src")) || "";
          if (typeof src === "string" && src.startsWith("data:image/")) {
            const sel = editor.getSelection(true);
            const insertIndex = (sel && sel.index) || editor.getLength();

            // Async upload then insert the returned URL at the saved index
            (async () => {
              try {
                const file = dataURLtoFile(src, `pasted-${Date.now()}.png`);
                const res = await uploadBlogImage(file);
                const url = res?.url || res;
                if (url) {
                  editor.insertEmbed(insertIndex, "image", url);
                  editor.setSelection(insertIndex + 1);
                }
              } catch (err) {
                console.error("Failed to upload pasted image:", err);
              }
            })();

            // prevent base64 from being inserted
            if (DeltaClass) return new DeltaClass();
            return { ops: [] };
          }
        } catch (err) {
          console.error("clipboardHandler error:", err);
        }
        return delta;
      };

      editor.clipboard.addMatcher("img", clipboardHandler);

      // Paste event listener: handles image files from clipboard (file-kind items)
      const onPaste = (e) => {
        try {
          const items = e.clipboardData?.items;
          if (!items) return;

          const imageFiles = [];
          // collect image files from clipboard
          // eslint-disable-next-line no-plusplus
          for (let i = 0; i < items.length; i++) {
            const it = items[i];
            if (
              it &&
              it.kind === "file" &&
              it.type &&
              it.type.startsWith("image/")
            ) {
              const f = it.getAsFile();
              if (f) imageFiles.push(f);
            }
          }
          if (!imageFiles.length) return; // nothing to do

          // prevent default insertion; we will upload + insert
          e.preventDefault();
          const sel = editor.getSelection(true);
          let idx = (sel && sel.index) || editor.getLength();

          (async () => {
            for (const file of imageFiles) {
              try {
                const res = await uploadBlogImage(file);
                const url = res?.url || res;
                if (url) {
                  editor.insertEmbed(idx, "image", url);
                  idx += 1;
                  editor.setSelection(idx);
                }
              } catch (err) {
                console.error("Failed to upload clipboard image file:", err);
              }
            }
          })();
        } catch (err) {
          console.error("onPaste handler failed:", err);
        }
      };

      editor.root.addEventListener("paste", onPaste);
      removePasteListener = () => {
        try {
          editor.root.removeEventListener("paste", onPaste);
        } catch (err) {
          /* ignore cleanup errors */
        }
      };
    })();

    return () => {
      cancelled = true;
      try {
        removePasteListener();
      } catch (e) {
        /* ignore */
      }
    };
  }, [Editor, ref]);

  if (!Editor) return <div>Loading editor...</div>;

  return (
    <div className="safe-quill flex flex-col h-[300px]">
      <Editor ref={ref} {...props} />
    </div>
  );
});

export default SafeQuill;
