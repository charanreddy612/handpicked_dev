// src/components/common/SafeQuill.jsx
import React, { useEffect, useState } from "react";

export default function SafeQuill(props) {
  const [Editor, setEditor] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // dynamically import only on client
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
  return <Editor {...props} />;
}
