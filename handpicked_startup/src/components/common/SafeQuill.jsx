// src/components/common/SafeQuill.jsx
import React, { useEffect, useState, forwardRef } from "react";
import { uploadBlogImage } from "../../services/blogService";

/**
 * Convert dataURL -> File
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

  // Lazy-load the Quill editor (client-side)
  useEffect(() => {
    let mounted = true;
    if (typeof window === "undefined") return; // guard SSR/build
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

  // Attach handlers only in browser and when Editor and ref are ready
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!Editor || !ref) return;

    let cancelled = false;
    let removePasteListener = () => {};

    (async () => {
      // wait for forwarded ref to become available
      let editor = null;
      for (let i = 0; i < 20; i++) {
        editor = ref.current?.getEditor?.();
        if (editor) break;
        // small delay
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 50));
      }
      if (!editor || cancelled) return;

      // Try to import Delta client-side only; if it fails, fallback to plain empty ops
      let DeltaClass = null;
      try {
        // dynamic import only runs in browser; bundler won't error because inside effect with window guard
        // but still wrap in try/catch to be safe
        // eslint-disable-next-line global-require
        const Quill = (await import("quill")).default;
        DeltaClass = Quill.import ? Quill.import("delta") : null;
      } catch (e) {
        // fallback to null; we'll use simple empty-delta object instead
        DeltaClass = null;
      }

      // Clipboard matcher to catch <img src="data:...">
      const clipboardHandler = (node, delta) => {
        try {
          const src = (node && node.getAttribute && node.getAttribute("src")) || "";
          if (typeof src === "string" && src.startsWith("data:image/")) {
            const sel = editor.getSelection(true);
            const insertIndex = (sel && sel.index) || editor.getLength();
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
            if (DeltaClass) return new DeltaClass();
            return { ops: [] };
          }
        } catch (err) {
          console.error("clipboardHandler error:", err);
        }
        return delta;
      };

      try {
        editor.clipboard.addMatcher("img", clipboardHandler);
      } catch (e) {
        console.warn("Failed to add clipboard matcher:", e);
      }

      // Handle paste of image files (clipboard file items)
      const onPaste = (e) => {
        try {
          const items = e.clipboardData?.items;
          if (!items) return;
          const imageFiles = [];
          for (let i = 0; i < items.length; i++) {
            const it = items[i];
            if (it && it.kind === "file" && it.type && it.type.startsWith("image/")) {
              const f = it.getAsFile();
              if (f) imageFiles.push(f);
            }
          }
          if (!imageFiles.length) return;
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

      try {
        editor.root.addEventListener("paste", onPaste);
        removePasteListener = () => {
          try {
            editor.root.removeEventListener("paste", onPaste);
          } catch (e) {
            /* ignore */
          }
        };
      } catch (e) {
        console.warn("Failed to attach paste listener:", e);
      }
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
