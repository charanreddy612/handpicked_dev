// src/components/common/SafeQuill.jsx
import React, { useEffect, useState } from "react";
import "quill/dist/quill.snow.css"; // ✅ correct for react-quill-new

let ReactQuill = null;

export default function SafeQuill(props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      ReactQuill = require("react-quill-new"); // ✅ stable package for React 18
      setMounted(true);
    }
  }, []);

  if (!mounted || !ReactQuill) {
    return <div>Loading editor...</div>;
  }

  const Editor = ReactQuill.default || ReactQuill;
  return <Editor {...props} />;
}
