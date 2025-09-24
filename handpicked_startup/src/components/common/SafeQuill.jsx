// src/components/common/SafeQuill.jsx
import React, { useEffect, useState, forwardRef } from "react";

const SafeQuill = forwardRef((props, ref) => {
  const [Editor, setEditor] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // load Quill core + table plugin + styles (client only)
        const QuillModule = await import("quill");
        const Quill = QuillModule.default || QuillModule;

        // register quill-better-table (if installed)
        try {
          const QBetter = await import("quill-better-table");
          const QBetterDefault = QBetter.default || QBetter;
          await import("quill-better-table/dist/quill-better-table.css");
          // register under modules/better-table
          Quill.register({ "modules/better-table": QBetterDefault }, true);
        } catch (tblErr) {
          // plugin not installed or failed — log but continue
          console.warn("quill-better-table not available:", tblErr);
        }

        // now load the react-quill wrapper and theme css
        const mod = await import("react-quill-new");
        await import("react-quill-new/dist/quill.snow.css");

        if (mounted) {
          setEditor(() => mod.default);
        }
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
