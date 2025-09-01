// src/components/common/SafeQuill.jsx
import React from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

export default function SafeQuill(props) {
  if (typeof window === "undefined") {
    // SSR-safe: don’t load editor on server
    return <div>Loading editor...</div>;
  }
  return <ReactQuill {...props} />;
}
