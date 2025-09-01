// src/components/common/SafeQuill.jsx
import React, { useEffect, useState } from "react";

let ReactQuill = null;

export default function SafeQuill(props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load only on client
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      ReactQuill = require("react-quill");
      require("react-quill/dist/quill.snow.css");
      setMounted(true);
    }
  }, []);

  if (!mounted || !ReactQuill) {
    return <div>Loading editor...</div>;
  }

  const Editor = ReactQuill.default || ReactQuill;
  return <Editor {...props} />;
}
