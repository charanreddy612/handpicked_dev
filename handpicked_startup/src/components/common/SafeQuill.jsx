// src/components/common/SafeQuill.jsx
import React, { useEffect, useState, forwardRef } from "react";

const SafeQuill = forwardRef((props, ref) => {
  const [Editor, setEditor] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // 1) load Quill (runtime-only). @vite-ignore prevents Vite static resolution.
        const QuillModule = await import(/* @vite-ignore */ "quill");
        const Quill = QuillModule.default || QuillModule;

        // 2) ensure a single global Quill instance so registration affects react-quill-new
        if (typeof window !== "undefined") {
          if (!window.Quill) window.Quill = Quill;
          else if (window.Quill !== Quill) window.Quill = Quill;
        }

        // 3) try register quill-better-table on that Quill instance
        try {
          const QBetter = await import(/* @vite-ignore */ "quill-better-table");
          const QBetterDefault = QBetter.default || QBetter;
          // register under module id Quill expects; allow override
          Quill.register({ "modules/better-table": QBetterDefault }, true);
          Quill.register({ "better-table": QBetterDefault }, true);
          await import(
            /* @vite-ignore */ "quill-better-table/dist/quill-better-table.css"
          );
        } catch (tblErr) {
          // plugin missing or failed — continue gracefully
          console.warn(
            "quill-better-table not available or failed to register:",
            tblErr
          );
        }

        // 4) finally import react-quill-new (after registration)
        const mod = await import(/* @vite-ignore */ "react-quill-new");
        await import(/* @vite-ignore */ "react-quill-new/dist/quill.snow.css");

        if (mounted) setEditor(() => mod.default);
      } catch (err) {
        console.error("Failed to load Quill editor:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);
  if (!Editor) {
    return <div>Loading editor...</div>; // SSR-safe placeholder
  }

  return <Editor ref={ref} {...props} />;
});

export default SafeQuill;
