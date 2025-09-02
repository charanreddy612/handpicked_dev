// SafeQuill.jsx
import React, { useEffect, useState } from "react";

export default function SafeQuill(props) {
  const [Editor, setEditor] = useState(null);

  useEffect(() => {
    (async () => {
      const mod = await import("react-quill-new");
      await import("react-quill-new/dist/quill.snow.css");
      setEditor(() => mod.default);
    })();
  }, []);

  if (!Editor) return <div>Loading editor...</div>;
  return <Editor {...props} />;
}
