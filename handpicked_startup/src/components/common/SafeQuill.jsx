// src/components/common/SafeQuill.jsx
import React, { useEffect, useState, forwardRef } from "react";

const SafeQuill = forwardRef((props, ref) => {
  const [Editor, setEditor] = useState(null);

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

  if (!Editor) return <div>Loading editor...</div>;

  return (
    <div className="safe-quill flex flex-col h-[300px]">
      {" "}
      {/* adjustable height */}
      <Editor ref={ref} {...props} />
    </div>
  );
});

export default SafeQuill;
